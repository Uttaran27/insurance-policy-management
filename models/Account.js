const mongoose = require("mongoose");

const collation = { locale: "en", strength: 2 };

const accountSchema = new mongoose.Schema(
    {
        account_name: {
            type: String,
            required: true,
            trim: true
        },
        account_type: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true,
        collation
    }
);

accountSchema.index({ account_name: 1 }, { unique: true, collation });

module.exports = mongoose.model("Account", accountSchema, "accounts");
