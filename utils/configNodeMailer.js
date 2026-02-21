require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email", // Ou smtp.gmail.com
    port: 587,
    auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
    }, 
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = transporter;