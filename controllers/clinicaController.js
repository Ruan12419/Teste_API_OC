const fs = require("fs");
const { atualizarStatusPagamento } = require("../services/pagamentoService");

const gerarSlotAleatorio = (agenda) => {
  const medicos = [
    "Dr. Silva",
    "Dra. Souza",
    "Dr. Oliveira",
    "Dra. Santos",
    "Dr. House",
    "Dra. Grey",
  ];
  const locais = [
    "Telemedicina App",
    "Presencial - Unidade Centro",
    "Presencial - Unidade Sul",
  ];

  if (agenda.length === 0) return;
  const especialidadeAleatoria =
    agenda[Math.floor(Math.random() * agenda.length)];

  const medico = medicos[Math.floor(Math.random() * medicos.length)];
  const local = locais[Math.floor(Math.random() * locais.length)];

  const hoje = new Date();
  const diasFuturos = Math.floor(Math.random() * 30) + 1;
  const dataFutura = new Date(hoje.setDate(hoje.getDate() + diasFuturos))
    .toISOString()
    .split("T")[0];

  const hora = Math.floor(Math.random() * (17 - 8 + 1) + 8)
    .toString()
    .padStart(2, "0");
  const minuto = Math.random() < 0.5 ? "00" : "30";

  const novoSlot = {
    id_slot: "SLOT_AUTO_" + Date.now() + Math.floor(Math.random() * 100),
    medico: medico,
    data: dataFutura,
    horario: `${hora}:${minuto}`,
    local: local,
  };

  especialidadeAleatoria.slots.push(novoSlot);

  especialidadeAleatoria.disponibilidade = true;
  especialidadeAleatoria.mensagem_aviso = null;

  console.log(
    `[AUTO] Novo slot gerado para ${especialidadeAleatoria.especialidade_buscada}: ${novoSlot.id_slot}`
  );
};

exports.getSegurado = (req, res) => {
  const { cpf } = req.params;
  const segurado = segurados.find((segurado) => segurado.cpf === cpf);
  res.status(200).json({ data: segurado });
};

exports.getAgenda = (req, res) => {
  const { especialidade } = req.params;

  const agendaMap = {
    cardiologia: "cardiologia",
    dermatologia: "dermatologia",
    ortopedia: "ortopedia",
    nutricao: "nutricao",
  };

  const especialidadeReal = agendaMap[especialidade.toLowerCase()];

  try {
    if (!especialidadeReal) {
      throw new Error("Mapeamento inválido");
    }

    const resultado = agenda.find(
      (especialidade) =>
        especialidade.especialidade_buscada === especialidadeReal
    );

    if (!resultado) {
      throw new Error("Dados não encontrados");
    }

    if (!resultado.disponibilidade) {
      res.status(200).json({ data: resultado });
    }

    res.status(200).json({ data: resultado });
  } catch (error) {
    console.log("Especialidade:", especialidade);
    console.log("Erro:", error.message);
    res.status(400).json({ error: "Especialidade inválida" });
  }
};

exports.criarAgendamento = (req, res) => {
  const { especialidade, cliente } = req.body;

  if (!especialidade || !cliente || !especialidade.id_slot) {
    return res.status(400).json({
      data: "Dados incompletos. Objetos 'especialidade' (com id_slot) e 'cliente' são obrigatórios.",
    });
  }

  const id_slot = especialidade.id_slot;

  let agendaEspecialidade = null;
  let indexSlot = -1;

  for (let i = 0; i < agenda.length; i++) {
    const slots = agenda[i].slots;
    const idx = slots.findIndex((s) => s.id_slot === id_slot);

    if (idx !== -1) {
      agendaEspecialidade = agenda[i];
      indexSlot = idx;
      break;
    }
  }

  if (!agendaEspecialidade || indexSlot === -1) {
    return res.status(409).json({
      data: "Erro: Este horário acabou de ser reservado por outro paciente ou não está mais disponível.",
    });
  }

  const slotSelecionado = agendaEspecialidade.slots[indexSlot];

  agendaEspecialidade.slots.splice(indexSlot, 1);

  if (agendaEspecialidade.slots.length === 0) {
    agendaEspecialidade.disponibilidade = false;
    agendaEspecialidade.mensagem_aviso = "Agenda lotada temporariamente.";
  }

  gerarSlotAleatorio(agenda);

  fs.writeFileSync(agendaPath, JSON.stringify(agenda, null, 2));

  const numeroProtocolo = "#AGD-" + Math.floor(1000 + Math.random() * 9000);

  const novoAgendamento = {
    protocolo: numeroProtocolo,
    status: "confirmado",
    data_criacao: new Date().toISOString(),
    cliente_dados: cliente,
    slot_dados: {
      ...slotSelecionado,
      especialidade_original: agendaEspecialidade.especialidade_buscada,
    },
  };

  agendamentos.push(novoAgendamento);
  fs.writeFileSync(agendamentosPath, JSON.stringify(agendamentos, null, 2));

  return res.status(201).json({
    data: {
      protocolo: numeroProtocolo,
      mensagem: "Agendamento confirmado com sucesso.",
      detalhes: {
        medico: slotSelecionado.medico,
        data: slotSelecionado.data,
        horario: slotSelecionado.horario,
        unidade: slotSelecionado.local,
      },
    },
  });
};

exports.criarSinistro = (req, res) => {
  const { cliente, comprovantes, descricao_ocorrencia } = req.body;

  if (!cliente || !cliente.cpf || !comprovantes) {
    return res.status(400).json({
      data: "Dados inválidos. Necessário enviar objeto 'cliente' (com CPF) e array de 'comprovantes'.",
    });
  }

  const protocolo = `#SINI-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const novoSinistro = {
    protocolo: protocolo,
    status: "em_analise",
    data_abertura: new Date().toISOString(),
    ultima_atualizacao: new Date().toISOString(),
    descricao: descricao_ocorrencia || "Solicitação de reembolso padrão",
    cliente: {
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone,
      email: cliente.email,
    },

    anexos: {
      quantidade: comprovantes.length,
      arquivos: comprovantes,
    },
    historico: [
      {
        data: new Date().toISOString(),
        mensagem: "Solicitação aberta via Bot WhatsApp",
      },
    ],
  };

  sinistros.push(novoSinistro);
  fs.writeFileSync(sinistrosPath, JSON.stringify(sinistros, null, 2));

  gerarSlotAleatorio(agenda);

  return res.status(201).json({
    data: {
      mensagem: "Sinistro aberto com sucesso.",
      dados: {
        protocolo: novoSinistro.protocolo,
        status: novoSinistro.status,
        previsao_analise: "48 horas úteis",
      },
    },
  });
};

exports.getSinistro = (req, res) => {
  const { protocolo } = req.params;

  if (!protocolo) {
    return res.status(400).json({ data: "É obrigatório informar o protocolo" });
  }

  const protocoloCompleto =
    protocolo.startsWith("#") || protocolo.startsWith("%23")
      ? protocolo
      : "#" + protocolo;

  const resultado = sinistros.find(
    (sinistro) =>
      sinistro.protocolo.toLowerCase() === protocoloCompleto.toLowerCase()
  );

  if (!resultado) {
    return res.status(400).json({ data: "Solicitação não encontrada!" });
  }

  res.status(200).json({ data: resultado });
};

exports.getSinistros = (req, res) => {
  const { cliente } = req.body;

  if (!cliente) {
    return res.status(400).json({
      data: "Dados incompletos. Os dados do cliente são obrigatórios.",
    });
  }

  let resultado = [];
  sinistros.forEach((sinistro) => {
    if (sinistro.cliente.cpf === cliente.cpf) {
      resultado.push(sinistro);
    }
  });

  res.status(200).json({ data: resultado });
};
