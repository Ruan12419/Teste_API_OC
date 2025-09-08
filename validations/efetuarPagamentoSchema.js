const Joi = require("joi");

const efetuarPagamentoSchema = Joi.object({
  pagador: Joi.object({
    first_name: Joi.string(),
    last_name: Joi.string(),
    phone: Joi.object({
      area_code: Joi.number().integer(),
      number: Joi.string()
    }),
    valor_pago: Joi.number(),
    address: Joi.object({
      zip_code: Joi.string(),
      street_name: Joi.string(),
      street_number: Joi.number().integer(),
      neighborhood: Joi.any().optional(),
      city: Joi.number(),
      federal_unit: Joi.number()
    }),
    payer: Joi.object({
      entity_type: Joi.string(),
      type: Joi.string(),
      email: Joi.string().email(),
      identification: Joi.object({
        type: Joi.string(),
        number: Joi.string()
      })
    })
  }),
  produto: Joi.object({
    idProduct: Joi.string()
  })
});

module.exports = efetuarPagamentoSchema;
