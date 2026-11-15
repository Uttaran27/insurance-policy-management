
const mongoose = require("mongoose");

const collation = { locale: "en", strength: 2 };

const carrierSchema = new mongoose.Schema(
    {
        company_name: {
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

carrierSchema.index({ company_name: 1 }, { unique: true, collation });

module.exports = mongoose.model("Carrier", carrierSchema, "carriers");
