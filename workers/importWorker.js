
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

// Create a record if it doesn't exist, otherwise reuse it.
const findOrCreate = async (Model, filter, data) => {
    return Model.findOneAndUpdate(
        filter,
        { $setOnInsert: data },
        {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true
        }
    );
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
        
        await mongoose.connect(mongoUri);

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
                const agentName = getValue(row, "Agent Name");

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
                const accountName = getValue(row, "Account Name");

                if (accountName) {
                    const account = await findOrCreate(
                        Account,
                        { accountName },
                        { accountName }
                    );

                    accountId = account._id;
                }

                // 3. Create or reuse User.
                const userFilter = username
                    ? { username }
                    : { email };

                const userData = {
                    firstName,
                    username: username || undefined,
                    DOB: parseDate(getValue(row, "DOB"), "DOB"),
                    address: getValue(row, "Address"),
                    phone: getValue(row, "Phone"),
                    state: getValue(row, "State"),
                    zipCode: getValue(row, "Zip Code"),
                    email: email || undefined,
                    gender: getValue(row, "Gender"),
                    userType: getValue(row, "User Type"),
                    ...(agentId && { agentId }),
                    ...(accountId && { accountId })
                };

                const user = await User.findOneAndUpdate(
                    userFilter,
                    { $set: userData },
                    {
                        upsert: true,
                        returnDocument: "after",
                        setDefaultsOnInsert: true,
                        runValidators: true
                    }
                );

                // 4. Create or reuse Policy Category.
                let categoryId = null;
                const categoryName = getValue(row, "Policy Category");

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
                const companyName = getValue(row, "Company Name");

                if (companyName) {
                    const carrier = await findOrCreate(
                        Carrier,
                        { company_name: companyName },
                        { company_name: companyName }
                    );

                    carrierId = carrier._id;
                }

                // 6. Create or update Policy.
                const policyData = {
                    policyStartDate: parseDate(
                        getValue(row, "Policy Start Date"),
                        "Policy Start Date"
                    ),
                    policyEndDate: parseDate(
                        getValue(row, "Policy End Date"),
                        "Policy End Date"
                    ),
                    userId: user._id,
                    categoryId,
                    carrierId
                };

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
                    error: error.message
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
        result = {
            success: false,
            message: error.message
        };
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }

    parentPort.postMessage(result);
};

importFile();
