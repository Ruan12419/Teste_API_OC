require('dotenv').config();
const fs = require("fs");
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');
const transporter = require("../utils/configNodeMailer");

const caminhoHtmlErro = path.join(__dirname, '..', 'utils', 'certificadoNaoEncontrado.html');
const htmlBase = fs.readFileSync(caminhoHtmlErro, 'utf8');

const caminhoHtmlEmail = path.join(__dirname, '..', 'utils', 'certificadoContratado.html');
const htmlEmailBase = fs.readFileSync(caminhoHtmlEmail, 'utf8');

const gerarHtmlErro = (id) => {
    return htmlBase.replace('{{ID}}', id);
};

function temParametros(typeId, planId) {
    if (!typeId) {
        return { status: false, message: "Parâmetro 'typeId' é obrigatório!" };
    }
    if (!planId) {
        return { status: false, message: "Parâmetro 'planId' é obrigatório!" };
    }

    return { status: true, message: "" };
}

function validarCPF(cpf) {
    if (!cpf) return false;
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11 || /^(\d)\1+$/.test(cpfLimpo)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
}

function validarContratanteSeguroVida(dadosContratante) {
    const { nome, nascimento, email, cpf, telefone } = dadosContratante;

    const nomeLimpo = nome.trim();
    if (!nomeLimpo.includes(' ') || nomeLimpo.split(/\s+/).length < 2) {
        return { status: false, message: "O nome deve conter pelo menos dois termos (nome e sobrenome)." };
    }

    if (!cpf || !validarCPF(cpf)) {
        return { status: false, message: "O CPF informado é inválido." };
    }

    const dataNasc = new Date(nascimento);
    const hoje = new Date();
    if (isNaN(dataNasc.getTime()) || dataNasc > hoje) {
        return { status: false, message: "Data de nascimento inválida ou no futuro." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { status: false, message: "E-mail em formato inválido." };
    }

    if (telefone) {
        let foneLimpo = telefone.replace(/\D/g, '');
        if (foneLimpo.startsWith('55') && (foneLimpo.length === 12 || foneLimpo.length === 13)) {
            foneLimpo = foneLimpo.substring(2);
        }
        if (foneLimpo.length < 10 || foneLimpo.length > 11) {
            return { status: false, message: "Telefone deve conter DDD e ter 10 ou 11 dígitos." };
        }
    }

    return { status: true };
}

function validarFormaDePagamento(pagamento, cpfContratante) {
    const { metodo, detalhes, cpfTitular } = pagamento;
    const opcoesValidas = ['cartao_credito', 'debito_conta', 'pix_recorrente'];
    const instituicoesAutorizadas = ['001', '033', '237', '341', '104'];

    if (!opcoesValidas.includes(metodo)) {
        return { status: false, message: "Forma de pagamento não suportada." };
    }

    if (metodo === 'debito_conta') {
        const banco = detalhes.banco || detalhes.codigoBanco;
        if (!instituicoesAutorizadas.includes(banco)) {
            return { status: false, message: "Instituição bancária não autorizada para esta operação." };
        }
    }

    if (cpfTitular !== cpfContratante) {
        return { status: false, message: "O CPF do titular do pagamento deve ser o mesmo do contratante." };
    }

    if (metodo === 'cartao_credito') {
        if (!validarLuhn(detalhes.numero)) {
            return { status: false, message: "Número de cartão de crédito inválido (Falha no dígito verificador)." };
        }
    }

    return { status: true };
}

function validarLuhn(numero) {
    if (!numero) return false;

    let numStr = numero.replace(/\D/g, '');
    let soma = 0;
    let deveDobrar = false;

    for (let i = numStr.length - 1; i >= 0; i--) {
        let digito = parseInt(numStr.charAt(i));

        if (deveDobrar) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }

        soma += digito;
        deveDobrar = !deveDobrar;
    }
    return (soma % 10) === 0;
}

exports.getCatalogo = (req, res) => {
    console.log("entrou no catalogos")
    res.status(200).json({ data: catalogo });
}

exports.getCatalogoPorId = (req, res) => {
    const { typeId, planId } = req.params

    const verificaParametros = temParametros(typeId, planId)

    if (!verificaParametros.status) {
        return res.status(400).json({ message: verificaParametros.message });
    }

    let tipoSeguro = catalogo.insuranceTypes.find((type) => type.typeId.toLowerCase() === typeId.toLowerCase())
    if (!tipoSeguro) {
        return res.status(400).json({ message: `O Tipo de seguro: "${typeId}" não foi encontrado.` });
    }
    const plano = tipoSeguro.plans.find((plan) => plan.planId.toLowerCase() === planId.toLowerCase())

    if (!plano)
        return res.status(400).json({ message: `O plano selecionado: "${planId}" não foi encontrado.` });

    return res.status(200).json({ data: plano });
}
const gerarESalvarCertificado = async (dadosContratante, plano, dadosSeguro) => {
    const numeroCertificado = Math.floor(100000000 + Math.random() * 900000000);
    const urlCertificado = `https://teste-api-oc.onrender.com/segurina/certificado/${numeroCertificado}`;
    const qrCodeBuffer = await QRCode.toBuffer(urlCertificado, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: { dark: '#2c3e50', light: '#ffffff' }
    });

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        let buffers = [];

        const diretorio = path.join(__dirname, '..', 'certificados');
        const nomeArquivo = `certificado_${numeroCertificado}.pdf`;
        const caminhoCompleto = path.join(diretorio, nomeArquivo);

        if (!fs.existsSync(diretorio)) fs.mkdirSync(diretorio, { recursive: true });

        const writeStream = fs.createWriteStream(caminhoCompleto);
        doc.pipe(writeStream);
        doc.on('data', buffers.push.bind(buffers));

        doc.on('end', () => {
            let pdfData = Buffer.concat(buffers);
            resolve({
                base64: pdfData.toString('base64'),
                path: caminhoCompleto,
                nomeArquivo: nomeArquivo,
                urlAcesso: `https://teste-api-oc.onrender.com/segurina/certificado/${numeroCertificado}`,
                numeroCertificado
            });
        });

        writeStream.on('error', reject);

        const azulEscuro = '#2c3e50';
        const cinzaTexto = '#34495e';
        const cinzaClaro = '#7f8c8d';

        doc.rect(0, 0, 612, 40).fill(azulEscuro);
        doc.fillColor('#ffffff').fontSize(16).text('SEGURINA S.A.', 50, 15, { characterSpacing: 2 });
        doc.fillColor(azulEscuro).fontSize(10).text('CERTIFICADO DE SEGURO INDIVIDUAL', 50, 50, { align: 'right' });
        doc.fontSize(8).text('Processo SUSEP nº 15414.900123/2026-11', { align: 'right' });
        doc.moveDown(2);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ecf0f1').stroke();
        doc.moveDown();

        const yTopo = doc.y;
        doc.fillColor(azulEscuro).fontSize(12).text(`Certificado nº: ${numeroCertificado}`, { bold: true });
        doc.fillColor(cinzaTexto).fontSize(10).text(`Apólice Mestra: 01.77.0000${numeroCertificado.toString().slice(0, 4)}`);
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);

        doc.moveDown(3);
        doc.rect(50, doc.y, 500, 18).fill('#f8f9fa');
        doc.fillColor(azulEscuro).fontSize(11).text('1. DADOS DO SEGURADO', 55, doc.y - 14, { underline: false });

        doc.moveDown(0.5);
        doc.fillColor(cinzaTexto).fontSize(10);
        const col1 = 55;
        const col2 = 300;
        let currentY = doc.y;

        doc.text(`Nome: ${dadosContratante.nome}`, col1, currentY);
        doc.text(`CPF: ${dadosContratante.cpf}`, col2, currentY);
        doc.moveDown(0.5);
        doc.text(`E-mail: ${dadosContratante.email}`, col1, currentY + 15);

        const telefoneDisplay = dadosContratante.telefone || "Não informado";
        doc.text(`Telefone: ${telefoneDisplay}`, col2, currentY + 15);
        doc.moveDown(2.5);

        doc.moveDown(1);
        doc.rect(50, doc.y, 500, 18).fill('#f8f9fa');
        doc.fillColor(azulEscuro).fontSize(11).text('2. COBERTURAS E PLANO', 55, doc.y - 14);

        doc.moveDown(0.5);
        doc.fillColor(cinzaTexto).fontSize(10);
        doc.text(`Plano: ${plano.name.toUpperCase()}`);
        doc.moveDown(0.5);
        doc.text(`Vigência: ${new Date().toLocaleDateString('pt-BR')} a ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('pt-BR')}`);

        doc.moveDown(0.5);
        if (plano.coverages) {
            doc.fontSize(9).text('COBERTURAS CONTRATADAS (LMI)', { oblique: true });
            doc.moveDown(0.2);
            plano.coverages.forEach(cov => {
                doc.fillColor(cinzaTexto).text(`- ${cov.padEnd(40, '.')} R$ 100.000,00`, { indent: 15 });
            });
        }
        doc.moveDown();

        doc.moveDown(2);
        doc.rect(50, doc.y, 500, 18).fill('#f8f9fa');
        doc.fillColor(azulEscuro).fontSize(11).text('3. DETALHAMENTO FINANCEIRO', 55, doc.y - 14);

        doc.moveDown(0.5);
        const valorLiquido = plano.priceMonthly * 0.9262;
        const iof = plano.priceMonthly - valorLiquido;

        doc.fillColor(cinzaTexto).fontSize(10);

        const formatarBRL = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        doc.text(`Prêmio Líquido Mensal: ${formatarBRL(valorLiquido)}`);
        doc.moveDown(0.5);
        doc.text(`IOF (0,38%): ${formatarBRL(iof)}`);
        doc.moveDown(1);

        doc.fontSize(12).fillColor(azulEscuro).text(
            `PRÊMIO TOTAL MENSAL: ${formatarBRL(plano.priceMonthly)}`,
            { bold: true }
        );
        doc.moveDown();

        const bottomY = 620;
        doc.image(qrCodeBuffer, 50, bottomY, { width: 80 });

        doc.fontSize(8).fillColor(cinzaTexto);
        doc.text('Acesse a autenticidade deste documento', 140, bottomY + 25);
        doc.fillColor('blue').text(urlCertificado, 140, bottomY + 35, { underline: true });

        doc.rect(380, bottomY, 170, 60).strokeColor(azulEscuro).lineWidth(0.5).stroke();
        doc.fillColor(azulEscuro).fontSize(7).text('ASSINADO DIGITALMENTE POR:', 385, bottomY + 5);
        doc.fontSize(9).text('SEGURINA S.A. EMISSOR | CNPJ: 00.000.000/0001-00', 385, bottomY + 15);
        doc.fontSize(7).fillColor(cinzaClaro).text(`HASH: ${Buffer.from(nomeArquivo).toString('hex').slice(0, 24)}`, 385, bottomY + 40);

        doc.moveTo(50, 720).lineTo(550, 720).strokeColor('#bdc3c7').lineWidth(1).stroke();
        doc.fontSize(7).fillColor(cinzaClaro).text(
            'SAC: 0800 770 1234 | Ouvidoria: 0800 770 4321 | Atendimento ao Deficiente Auditivo: 0800 770 5555. ' +
            'Este seguro é regido pelas condições gerais protocoladas junto à SUSEP. O registro deste plano na SUSEP não implica, por parte da Autarquia, incentivo ou recomendação à sua comercialização. ' +
            'Consulte as condições gerais no site www.segurina.com.br.',
            50, 730, { align: 'justify', width: 500 }
        );

        doc.end();
    });
};

exports.contratarSeguro = async (req, res) => {
    const { typeId, planId } = req.params;
    const { dadosPessoais, pagamento, dadosBem, endereco, sessionId } = req.body;

    const verificaParametros = temParametros(typeId, planId);
    if (!verificaParametros.status) return res.status(400).json({ message: verificaParametros.message });

    const plano = catalogo.insuranceTypes
        .find(t => t.typeId.toLowerCase() === typeId.toLowerCase())
        ?.plans.find(p => p.planId.toLowerCase() === planId.toLowerCase());

    if (!plano) return res.status(400).json({ message: `Plano ${planId} não encontrado.` });

    const isContratanteValido = validarContratanteSeguroVida(dadosPessoais);
    if (!isContratanteValido.status) return res.status(400).json({ message: isContratanteValido.message });

    const isPagamentoValido = validarFormaDePagamento(pagamento, dadosPessoais.cpf);
    if (!isPagamentoValido.status) return res.status(400).json({ message: isPagamentoValido.message });

    res.status(200).json({
        status: "PROCESSING",
        message: "Seus dados já foram enviados para processamento. Assim que o pagamento for compensado, sua cobertura começará automaticamente."
    });

    (async () => {
        try {
            const delayMs = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
            console.log(`[Segurina] Processando pagamento e apólice... (${delayMs / 1000}s)`);

            await new Promise(resolve => setTimeout(resolve, delayMs));

            const resultado = await gerarESalvarCertificado(dadosPessoais, plano, { dadosBem, endereco });

            console.log(`[Segurina] PDF Gerado: ${resultado.nomeArquivo}`);
            console.log(`[Segurina] URL de Consulta: ${resultado.urlAcesso}`);

            const urlCallback = process.env.LINK_CALLBACK; 

            const payloadCallback = {
                idDatabase: process.env.ID_DATABASE,
                idCallback: sessionId, 
                answer: {
                    session_id: sessionId,
                    status_contratacao: "SUCESSO",
                    numero_apolice: String(resultado.numeroCertificado),
                    certificado_base: resultado.base64,
                    nome_seguro: plano.name,
                    email_usuario: dadosPessoais.email
                }
            };

            const configHeaders = {
                headers: {
                    'Authorization': process.env.AUTHORIZATION, 
                    'idSocialNetwork': process.env.ID_SOCIAL_NETWORK,  
                    'Content-Type': 'application/json'
                }
            };

            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (40000 - 10000 + 1)) + 10000));
            await axios.post(urlCallback, payloadCallback, configHeaders);

            console.log(`[Segurina] Callback enviado com sucesso para apólice ${resultado.numeroCertificado}`);

            console.log("[Segurina] Callback enviado. Aguardando 5s para disparar e-mail...");
            await new Promise(resolve => setTimeout(resolve, 5000));

            let htmlFinal = htmlEmailBase
                .replace('{{NOME}}', dadosPessoais.nome)
                .replace('{{PLANO}}', plano.name)
                .replace('{{NUMERO}}', resultado.numeroCertificado);

            const info = await transporter.sendMail({
                from: '"Segurina S.A. 🛡️" <seguros@segurina.com.br>',
                to: dadosPessoais.email,
                subject: `Sua proteção está ativa! Certificado nº ${resultado.numeroCertificado}`,
                text: `Olá, ${dadosPessoais.nome}! Sua proteção para ${plano.name} já está ativa.`,
                html: htmlFinal,
                attachments: [
                    {
                        filename: `Certificado_Segurina_${resultado.numeroCertificado}.pdf`,
                        path: resultado.path
                    }
                ]
            });

            console.log("--- DADOS PARA O CALLBACK DO BOT ---");
            console.log({
                status_contratacao: "SUCESSO",
                numero_apolice: resultado.numeroCertificado,
                certificado_base64: resultado.base64,
                nome_seguro: plano.name,
                email_usuario: dadosPessoais.email
            });

            console.log(`[Segurina] Certificado gerado com sucesso: ${resultado.path}`);
        } catch (error) {
            console.error("Erro no processamento assíncrono da Segurina:", error);
        }
    })();
};

exports.mostrarCertificado = (req, res) => {
    const { id } = req.params;
    const caminhoArquivo = path.join(__dirname, '..', 'certificados', `certificado_${id}.pdf`);

    if (!fs.existsSync(caminhoArquivo)) {
        return res.status(404).send(gerarHtmlErro(id));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=certificado.pdf');

    const stream = fs.createReadStream(caminhoArquivo);
    stream.pipe(res);
};