# 🖥️ RetroAI Terminal

Paslı CRT tarzı retro terminal arayüzü — Ollama ile çalışır.

## 🚀 Kurulum
```bash
npm install
npm start
PORT=8080 node server.js
OLLAMA_URL=http://192.168.1.5:11434 node server.js
retro-terminal/
├── server.js        # Express sunucusu, Ollama proxy
├── package.json
└── public/
    └── index.html   # Retro terminal arayüzü


