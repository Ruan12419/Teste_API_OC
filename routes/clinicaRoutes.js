const express = require('express');
const router = express.Router();
const controller = require('../controllers/clinicaController');
const validate = require('../middlewares/validate');


router.get("/segurado/:cpf", controller.getSegurado);
router.get("/agenda/:especialidade", controller.getAgenda);

/**
 * {
	"especialidade": {
        "id_slot": "SLOT_101",
        "medico": "Dr. Roberto Mendes",
        "data": "2025-12-10",
        "horario": "14:00",
        "local": "Telemedicina App"
	}, 
	"cliente": {
		"cpf": "111.222.333-44",
    "telefone": "5511999990001",
    "id_segurado": "882910-X",
    "nome": "Ana Silva",
    "plano": "GOLD",
    "status_financeiro": "ativo",
    "segmentacao": "vip",
    "dependentes": [
      {
        "nome": "Pedro Silva",
        "idade": 8
      }
    ],
    "ultima_interacao": "2023-10-25T14:30:00Z"
	}
}
 */
router.post("/agendar", controller.criarAgendamento);

router.post("/sinistro", controller.criarSinistro);
router.get("/sinistro/:protocolo", controller.getSinistro);
router.get("/sinistro", controller.getSinistros);



module.exports = router;
