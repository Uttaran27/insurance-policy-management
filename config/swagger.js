
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const routeFiles = path
    .join(__dirname, "../routes")
    .replace(/\\/g, "/");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Insurance Policy Management API",
            version: "1.0.0",
            description:
                "API documentation for Insurance Policy Management System. Send the API key in the x-api-key header."
        },

        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "x-api-key"
                }
            }
        },

        security: [
            { ApiKeyAuth: [] }
        ],

        servers: [
            {
                url: "https://insurance-policy-management-d6no.onrender.com",
                description: "Production server (Render)"
            },
            {
                url: "http://localhost:5000",
                description: "Local development server"
            }
        ]
    },

    apis: [`${routeFiles}/*.js`]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
