const { atualizarStatusPagamento } = require('../services/pagamentoService');

exports.getFaq = (req, res) => {
  res.status(200).json({ dados });
};

exports.getFaqEspecifico = (req, res) => {
  const { categoria, subcategoria } = req.params;

  const categoriaMap = {
    desenvolvimento: "Desenvolvimento",
    produto: "Gestao de Produto",
    projeto: "Gestao de Projeto"
  };

  const subcategoriaMap = {
    fullstack: "Fullstack",
    qa: "QA",
    dados: "Dados",

    produto: "Produto",
    digital: "Produto Digital",
    servicos: "Produto de Servicos",

    projeto: "Projetos",
    ageis: "Projetos Ageis",
    ti: "Projetos de TI"
  };

  const categoriaReal = categoriaMap[categoria.toLowerCase()];
  const subcategoriaReal = subcategoriaMap[subcategoria.toLowerCase()];

  try {
    if (!categoriaReal || !subcategoriaReal) {
      throw new Error("Mapeamento inválido");
    }

    const resultado = dados["FAQ"][categoriaReal][subcategoriaReal];
    
    if (!resultado) {
      throw new Error("Dados não encontrados");
    }

    res.status(200).json({ dados: resultado });
  } catch (error) {
    console.log("Categoria:", categoria);
    console.log("Subcategoria:", subcategoria);
    console.log("Erro:", error.message);
    res.status(400).json({ error: "Categoria ou subcategoria inválida" });
  }
};


exports.getPagamentos = (req, res) => {
  res.status(200).json({ pagamentos });
};

exports.getTipoPagamento = (req, res) => {
  const { tipo } = req.params;

  const tipoMap = {
    cartao: "Cartao",
    pix: "Pix",
    boleto: "Boleto"
  };

  const tipoReal = tipoMap[tipo.toLowerCase()];

  try {
    if (!tipoReal) {
      throw new Error("Tipo de pagamento inválido");
    }

    const resultado = pagamentos["Pagamento"][tipoReal];

    if (!resultado) {
      throw new Error("Informação de pagamento não encontrada");
    }

    res.status(200).json({ pagamentos: resultado });
  } catch (error) {
    console.log("Tipo:", tipo);
    console.log("Erro:", error.message);
    res.status(400).json({ error: "Tipo de pagamento inválido" });
  }
};


exports.criarPagamento = (req, res) => {
  const requestBody = req.body;
  const pagamento = requestBody.items;
  const { items, ...additional_info } = requestBody;

  if (!pagamento.id || !pagamento.due_time) {
    return res.status(400).json({ error: "ID e due_time são obrigatórios." });
  }

  pagamentos_efetuados[pagamento.id] = {
    ...pagamento,
    status: status_pagamento.pending,
    additional_info,
  };

  pagamentos_efetuados[pagamento.id].totalPrice = (pagamento.price * pagamento.quantity);

  pagamentos_efetuados[pagamento.id].timer = setTimeout(() => {
    if (pagamentos_efetuados[pagamento.id].status !== status_pagamento.completed) {
      pagamentos_efetuados[pagamento.id].status = status_pagamento.expired;
      console.log(`Pagamento ${pagamento.id} expirou. Status atualizado para "expired".`);
    }
  }, pagamento.due_time);

  const gatewayData = {
    externalGatewayId: pagamento.id,
    urlCheckout: `http://localhost:3000/checkout/${pagamento.id}`,
    pixCode: "000201010211...",
  };

  res.status(200).json({
    message: `Pagamento ${pagamento.id} iniciado. Aguardando confirmação.`,
    id: pagamento.id,
    gatewayData
  });
};

exports.efetuarPagamento = (req, res) => {
  const { pagador, produto } = req.body;
  const pagamento = pagamentos_efetuados[produto.idProduct];

  if (!pagamento) {
    return res.status(404).json({ error: "Pagamento não encontrado." });
  }

  pagamento.status = status_pagamento.processing;

  const totalEsperado = pagamento.totalPrice;

  if (pagador.valor_pago === totalEsperado) {
    setTimeout(() => {
      pagamento.status = status_pagamento.completed;
      clearTimeout(pagamento.timer);
      console.log(`Pagamento ${produto.idProduct} concluído com sucesso.`);
    }, 10000);

    const { timer, ...pagamentoFinal } = pagamento;

    const transaction = {
      externalGatewayId: `gw_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`
    };

    res.status(200).json({ pagador, produto: pagamentoFinal, transaction });
  } else {
    pagamento.status = status_pagamento.failed;
    res.status(400).json({ error: `Valor inválido! Você deve pagar ${totalEsperado}` });
  }
};

exports.pollingStatus = (req, res) => {
  const pagamento = pagamentos_efetuados[req.params.id];

  if (!pagamento) {
    return res.status(404).json({ error: "Pagamento não encontrado." });
  }

  res.status(200).json({ status: pagamento.status });
};

exports.detalhesPagamento = (req, res) => {
  const pagamento = pagamentos_efetuados[req.params.id];

  if (!pagamento) {
    return res.status(400).json({ error: "Pagamento não encontrado!" });
  }

  const { timer, ...pagamentoSemTimer } = pagamento;
  res.status(200).json({ pagamento: pagamentoSemTimer });
};

exports.statusPagamento = (req, res) => {
  const idPagamento = req.params.id;
  const pagamento = pagamentos_efetuados[idPagamento];

  if (!pagamento) {
    return res.status(400).json({ error: "Pagamento não existe!" });
  }

  const status = pagamento.status;
  res.status(200).json({ log: `Status do Pagamento ${idPagamento}: ${status}`, status });
};

exports.alteraStatus = (req, res) => {
  const idPagamento = req.params.id;
  const novoStatus = req.params.status;
  const { statusAntigo } = atualizarStatusPagamento(idPagamento, novoStatus);
  const { timer, ...pagamentoSemTimer } = pagamentos_efetuados[idPagamento];

  res.status(200).json({
    pagamento: pagamentoSemTimer,
    statusAntigo,
    novoStatus: pagamentoSemTimer.status,
    statusRequisicao: statusBase
  });
};

exports.cancelarPagamento = (req, res) => {
  const id = req.params.id;
  const pagamento = pagamentos_efetuados[id];

  if (!pagamento) {
    return res.status(404).json({ error: "Pagamento não encontrado." });
  }

  if (pagamento.status === status_pagamento.completed) {
    return res.status(400).json({ error: "Pagamento já foi concluído. Não pode ser cancelado." });
  }

  clearTimeout(pagamento.timer);
  atualizarStatusPagamento(id, status_pagamento.canceled);

  res.status(200).json({ message: `Pagamento ${id} cancelado.` });
};

exports.reembolsarPagamento = (req, res) => {
  const id = req.params.id;
  const pagamento = pagamentos_efetuados[id];

  if (!pagamento || pagamento.status !== status_pagamento.completed) {
    return res.status(400).json({ error: "Somente pagamentos COMPLETED podem ser reembolsados." });
  }

  atualizarStatusPagamento(id, status_pagamento.refunded);
  res.status(200).json({ message: `Pagamento ${id} reembolsado.` });
};

exports.contestarPagamento = (req, res) => {
  const id = req.params.id;
  const pagamento = pagamentos_efetuados[id];

  if (!pagamento || pagamento.status !== status_pagamento.completed) {
    return res.status(400).json({ error: "Somente pagamentos COMPLETED podem ser contestados." });
  }

  atualizarStatusPagamento(id, status_pagamento.charged_back);
  res.status(200).json({ message: `Pagamento ${id} contestado via chargeback.` });
};

exports.todosPagamentos = (req, res) => {
  const pagamentosList = Object.entries(pagamentos_efetuados).map(([id, pagamento]) => {
    const { timer, ...dados } = pagamento;
    return dados;
  });

  res.status(200).json({ pagamentos: pagamentosList });
};

exports.checkout = (req, res) => {
  const pagamento = pagamentos_efetuados[req.params.id];

  if (!pagamento) {
    return res.status(404).send("Pagamento não encontrado");
  }

  const html = `
    <html>
    <head>
      <title>Checkout</title>
    </head>
    <body>
      <h1>Pagamento: ${pagamento.title}</h1>
      <p>Status: ${pagamento.status}</p>
      <p>Valor: ${pagamento.totalPrice}</p>
    </body>
    </html>
  `;

  res.send(html);
};

exports.excluirTodos = (req, res) => {
  for (let key in pagamentos_efetuados) {
    clearTimeout(pagamentos_efetuados[key].timer);
    delete pagamentos_efetuados[key];
  }

  res.status(200).json({ message: "Todos os pagamentos foram excluídos." });
};
