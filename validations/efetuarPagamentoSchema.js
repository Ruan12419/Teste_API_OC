const Joi = require("joi");

const efetuarPagamentoSchema = Joi.object({
  pagador: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone: Joi.object({
      area_code: Joi.number().integer().required(),
      number: Joi.string().required()
    }),
    valor_pago: Joi.number(),
    address: Joi.object({
      zip_code: Joi.string().required(),
      street_name: Joi.string().required(),
      street_number: Joi.number().integer().required(),
      neighborhood: Joi.any().optional(),
      city: Joi.number().required(),
      federal_unit: Joi.number().required()
    }),
    payer: Joi.object({
      entity_type: Joi.string().required(),
      type: Joi.string().required(),
      email: Joi.string().email().required(),
      identification: Joi.object({
        type: Joi.string().required(),
        number: Joi.string().required()
      }).required()
    })
  }).required(),
  produto: Joi.object({
    idProduct: Joi.string().required()
  }).required()
});

module.exports = efetuarPagamentoSchema;
