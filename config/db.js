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
        console.log("db indexes ready");

        await syncModelIndexes(Policy);
        await syncModelIndexes(Message);
        await syncModelIndexes(ScheduledPost);

        const target = mongoTarget(mongoUri);
        console.log(`MongoDB connected db=${target.db} host=${target.host}`);
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

const dropIndexByKey = async (collection, key) => {
    try {
        const indexes = await collection.indexes();
        const existing = indexes.find((index) => sameKey(index.key, key));

        if (!existing || existing.name === "_id_") {
            return;
        }

        await collection.dropIndex(existing.name);
    } catch (error) {
        console.error(
            `Index drop failed for ${collection.collectionName} ${JSON.stringify(key)}:`,
            error.message
        );
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

    await dropIndexByKey(Agent.collection, { agentName: 1 });
    await dropIndexByKey(Account.collection, { accountName: 1 });
    await dropIndexByKey(Policy.collection, { policyNumber: 1 });

    await ensureIndex(Agent.collection, { agent: 1 }, {
        unique: true,
        collation: NAME_COLLATION,
        name: "agent_unique_ci"
    });

    await ensureIndex(Account.collection, { account_name: 1 }, {
        unique: true,
        collation: NAME_COLLATION,
        name: "account_name_unique_ci"
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
