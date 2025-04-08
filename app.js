const express = require("express")
const file = require("fs")

const app = express()
app.use((req, res, next) => {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    next();
  });

dados = {}
pagamentos = {}

file.readFile("faq.json", "utf8", (err, data) => {
    if (err) throw (err);
    dados = JSON.parse(data);
});

file.readFile("pagamento.json", "utf8", (err, data) => {
    if (err) throw (err);
    pagamentos = JSON.parse(data);
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


app.get("/pay", (req, res) => {
    try {        
        let nome = req.body["nome"];
        let cpf = req.body["cpf"];
    
        res.status(201).json({data: `Pagamento efetuado com sucesso! ${nome}: ${cpf}`})
    } catch (error) {
        res.status(500).json({ "error": req })
    }
})

app.listen(3000, () => {
    console.log("Está rodando!");
});