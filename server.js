require('dotenv').config();
const axios = require('axios');
const app = require('./app');

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


const manterVivo = () => {
  const URL_DA_SUA_API = 'https://teste-api-oc.onrender.com/healthcheck/';

  setInterval(async () => {
    try {
      const response = await axios.get(URL_DA_SUA_API);
      console.log(`[KeepAlive] Status: ${response.status} - Render ativo!`);
    } catch (error) {
      console.error('[KeepAlive] Falha ao acordar o Render:', error.message);
    }
  }, 10 * 60 * 1000);
};

if (process.env.AMBIENTE) {
  manterVivo();
}