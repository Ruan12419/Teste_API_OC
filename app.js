function atualizarStatusPagamento(idPagamento, novoStatus) {
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
});

app.post("/efetuarPagamento", (req, res) => {
    const { pagador, produto } = req.body
    const pagamento = pagamentos_efetuados[produto.id]

    if (!pagamento) {
        return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    pagamento.status = status_pagamento.processing;

    const totalEsperado = pagamento.totalPrice;

    if (pagador.valor_pago === totalEsperado) {
        setTimeout(() => {
            pagamento.status = status_pagamento.completed;
            clearTimeout(pagamento.timer);
            console.log(`Pagamento ${produto.id} concluído com sucesso.`);
        }, 10000); 

        res.status(200).json({ message: "Pagamento em processamento." });
    } else {
        pagamento.status = status_pagamento.failed;
        res.status(400).json({ error: `Valor inválido! Você deve pagar ${totalEsperado}` });
    }
});

app.get("/polling/:id", (req, res) => {
    const pagamento = pagamentos_efetuados[req.params.id];

    if (!pagamento) {
        return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    res.status(200).json({ status: pagamento.status });
});


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

app.post("/cancelarPagamento/:id", (req, res) => {
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
});

app.post("/reembolsarPagamento/:id", (req, res) => {
    const id = req.params.id;
    const pagamento = pagamentos_efetuados[id];

    if (!pagamento || pagamento.status !== status_pagamento.completed) {
        return res.status(400).json({ error: "Somente pagamentos COMPLETED podem ser reembolsados." });
    }

    atualizarStatusPagamento(id, status_pagamento.refunded);

    res.status(200).json({ message: `Pagamento ${id} reembolsado.` });
});

app.post("/contestarPagamento/:id", (req, res) => {
    const id = req.params.id;
    const pagamento = pagamentos_efetuados[id];

    if (!pagamento || pagamento.status !== status_pagamento.completed) {
        return res.status(400).json({ error: "Somente pagamentos COMPLETED podem ser contestados." });
    }

    atualizarStatusPagamento(id, status_pagamento.chargedBack);

    res.status(200).json({ message: `Pagamento ${id} contestado via chargeback.` });
});

app.get("/todosPagamentos", (req, res) => {
    const pagamentosList = Object.entries(pagamentos_efetuados).map(([id, pagamento]) => {
        const { timer, ...dados } = pagamento;
        return dados;
    });
    res.status(200).json(pagamentosList);
});

app.get("/checkout/:id", (req, res) => {
    const pagamento = pagamentos_efetuados[req.params.id];

    if (!pagamento) {
        return res.status(404).send("<h1>Pagamento não encontrado</h1>");
    }

    
    res.send(`
        <h1>Checkout do pagamento ${pagamento.id}</h1>
        <p>Produto: ${pagamento.product_name}</p>
        <p>Quantidade: ${pagamento.quantity}</p>
        <p>Preço total: R$${pagamento.totalPrice.toFixed(2)}</p>
        <p>Status atual: ${pagamento.status}</p>
        <p>Aguarde o pagamento ser processado.</p>
    `);
});



app.listen(3000, () => {
    console.log("Está rodando!");
});