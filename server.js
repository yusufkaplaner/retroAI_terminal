const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// List available models
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    const models = (data.models || []).map(m => m.name);
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: 'Ollama bağlantısı kurulamadı. Çalışıyor mu?' });
  }
});

// Chat endpoint — streams response back to client
app.post('/api/chat', async (req, res) => {
  const { model, messages } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'model ve messages zorunlu' });
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!ollamaRes.ok) {
      return res.status(502).json({ error: `Ollama hatası: ${ollamaRes.status}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const token = json.message?.content || '';
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
          if (json.done) res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        } catch {}
      }
    }
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║   RETRO TERMINAL  //  PORT ${PORT}      ║`);
  console.log(`║   Ollama: ${OLLAMA_URL}  ║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log(`\n>> http://localhost:${PORT} adresini aç\n`);
});
