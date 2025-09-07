const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");

const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Documentação disponível em: https://teste-api-oc.onrender.com/api-docs");
};

module.exports = swaggerDocs;
