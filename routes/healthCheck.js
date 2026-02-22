const express = require('express');
const router = express.Router();
 
app.get('/', (req, res) => res.status(200).json({status: "OK"}))


module.exports = router;