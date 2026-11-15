const mongoose = require("mongoose");

const User = require("../models/User");
const Agent = require("../models/Agent");
const Account = require("../models/Account");
const LOB = require("../models/LOB");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");
const Message = require("../models/Message");
const ScheduledPost = require("../models/ScheduledPost");

const NAME_COLLATION = { locale: "en", strength: 2 };

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (typeof mongoUri !== "string" || mongoUri.trim() === "") {
            console.error("MONGO_URI is missing from .env");
            process.exit(1);
        }

        // Indexes are created explicitly so an older non-unique index
        // can be replaced without failing the connection.
        mongoose.set("autoIndex", false);

        await mongoose.connect(mongoUri, {
            maxPoolSize: 10
        });

        await ensureIntegrityIndexes();
        await syncModelIndexes(Policy);
        await syncModelIndexes(Message);
        await syncModelIndexes(ScheduledPost);

        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const sameKey = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const collationMatches = (existing, expected) => {
    if (!expected) {
        return !existing;
    }

    if (!existing) {
        return false;
    }

    return existing.locale === expected.locale
        && existing.strength === expected.strength;
};

const syncModelIndexes = async (model) => {
    try {
        await model.init();
    } catch (error) {
        console.error(`Index setup failed for ${model.modelName}:`, error.message);
    }
};

const ensureIndex = async (collection, key, options) => {
    try {
        const indexes = await collection.indexes();
        const existing = indexes.find((index) => sameKey(index.key, key));

        const alreadyMatches = existing
            && Boolean(existing.unique) === Boolean(options.unique)
            && Boolean(existing.sparse) === Boolean(options.sparse)
            && collationMatches(existing.collation, options.collation);

        if (alreadyMatches) {
            return;
        }

        if (existing) {
            await collection.dropIndex(existing.name);
        }

        await collection.createIndex(key, options);
    } catch (error) {
        console.error(
            `Index setup failed for ${collection.collectionName} ${JSON.stringify(key)}:`,
            error.message
        );
    }
};

const ensureIntegrityIndexes = async () => {
    await ensureIndex(User.collection, { username: 1 }, {
        unique: true,
        sparse: true,
        name: "username_unique"
    });

    await ensureIndex(User.collection, { email: 1 }, {
        unique: true,
        sparse: true,
        name: "email_unique"
    });

    await ensureIndex(Agent.collection, { agentName: 1 }, {
        unique: true,
        collation: NAME_COLLATION,
        name: "agentName_unique_ci"
    });

    await ensureIndex(Account.collection, { accountName: 1 }, {
        unique: true,
        collation: NAME_COLLATION,
        name: "accountName_unique_ci"
    });

    await ensureIndex(LOB.collection, { category_name: 1 }, {
        unique: true,
        collation: NAME_COLLATION,
        name: "category_name_unique_ci"
    });

    await ensureIndex(Carrier.collection, { company_name: 1 }, {
        unique: true,
        collation: NAME_COLLATION,
        name: "company_name_unique_ci"
    });
};

module.exports = connectDB;
