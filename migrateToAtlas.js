
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

const collections = [
    "agents",
    "users",
    "accounts",
    "lobs",
    "carriers",
    "policies",
    "scheduledposts",
    "messages"
];

async function migrate() {
    let localDB;
    let atlasDB;

    try {
        console.log("Connecting to local MongoDB...");

        localDB = await mongoose.createConnection(
            process.env.MONGO_URI_LOCAL
        ).asPromise();

        console.log("Connected to local MongoDB!");

        console.log("Connecting to MongoDB Atlas...");

        atlasDB = await mongoose.createConnection(
            process.env.MONGO_URI_ATLAS
        ).asPromise();

        console.log("Connected to MongoDB Atlas!");

        let totalDocuments = 0;

        for (const name of collections) {
            console.log(`\nMigrating collection: ${name}`);

            const localCollection = localDB.db.collection(name);
            const atlasCollection = atlasDB.db.collection(name);

            const documents = await localCollection
                .find({})
                .toArray();

            if (documents.length === 0) {
                console.log(`${name}: No local documents found.`);
                continue;
            }

            const operations = documents.map((document) => ({
                replaceOne: {
                    filter: { _id: document._id },
                    replacement: document,
                    upsert: true
                }
            }));

            const result = await atlasCollection.bulkWrite(
                operations,
                { ordered: false }
            );

            const atlasCount = await atlasCollection.countDocuments();

            totalDocuments += documents.length;

            console.log(`${name}:`);
            console.log(`Local documents: ${documents.length}`);
            console.log(`Inserted: ${result.upsertedCount}`);
            console.log(`Updated: ${result.modifiedCount}`);
            console.log(`Atlas documents after migration: ${atlasCount}`);
        }

        console.log("\n================================");
        console.log("MIGRATION COMPLETED SUCCESSFULLY");
        console.log(`Collections processed: ${collections.length}`);
        console.log(`Local documents processed: ${totalDocuments}`);
        console.log("================================");

    } catch (error) {
        console.error("\nMigration failed:", error.message);
        process.exitCode = 1;

    } finally {
        if (localDB) await localDB.close();
        if (atlasDB) await atlasDB.close();
    }
}

migrate();
