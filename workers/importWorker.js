
require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const fs = require("fs");

const Agent = require("../models/Agent");
const User = require("../models/User");
const Account = require("../models/Account");
const LOB = require("../models/LOB");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");

// Normalize spreadsheet column names.
const normalize = (value) =>
    String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");

// Read a value using its spreadsheet column name.
const getValue = (row, columnName) => {
    const target = normalize(columnName);

    const key = Object.keys(row).find(
        (item) => normalize(item) === target
    );

    if (!key || row[key] === null || row[key] === undefined) {
        return "";
    }

    return String(row[key]).trim();
};

// Convert spreadsheet dates into JavaScript Date objects.
const parseDate = (value, fieldName) => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid date in ${fieldName}: ${value}`);
    }

    return date;
};

const parseNumber = (value, fieldName) => {
    if (!value) return null;

    const number = Number(value);

    if (Number.isNaN(number)) {
        throw new Error(`Invalid number in ${fieldName}: ${value}`);
    }

    return number;
};

const isDuplicateKey = (error) =>
    error?.code === 11000 || error?.cause?.code === 11000;

const mongoTarget = (mongoUri) => {
    const parsed = new URL(
        mongoUri
            .replace("mongodb+srv://", "https://")
            .replace("mongodb://", "https://")
    );

    return {
        db: mongoose.connection.name,
        host: parsed.hostname
    };
};

const cleanLabel = (value) => value.replace(/\s+/g, " ").trim();

const assignIfPresent = (target, key, value) => {
    if (value === undefined || value === null || value === "") {
        return;
    }

    target[key] = value;
};

// Create a record if it doesn't exist, otherwise reuse it.
const findOrCreate = async (Model, filter, data) => {
    try {
        return await Model.findOneAndUpdate(
            filter,
            { $setOnInsert: data },
            {
                upsert: true,
                returnDocument: "after",
                setDefaultsOnInsert: true
            }
        );
    } catch (error) {
        if (!isDuplicateKey(error)) {
            throw error;
        }

        const existing = await Model.findOne(filter);

        if (!existing) {
            throw error;
        }

        return existing;
    }
};

// Match on username or email so one person is not stored twice.
const saveUser = async (userData) => {
    const filters = [];

    if (userData.username) {
        filters.push({ username: userData.username });
    }

    if (userData.email) {
        filters.push({ email: userData.email });
    }

    const matches = await User.find({ $or: filters }).limit(2);

    if (matches.length > 1) {
        throw new Error("Username and email match different users");
    }

    if (matches.length === 1) {
        return User.findByIdAndUpdate(
            matches[0]._id,
            { $set: userData },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
    }

    try {
        return await User.create(userData);
    } catch (error) {
        if (!isDuplicateKey(error)) {
            throw error;
        }

        const existing = await User.findOne({ $or: filters });

        if (!existing) {
            throw error;
        }

        return User.findByIdAndUpdate(
            existing._id,
            { $set: userData },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
    }
};

const importFile = async () => {
    let result;

    try {
        if (!fs.existsSync(workerData.filePath)) {
            throw new Error("Uploaded file not found");
        }

        const mongoUri = workerData.mongoUri || process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error("MongoDB URI is missing. Check your .env file.");
        }
        
        mongoose.set("autoIndex", false);

        await mongoose.connect(mongoUri, {
            maxPoolSize: 5
        });

        const target = mongoTarget(mongoUri);
        console.log(`db import connected db=${target.db} host=${target.host}`);

        const workbook = XLSX.readFile(workerData.filePath);

        if (!workbook.SheetNames.length) {
            throw new Error("No worksheet found in uploaded file");
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const records = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false
        });

        if (!records.length) {
            throw new Error("The uploaded file is empty");
        }

        let importedRecords = 0;
        const failedRows = [];

        for (let index = 0; index < records.length; index++) {
            const row = records[index];
            const rowNumber = index + 2;

            try {
                const firstname = getValue(row, "firstname");
                const email = getValue(row, "email").toLowerCase();
                const policyNumber = getValue(row, "policy_number");

                if (!policyNumber) {
                    throw new Error("policy_number is required");
                }

                if (!firstname) {
                    throw new Error("firstname is required");
                }

                if (!email) {
                    throw new Error("email is required");
                }

                // 1. Create or reuse Agent.
                let agentId = null;
                const agentName = cleanLabel(getValue(row, "agent"));

                if (agentName) {
                    const agent = await findOrCreate(
                        Agent,
                        { agent: agentName },
                        { agent: agentName }
                    );

                    agentId = agent._id;
                }

                // 2. Create or reuse Account.
                let accountId = null;
                const accountName = cleanLabel(getValue(row, "account_name"));
                const accountType = cleanLabel(getValue(row, "account_type"));

                if (accountName) {
                    const accountData = { account_name: accountName };

                    assignIfPresent(accountData, "account_type", accountType);

                    const account = await findOrCreate(
                        Account,
                        { account_name: accountName },
                        accountData
                    );

                    accountId = account._id;
                }

                // 3. Create or reuse User. Empty cells are omitted so a
                // partial re-import does not wipe stored values.
                const username = firstname.toLowerCase().replace(/\s+/g, ".");
                const userData = { firstname, email, username };

                assignIfPresent(userData, "address", getValue(row, "address"));
                assignIfPresent(userData, "phone", getValue(row, "phone"));
                assignIfPresent(userData, "state", getValue(row, "state"));
                assignIfPresent(userData, "zip", getValue(row, "zip"));
                assignIfPresent(userData, "city", getValue(row, "city"));
                assignIfPresent(userData, "gender", getValue(row, "gender"));
                assignIfPresent(userData, "userType", getValue(row, "userType"));
                assignIfPresent(userData, "primary", getValue(row, "primary"));
                assignIfPresent(
                    userData,
                    "applicant_id",
                    getValue(row, "Applicant ID")
                );

                const dob = parseDate(getValue(row, "dob"), "dob");

                if (dob) {
                    userData.dob = dob;
                }

                if (agentId) {
                    userData.agentId = agentId;
                }

                if (accountId) {
                    userData.accountId = accountId;
                }

                const user = await saveUser(userData);

                if (!user) {
                    throw new Error("User could not be saved");
                }

                // 4. Create or reuse Policy Category.
                let categoryId = null;
                const categoryName = cleanLabel(getValue(row, "category_name"));

                if (categoryName) {
                    const category = await findOrCreate(
                        LOB,
                        { category_name: categoryName },
                        { category_name: categoryName }
                    );

                    categoryId = category._id;
                }

                // 5. Create or reuse Policy Carrier.
                let carrierId = null;
                const companyName = cleanLabel(getValue(row, "company_name"));

                if (companyName) {
                    const carrier = await findOrCreate(
                        Carrier,
                        { company_name: companyName },
                        { company_name: companyName }
                    );

                    carrierId = carrier._id;
                }

                // 6. Create or update Policy. Null links are omitted so a
                // blank cell does not clear a carrier, category, or date.
                const policyData = {
                    userId: user._id
                };

                const policyStartDate = parseDate(
                    getValue(row, "policy_start_date"),
                    "policy_start_date"
                );
                const policyEndDate = parseDate(
                    getValue(row, "policy_end_date"),
                    "policy_end_date"
                );
                const policyMode = parseNumber(
                    getValue(row, "policy_mode"),
                    "policy_mode"
                );
                const premiumAmount = parseNumber(
                    getValue(row, "premium_amount"),
                    "premium_amount"
                );

                if (policyStartDate) {
                    policyData.policy_start_date = policyStartDate;
                }

                if (policyEndDate) {
                    policyData.policy_end_date = policyEndDate;
                }

                if (policyMode !== null) {
                    policyData.policy_mode = policyMode;
                }

                if (premiumAmount !== null) {
                    policyData.premium_amount = premiumAmount;
                }

                assignIfPresent(
                    policyData,
                    "producer",
                    cleanLabel(getValue(row, "producer"))
                );
                assignIfPresent(
                    policyData,
                    "policy_type",
                    cleanLabel(getValue(row, "policy_type"))
                );
                assignIfPresent(policyData, "csr", cleanLabel(getValue(row, "csr")));

                if (categoryId) {
                    policyData.categoryId = categoryId;
                }

                if (carrierId) {
                    policyData.carrierId = carrierId;
                }

                await Policy.findOneAndUpdate(
                    { policy_number: policyNumber },
                    {
                        $set: policyData,
                        $setOnInsert: { policy_number: policyNumber }
                    },
                    {
                        upsert: true,
                        returnDocument: "after",
                        setDefaultsOnInsert: true,
                        runValidators: true
                    }
                );

                importedRecords++;
            } catch (error) {
                failedRows.push({
                    row: rowNumber,
                    error: isDuplicateKey(error)
                        ? "This row conflicts with an existing record"
                        : error.message
                });
            }
        }

        console.log(
            `db import finished totalRecords=${records.length} importedRecords=${importedRecords} failedCount=${failedRows.length}`
        );

        result = {
            success: failedRows.length === 0,
            message:
                failedRows.length === 0
                    ? "All records imported successfully"
                    : "Import completed with some failed rows",
            totalRecords: records.length,
            importedRecords,
            failedCount: failedRows.length,
            failedRows
        };
    } catch (error) {
        console.error("Import failed:", error);

        const clientErrors = new Set([
            "Uploaded file not found",
            "No worksheet found in uploaded file",
            "The uploaded file is empty"
        ]);
        const statusCode = clientErrors.has(error.message) ? 400 : 500;

        result = {
            success: false,
            fatal: true,
            statusCode,
            message: statusCode === 400 ? error.message : "Import failed"
        };
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("db import disconnected");
        }
    }

    parentPort.postMessage(result);
};

importFile();
