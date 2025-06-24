// APP COMPLETO: Express com HTML embutido para download em massa de imagens (com CORS, formulário real e compatível com Render)

const express = require('express');
const axios = require('axios');
const archiver = require('archiver');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Página principal com formulário real
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Download em Massa</title>
  <style>
    body { font-family: sans-serif; padding: 20px; max-width: 700px; margin: auto; }
    textarea { width: 100%; height: 200px; }
    button { padding: 10px 20px; margin-top: 10px; cursor: pointer; }
    #status { margin-top: 15px; font-size: 14px; color: green; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h2>Baixar Imagens em ZIP</h2>
  <p>Cole os links das imagens (um por linha):</p>
  <form method="POST" action="/download-images">
    <textarea name="links" placeholder="Cole os links aqui..."></textarea>
    <br>
    <button type="submit">Baixar .zip</button>
  </form>
  <div id="status">Aguarde o download iniciar...</div>
</body>
</html>`);
});

// Rota com envio via form POST
app.post('/download-images', async (req, res) => {
  let links = req.body.links;
  if (!links) return res.status(400).send('Nenhum link recebido');

  // Aceita links separados por nova linha
  links = links.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!Array.isArray(links) || links.length === 0) {
    return res.status(400).send('Lista de links inválida');
  }

  res.setHeader('Content-Disposition', 'attachment; filename=imagens.zip');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  const archive = archiver('zip');
  archive.on('error', err => {
    console.error('Erro no archiver:', err);
    res.status(500).send('Erro ao gerar o arquivo ZIP.');
  });

  archive.pipe(res);

  for (let i = 0; i < links.length; i++) {
    const url = links[i];
    try {
      const response = await axios.get(url, { responseType: 'stream' });
      const filename = url.split('/').pop().split('?')[0] || `imagem${i + 1}.jpg`;
      archive.append(response.data, { name: filename });
      console.log(`✔️ Imagem adicionada: ${filename}`);
    } catch (error) {
      console.error(`❌ Falha ao baixar ${url}:`, error.message);
      archive.append(`Erro ao baixar ${url}: ${error.message}\n`, { name: `erro_${i + 1}.txt` });
    }
  }

  archive.finalize();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
