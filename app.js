const express = require('express');
const fs = require('fs');
const pagamentoRoutes = require('./routes/pagamentoRoutes');

const swaggerDocs = require("./swagger/swaggerDocs");

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  next();
});

global.pagamentos_efetuados = {};
global.pagamentos = JSON.parse(fs.readFileSync('./data/pagamento.json', 'utf8'));
global.status_pagamento = JSON.parse(fs.readFileSync('./data/status_pagamento.json', 'utf8'));
global.dados = JSON.parse(fs.readFileSync('./data/faq.json', 'utf8'));
global.statusBase = "pending";

app.use('/', pagamentoRoutes);

swaggerDocs(app);

module.exports = app;
