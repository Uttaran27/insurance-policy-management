
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
    {
        accountName: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Account", accountSchema, "accounts");
