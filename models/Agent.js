
const mongoose = require("mongoose");

const collation = { locale: "en", strength: 2 };

const agentSchema = new mongoose.Schema(
    {
        agentName: {
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

agentSchema.index({ agentName: 1 }, { unique: true, collation });

module.exports = mongoose.model("Agent", agentSchema, "agents");
