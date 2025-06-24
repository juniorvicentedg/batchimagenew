// APP COMPLETO: Express com HTML embutido para download em massa de imagens (com suporte a CORS)

const express = require('express');
const axios = require('axios');
const archiver = require('archiver');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Página principal
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
  <textarea id="links" placeholder="Cole os links aqui..."></textarea>
  <br>
  <button onclick="baixarZip()">Baixar .zip</button>
  <div id="status"></div>

  <script>
    async function baixarZip() {
      const status = document.getElementById('status');
      const rawLinks = document.getElementById('links').value;
      const links = rawLinks.split(/\n+/).map(l => l.trim()).filter(Boolean);
      if (links.length === 0) return alert('Cole ao menos um link!');

      status.textContent = 'Gerando arquivo .zip...';

      const response = await fetch('/download-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links })
      });

      if (!response.ok) {
        status.textContent = 'Erro ao gerar o zip.';
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'imagens.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();

      status.textContent = 'Download concluído com sucesso!';
    }
  </script>
</body>
</html>`);
});

// Rota para gerar e enviar o ZIP
app.post('/download-images', async (req, res) => {
  const { links } = req.body;
  if (!Array.isArray(links) || links.length === 0) {
    return res.status(400).send('Lista de links inválida');
  }

  res.setHeader('Content-Disposition', 'attachment; filename=imagens.zip');
  res.setHeader('Content-Type', 'application/zip');

  const archive = archiver('zip');
  archive.pipe(res);

  for (let i = 0; i < links.length; i++) {
    const url = links[i];
    try {
      const response = await axios.get(url, { responseType: 'stream' });
      const filename = url.split('/').pop().split('?')[0] || `imagem${i + 1}.jpg`;
      archive.append(response.data, { name: filename });
    } catch (error) {
      console.error(`Erro ao baixar ${url}:`, error.message);
    }
  }

  archive.finalize();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
