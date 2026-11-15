
const mongoose = require("mongoose");

const collation = { locale: "en", strength: 2 };

const accountSchema = new mongoose.Schema(
    {
        accountName: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        collation
    }
);

accountSchema.index({ accountName: 1 }, { unique: true, collation });

module.exports = mongoose.model("Account", accountSchema, "accounts");
