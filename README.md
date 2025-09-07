# API de Pagamentos

API completa para simulação de fluxo de pagamentos, com criação, processamento, cancelamento, reembolso e contestação de pagamentos.

---

## 🧰 Tecnologias Utilizadas

- Node.js
- Express.js
- Swagger (OpenAPI 3.0)
- JSON como base de dados simulada

---

## ⚙️ Funcionalidades

- Criar um pagamento
- Efetuar pagamento (com simulação de gateway)
- Cancelar pagamento
- Reembolsar pagamento
- Contestar pagamento (chargeback)
- Polling de status
- Excluir todos os registros de pagamentos
- Documentação automática via Swagger

---

## 🚀 Instalação

1. Clone o repositório:
   `git clone https://github.com/Ruan12419/Teste_API_OC.git`

2. Instale as dependências:
   `npm install`

3. Inicie o servidor:
   `npm run dev`

O servidor será iniciado em: https://teste-api-oc.onrender.com

---

## 📘 Documentação Swagger

Acesse a documentação completa da API em:

https://teste-api-oc.onrender.com/api-docs

---

## 📁 Estrutura de Pastas

- controllers/
  - pagamentoController.js

- data/
  - faq.json
  - pagamento.json
  - status_pagamento.json

- middlewares/
    - validate.js

- routes/
  - pagamentoRoutes.js

- services/
    - pagamentoService.js

- swagger/
  - swaggerConfig.js
  - swaggerDocs.js

- utils/
  - statusEnum.js

- validations/
  - criarPagamento.js
  - efetuarPagamento.js

- app.js
- server.js
- package.json
- README.md

---

## 🔌 Endpoints Principais

### 1. Criar pagamento
- Método: POST  
- Rota: `/criarPagamento`

Exemplo de JSON:
```
{
  "items": {
    "id": "ABC_DD3",
    "product_name": "HeadPhone",
    "description": "Black HeadPhone Bluetooth",
    "picture_url": "https://...",
    "category_id": "electronics",
    "quantity": 2,
    "price": 50,
    "type": "electronics",
    "event_date": "2025-07-10T05:49:23.353Z",
    "due_time": 150000,
    "warranty": false
  },
  "shipments": {
    "receiver_address": {
      "zip_code": "12312-123",
      "state_name": "RJ",
      "city_name": "Búzios",
      "street_name": "Av das Nacoes Unidas",
      "street_number": 3003
    }
  },
  "description": "Payment for product",
  "payment_method_id": "pix",
  "token": "abc123",
  "transaction_amount": 100
}
```

---

### 2. Efetuar pagamento
- Método: POST  
- Rota: `/efetuarPagamento`

Exemplo de JSON:
```
{
  "pagador": {
    "first_name": "Peter",
    "last_name": "Parker",
    "phone": { "area_code": 11, "number": "987654321" },
    "valor_pago": 100,
    "address": {
      "zip_code": "51330-250",
      "street_name": "Av das Nacoes Unidas",
      "street_number": 300,
      "city": 3055,
      "federal_unit": 12
    },
    "payer": {
      "entity_type": "individual",
      "type": "customer",
      "email": "peter@gmail.com",
      "identification": { "type": "CPF", "number": "95749019047" }
    }
  },
  "produto": { "idProduct": "ABC_DD3" }
}
```

---

### 3. Ver status do pagamento
- Método: GET  
- Rota: `/statusPayment/:id`

---

### 4. Cancelar pagamento
- Método: POST  
- Rota: `/cancelarPagamento/:id`

---

### 5. Reembolsar pagamento
- Método: POST  
- Rota: `/reembolsarPagamento/:id`

---

### 6. Contestar pagamento (chargeback)
- Método: POST  
- Rota: `/contestarPagamento/:id`

---

### 7. Excluir todos os pagamentos
- Método: GET  
- Rota: `/excluiPagamentos`

---

### 8. Ver todos os pagamentos efetuados
- Método: GET  
- Rota: `/todosPagamentos`

---

## 🔎 Notas importantes

- Os pagamentos simulam vencimento via `due_time` e expiram se não forem pagos a tempo.
- Os dados são mantidos em memória (via variáveis globais) e reiniciam ao parar o servidor.
- O valor do pagamento enviado no campo `valor_pago` precisa bater com `price * quantity`.

---
