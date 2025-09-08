const express = require('express');
const router = express.Router();
const controller = require('../controllers/pagamentoController');
const validate = require('../middlewares/validate');

const criarPagamentoSchema = require('../validations/criarPagamentoSchema');
const efetuarPagamentoSchema = require('../validations/efetuarPagamentoSchema');


router.get("/faq", controller.getFaq);
router.get("/faq/:categoria/:subcategoria", controller.getFaqEspecifico);

router.get("/pagamento", controller.getPagamentos);
router.get("/pagamento/:tipo", controller.getTipoPagamento);


/**
 * @swagger
 * /criarPagamento:
 *   post:
 *     summary: Cria um novo pagamento
 *     tags: [Pagamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovoPagamento'
 *     responses:
 *       200:
 *         description: Pagamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/criarPagamento", controller.criarPagamento);

/**
 * @swagger
 * /efetuarPagamento:
 *   post:
 *     summary: Efetua um pagamento
 *     tags: [Pagamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EfetuarPagamento'
 *     responses:
 *       200:
 *         description: Pagamento efetuado com sucesso
 *       400:
 *         description: Valor incorreto ou dados inválidos
 */
router.post("/efetuarPagamento", controller.efetuarPagamento);


router.get("/polling/:id", controller.pollingStatus);
router.get("/payment/:id", controller.detalhesPagamento);
router.get("/statusPayment/:id", controller.statusPagamento);
router.get("/alteraStatus/:id/:status", controller.alteraStatus);
router.post("/cancelarPagamento/:id", controller.cancelarPagamento);
router.post("/reembolsarPagamento/:id", controller.reembolsarPagamento);
router.post("/contestarPagamento/:id", controller.contestarPagamento);
router.get("/todosPagamentos", controller.todosPagamentos);
router.get("/checkout/:id", controller.checkout);
router.get("/excluiPagamentos", controller.excluirTodos);

module.exports = router;
