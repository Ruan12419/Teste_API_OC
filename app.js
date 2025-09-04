function atualizarStatusPagamento(idPagamento, novoStatus) {
    console.log(pagamentos_efetuados[idPagamento]);
    let statusAntigo = pagamentos_efetuados[idPagamento].status;
    let isPagamentoEfetuado = false;
    if (novoStatus in status_pagamento) {
        pagamentos_efetuados[idPagamento].status = novoStatus;
        statusBase = "Completa"
        if (novoStatus === "completed") isPagamentoEfetuado = true;
    } else {
        statusBase = "failed"
    }
    return { statusAntigo, isPagamentoEfetuado }
}




const express = require("express")
const file = require("fs")

const app = express()
app.use((req, res, next) => {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    next();
  });

  app.use(express.json())

dados = {}
pagamentos = {}
status_pagamento = {}
let statusBase = "pending";
pagamentos_efetuados = {}

file.readFile("faq.json", "utf8", (err, data) => {
    if (err) throw (err);
    dados = JSON.parse(data);
});

file.readFile("pagamento.json", "utf8", (err, data) => {
    if (err) throw (err);
    pagamentos = JSON.parse(data);
});

file.readFile("status_pagamento.json", "utf8", (err, data) => {
    if (err) throw (err);
    status_pagamento = JSON.parse(data);
});

app.get("/faq", (req, res) => {
    res.status(200).json({ dados });
});

app.get("/faq/desenvolvimento/fullstack", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Desenvolvimento"]["Fullstack"] });
});

app.get("/faq/desenvolvimento/qa", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Desenvolvimento"]["QA"] });
});

app.get("/faq/desenvolvimento/dados", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Desenvolvimento"]["Dados"] });
});

app.get("/faq/produto/produto", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Gestao de Produto"]["Produto"] });
});

app.get("/faq/produto/digital", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Gestao de Produto"]["Produto Digital"] });
});

app.get("/faq/produto/servicos", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Gestao de Produto"]["Produto de Servicos"] });
});

app.get("/faq/projeto/projeto", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Gestao de Projeto"]["Projetos"] });
});

app.get("/faq/projeto/ageis", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Gestao de Projeto"]["Projetos Ageis"] });
});

app.get("/faq/projeto/ti", (req, res) => {
    res.status(200).json({ dados: dados["FAQ"]["Gestao de Projeto"]["Projetos de TI"] });
});

app.get("/pagamento", (req, res) => {
    res.status(200).json({ pagamentos });
});

app.get("/pagamento/cartao", (req, res) => {
    res.status(200).json({ pagamentos: pagamentos["Pagamento"]["Cartao"] });
});

app.get("/pagamento/pix", (req, res) => {
    res.status(200).json({ pagamentos: pagamentos["Pagamento"]["Pix"] });
});

app.get("/pagamento/boleto", (req, res) => {
    res.status(200).json({ pagamentos: pagamentos["Pagamento"]["Boleto"] });
});


app.post("/payment", (req, res) => {
    let { nome, cpf } = req.body;
    
    res.status(201).json({data: `Pagamento efetuado com sucesso! ${nome}: ${cpf}`})
    
})

app.post("/criarPagamento", (req, res) => {
    const pagamento = req.body;

    if (!pagamento.id || !pagamento.due_time) {
        return res.status(400).json({ error: "ID e due_time são obrigatórios." });
    }

    pagamentos_efetuados[pagamento.id] = {
        id: pagamento.id, 
        status: status_pagamento.pending,
        product_name: pagamento.product_name,
        price: pagamento.price,
        quantity: pagamento.quantity,
        start_time: pagamento.start_time,
        due_time: pagamento.due_time
    };

    pagamentos_efetuados[pagamento.id].totalPrice = (pagamento.price * pagamento.quantity)

    pagamentos_efetuados[pagamento.id].timer = setTimeout(() => {
        if (pagamentos_efetuados[pagamento.id].status !== status_pagamento.completed) {
            pagamentos_efetuados[pagamento.id].status = status_pagamento.expired;
            console.log(`Pagamento ${pagamento.id} expirou. Status atualizado para "expired".`);
        }
    }, pagamento.due_time);

    res.status(200).json({
        message: `Pagamento ${pagamento.id} iniciado. Aguardando confirmação.`,
        id: pagamento.id
    });
});

app.post("/efetuarPagamento", (req, res) => {
    const { pagador, produto } = req.body
    const {timer, ...pagamentoSemTimer} = pagamentos_efetuados[produto.id]
    let isPagamentoEfetuado = false;
    console.log("No de efetuar:")
    console.log(pagamentoSemTimer)
    if (pagador.valor_pago === pagamentoSemTimer.totalPrice) {
        isPagamentoEfetuado = atualizarStatusPagamento(pagamentoSemTimer.id, "completed");
    } else {
        res.status(400).json({error: `Valor inválido! Você deve pagar ${pagamentoSemTimer.totalPrice}`})
    }
    if (isPagamentoEfetuado) {
        const {timer, ...pagamentoFinal} = pagamentos_efetuados[produto.id]
        res.status(200).json({pagador: pagador, produto: pagamentoFinal})
    } else {
        res.status(400).json({error: "Não foi possível efetuar o pagamento!"})
    }

})

app.get("/payment/:id", (req, res) => {
    const pagamento = pagamentos_efetuados[req.params.id]
    if (!pagamento) {
        res.status(400).json({error: "Pagamento não encontrado!"})
    }

    const { timer, ...pagamentoSemTimer } = pagamento;
    res.status(200).json({pagamento: pagamentoSemTimer})
})

app.get("/statusPayment/:id", (req, res) => {
    let idPagamento = req.params.id

    // status_pagamento[statusBase];
    const pagamento = pagamentos_efetuados[idPagamento]
    if (!pagamento) {
        res.status(400).json({error: "Pagamento não existe!"})
    }
    const status = pagamento.status;

    res.status(200).json({log: `Status do Pagamento ${idPagamento}: ${status}`, status: status})
})

app.get("/alteraStatus/:id/:status", (req, res) => {
    let idPagamento = req.params.id;
    let novoStatus = req.params.status
    const { statusAntigo } = atualizarStatusPagamento(idPagamento, novoStatus)
    const { timer, ...pagamentoSemTimer } = pagamentos_efetuados[idPagamento];

    res.status(200).json({pagamento: pagamentoSemTimer,  statusAntigo: statusAntigo, novoStatus: pagamentoSemTimer.status, statusRequisicao: statusBase})
})

app.listen(3000, () => {
    console.log("Está rodando!");
});