
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Insurance Policy Management API",
            version: "1.0.0",
            description:
                "API documentation for Insurance Policy Management System"
        },

        servers: [
            {
                url: "http://localhost:5000",
                description: "Local Development Server"
            }
        ]
    },

    apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
