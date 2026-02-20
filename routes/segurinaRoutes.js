const express = require('express');
const router = express.Router();
const controller = require('../controllers/segurinaController');
const validate = require('../middlewares/validate');
 
router.get("/catalogos", controller.getCatalogo);
router.get("/catalogo/:typeId/:planId", controller.getCatalogoPorId);


router.post("/contrato/:typeId/:planId", controller.contratarSeguro);

router.get('/certificado/:id', controller.mostrarCertificado);

module.exports = router;