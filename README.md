# Tip-Tap Attack — Jogo da Velha Tático multiplayer

Multiplayer em tempo real (2 jogadores) por link, usando **Node + Socket.io**.
O servidor é **autoritativo**: ele guarda o estado da partida e valida cada jogada,
então não dá para trapacear e os dois clientes nunca dessincronizam.

```
tip-tap-attack/
├── server.js      ← servidor (regras + sincronização)
├── index.html     ← cliente (o jogo, servido pelo próprio servidor)
├── package.json
└── README.md
```

---

## 1. Rodar localmente (teste rápido na sua máquina)

Pré-requisito: **Node.js 18+** instalado (https://nodejs.org).

```bash
cd tip-tap-attack
npm install
npm start
```

Você verá:

```
TIP-TAP ATTACK rodando em  http://localhost:3000
```

Abra `http://localhost:3000` no navegador. Para testar sozinho com 2 "jogadores",
abra a mesma URL em **duas abas** (ou duas janelas anônimas) com a mesma sala:
`http://localhost:3000/?sala=teste`. A primeira aba vira o Jogador 1, a segunda o Jogador 2.

---

## 2. Jogar com seu amigo pela internet

O `localhost` só funciona na sua máquina. Para o seu amigo entrar, você precisa
expor o servidor à internet. Duas formas fáceis:

### Opção A — túnel rápido (mais simples, sem deploy)

Com o servidor rodando (`npm start`), em **outro terminal**:

```bash
npx localtunnel --port 3000
```

Ele te dá uma URL pública tipo `https://algo-aleatorio.loca.lt`.
Mande para seu amigo:  `https://algo-aleatorio.loca.lt/?sala=nossa-sala`
e abra você também o mesmo link. Pronto — vocês jogam em tempo real.

> Alternativa equivalente: `ngrok http 3000` (precisa criar conta grátis no ngrok).

### Opção B — hospedar de graça (link fixo, fica no ar)

Suba a pasta num serviço gratuito de Node. Os mais simples:

- **Render** (render.com): novo "Web Service", build `npm install`, start `npm start`.
- **Railway** (railway.app): "Deploy from repo" e pronto.
- **Glitch / Replit**: importe os arquivos e clique em Run.

Qualquer um deles te dá uma URL pública fixa. Compartilhe assim:
`https://SEU-APP.onrender.com/?sala=nossa-sala`

---

## Como funciona o jogo

- Tabuleiro **4×4**, vitória com **3 em linha** (horizontal, vertical ou diagonal).
- Cada turno você ganha **mana** (sobe gradualmente até 6) e compra cartas até ter 4 na mão.
- No seu turno você pode jogar **cartas** (gastam mana) **e** **colocar uma peça**.
  Colocar a peça **encerra o turno** — então use as cartas antes de colocar.
- Cartas: Bloquear, Apagar, Defender, Roubar, Expandir, Saque, Sobrecarga.

## Papéis e salas

- O **primeiro** a entrar numa sala é o Jogador 1 (x); o **segundo** é o Jogador 2 (o).
- A partir do terceiro, entram como **espectadores** (veem o jogo, não jogam).
- Cada nome de sala diferente é uma partida separada — dá para ter vários pares
  jogando ao mesmo tempo no mesmo servidor.
- Botão "Jogar de novo" reinicia a partida da sala para os dois.

## Notas técnicas

- O cliente nunca decide nada: ele manda a intenção (`place` / `card` / `endTurn`)
  e o servidor valida e devolve o novo estado. A mão do oponente nunca é enviada
  para o seu navegador (sem vazamento de informação).
- Reconexão: se cair, é só reabrir o link da mesma sala.
- Porta configurável por variável de ambiente: `PORT=8080 npm start`.
