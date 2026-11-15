
const mongoose = require("mongoose");

const collation = { locale: "en", strength: 2 };

const lobSchema = new mongoose.Schema(
    {
        category_name: {
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

lobSchema.index({ category_name: 1 }, { unique: true, collation });

module.exports = mongoose.model("LOB", lobSchema, "lobs");
