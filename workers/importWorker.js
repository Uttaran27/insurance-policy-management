
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

const isDuplicateKey = (error) =>
    error?.code === 11000 || error?.cause?.code === 11000;

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
                const firstName = getValue(row, "First Name");
                const username = getValue(row, "Username").toLowerCase();
                const email = getValue(row, "Email").toLowerCase();
                const policyNumber = getValue(row, "Policy Number");

                if (!policyNumber) {
                    throw new Error("Policy Number is required");
                }

                if (!firstName) {
                    throw new Error("First Name is required");
                }

                if (!username && !email) {
                    throw new Error("Username or Email is required");
                }

                // 1. Create or reuse Agent.
                let agentId = null;
                const agentName = cleanLabel(getValue(row, "Agent Name"));

                if (agentName) {
                    const agent = await findOrCreate(
                        Agent,
                        { agentName },
                        { agentName }
                    );

                    agentId = agent._id;
                }

                // 2. Create or reuse Account.
                let accountId = null;
                const accountName = cleanLabel(getValue(row, "Account Name"));

                if (accountName) {
                    const account = await findOrCreate(
                        Account,
                        { accountName },
                        { accountName }
                    );

                    accountId = account._id;
                }

                // 3. Create or reuse User. Empty cells are omitted so a
                // partial re-import does not wipe stored values.
                const userData = { firstName };

                assignIfPresent(userData, "username", username);
                assignIfPresent(userData, "email", email);
                assignIfPresent(userData, "address", getValue(row, "Address"));
                assignIfPresent(userData, "phone", getValue(row, "Phone"));
                assignIfPresent(userData, "state", getValue(row, "State"));
                assignIfPresent(userData, "zipCode", getValue(row, "Zip Code"));
                assignIfPresent(userData, "gender", getValue(row, "Gender"));
                assignIfPresent(userData, "userType", getValue(row, "User Type"));

                const dob = parseDate(getValue(row, "DOB"), "DOB");

                if (dob) {
                    userData.DOB = dob;
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
                const categoryName = cleanLabel(getValue(row, "Policy Category"));

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
                const companyName = cleanLabel(getValue(row, "Company Name"));

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
                    getValue(row, "Policy Start Date"),
                    "Policy Start Date"
                );
                const policyEndDate = parseDate(
                    getValue(row, "Policy End Date"),
                    "Policy End Date"
                );

                if (policyStartDate) {
                    policyData.policyStartDate = policyStartDate;
                }

                if (policyEndDate) {
                    policyData.policyEndDate = policyEndDate;
                }

                if (categoryId) {
                    policyData.categoryId = categoryId;
                }

                if (carrierId) {
                    policyData.carrierId = carrierId;
                }

                await Policy.findOneAndUpdate(
                    { policyNumber },
                    {
                        $set: policyData,
                        $setOnInsert: { policyNumber }
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
        }
    }

    parentPort.postMessage(result);
};

importFile();
