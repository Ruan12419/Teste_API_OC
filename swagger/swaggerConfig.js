const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Pagamentos",
      version: "1.0.0",
      description: "Documentação da API para controle de pagamentos",
    },
    servers: [
      {
        url: "https://teste-api-oc.onrender.com",
      },
    ],
    components: {
      schemas: {
        NovoPagamento: {
          type: "object",
          required: ["items", "payment_method_id", "transaction_amount"],
          properties: {
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                product_name: { type: "string" },
                description: { type: "string" },
                picture_url: { type: "string", format: "uri" },
                category_id: { type: "string" },
                quantity: { type: "integer" },
                price: { type: "number" },
                type: { type: "string" },
                event_date: { type: "string", format: "date-time" },
                due_time: { type: "integer" },
                warranty: { type: "boolean" },
              },
            },
            shipments: {
              type: "object",
              properties: {
                receiver_address: {
                  type: "object",
                  properties: {
                    zip_code: { type: "string" },
                    state_name: { type: "string" },
                    city_name: { type: "string" },
                    street_name: { type: "string" },
                    street_number: { type: "integer" },
                  },
                },
              },
            },
            description: { type: "string" },
            payment_method_id: { type: "string" },
            token: { type: "string" },
            transaction_amount: { type: "number" },
          },
        },
        EfetuarPagamento: {
          type: "object",
          required: ["pagador", "produto"],
          properties: {
            pagador: {
              type: "object",
              properties: {
                first_name: { type: "string" },
                last_name: { type: "string" },
                phone: {
                  type: "object",
                  properties: {
                    area_code: { type: "integer" },
                    number: { type: "string" },
                  },
                },
                valor_pago: { type: "number" },
                address: {
                  type: "object",
                  properties: {
                    zip_code: { type: "string" },
                    street_name: { type: "string" },
                    street_number: { type: "integer" },
                    neighborhood: { type: "string" },
                    city: { type: "integer" },
                    federal_unit: { type: "integer" },
                  },
                },
                payer: {
                  type: "object",
                  properties: {
                    entity_type: { type: "string" },
                    type: { type: "string" },
                    email: { type: "string", format: "email" },
                    identification: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        number: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
            produto: {
              type: "object",
              properties: {
                idProduct: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  apis: ["../routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
