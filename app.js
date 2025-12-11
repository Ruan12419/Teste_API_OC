const express = require('express');
const fs = require('fs');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const clinicaRoutes = require('./routes/clinicaRoutes');

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
global.segurados = JSON.parse(fs.readFileSync('./data/segurados.json', 'utf8'));
global.agendaPath = "./data/agenda.json"
global.agendamentosPath = "./data/agendamentos.json"
global.sinistrosPath = "./data/sinistrosCriados.json"
global.agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf8'));
global.agendamentos = JSON.parse(fs.readFileSync(agendamentosPath, 'utf8'));
global.sinistros = JSON.parse(fs.readFileSync(sinistrosPath, 'utf8'));
global.statusBase = "pending";

app.use('/', pagamentoRoutes);
app.use('/clinica/', clinicaRoutes);

swaggerDocs(app);

module.exports = app;
