const Joi = require("joi");

const criarPagamentoSchema = Joi.object({
  items: Joi.object({
    id: Joi.string().required(),
    product_name: Joi.string().required(),
    description: Joi.string().required(),
    picture_url: Joi.string().uri(),
    category_id: Joi.string(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().precision(2).positive().required(),
    type: Joi.string(),
    event_date: Joi.string().isoDate(),
    due_time: Joi.number().integer().positive(),
    warranty: Joi.boolean()
  }).required(),
  shipments: Joi.object({
    receiver_address: Joi.object({
      zip_code: Joi.string().required(),
      state_name: Joi.string().required(),
      city_name: Joi.string().required(),
      street_name: Joi.string().required(),
      street_number: Joi.number().integer().required()
    }).required(),
    width: Joi.any(),
    height: Joi.any()
  }),
  description: Joi.string(),
  payment_method_id: Joi.string(),
  token: Joi.string().required(),
  transaction_amount: Joi.number()
});

module.exports = criarPagamentoSchema;
