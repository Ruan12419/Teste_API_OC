const atualizarStatusPagamento = (idPagamento, novoStatus) => {
  const pagamento = pagamentos_efetuados[idPagamento];
  if (!pagamento) return { statusAntigo: null, isPagamentoEfetuado: false };

  let statusAntigo = pagamento.status;
  let isPagamentoEfetuado = false;

  if (Object.values(status_pagamento).includes(novoStatus)) {
    pagamento.status = novoStatus;
    statusBase = "Atualizado com sucesso";
    if (novoStatus === status_pagamento.completed) isPagamentoEfetuado = true;
  } else {
    statusBase = "Status inválido";
  }

  return { statusAntigo, isPagamentoEfetuado };
};

module.exports = {
  atualizarStatusPagamento
};
