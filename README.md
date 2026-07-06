# Tip-Tap Attack — Torneio de Jogo da Velha Tático

Um **torneio de jogo da velha 4×4** para a sala de aula, em tempo real, usando **Node + Socket.io**.
O professor projeta um **QR Code**, os alunos entram pelo celular digitando o nome, e o sistema
monta o **chaveamento mata-a-mata** sozinho. A lista de presença pode ser **baixada em CSV**.

O servidor é **autoritativo**: ele guarda o estado e valida cada jogada, então não dá pra
trapacear e os dois lados nunca dessincronizam. Todo o jogo é desenhado num **canvas** (estilo
p5.js), sem framework e sem build.

```
tip-tap-attack/
├── server.js       ← sobe o Express + Socket.io (fininho)
├── arbitro.js      ← orquestra sessão/torneio; único que fala com os clientes
├── nucleo/         ← a lógica pura (sem rede, sem tela)
│   ├── partida.js  ← regras do jogo
│   ├── torneio.js  ← chaveamento mata-a-mata
│   └── sessao.js   ← sessões do professor (lobby, reconexão)
├── ui/             ← o cliente (canvas)
│   ├── index.html  ← um <canvas> + a caixa de nome
│   └── js/         ← estado.js · desenho.js · telas.js · rede.js · app.js
├── docs/           ← documentação (base do vídeo)
└── package.json
```

---

## 1. Rodar localmente

Pré-requisito: **Node.js 18+** (https://nodejs.org).

```bash
cd tip-tap-attack
npm install
npm start
```

Você verá:

```
TIP-TAP ATTACK rodando em  http://localhost:3000
```

Abra `http://localhost:3000`. Para testar sozinho, abra o **painel** numa aba e
`http://localhost:3000/?sessao=CODIGO` em duas outras abas (dois "alunos").

---

## 2. Usar em sala (pela internet)

O `localhost` só funciona na sua máquina. Para os alunos entrarem pelo celular, exponha o
servidor à internet.

### Opção A — túnel rápido (sem deploy)

Com o servidor rodando, em **outro terminal**:

```bash
npx localtunnel --port 3000
```

Ele te dá uma URL pública (tipo `https://algo.loca.lt`). O QR Code do painel já aponta pra
ela — é só projetar. (Alternativa: `ngrok http 3000`.)

### Opção B — hospedar de graça (link fixo)

Suba num serviço gratuito de Node — **Render**, **Railway**, **Glitch** ou **Replit**
(build `npm install`, start `npm start`). Você recebe uma URL pública fixa.

---

## 3. Como o torneio funciona

1. O professor abre o app e clica **Iniciar torneio** → vira o **painel** (QR Code + código da sessão).
2. Cada aluno **escaneia o QR** (ou abre `.../?sessao=CODIGO`), digita o **nome** e entra.
3. O professor acompanha a **lista viva** de alunos, pode **Ver alunos** e **Baixar CSV** da presença.
4. Se quiser jogar também, clica **Também vou jogar** — isso **abre o jogo numa aba nova**; a aba
   do painel continua mostrando o chaveamento e a lista.
5. Ao clicar **Iniciar torneio**, o sistema sorteia a **chave** (mata-a-mata, tratando número
   ímpar com "bye") e roda os confrontos. Entre as partidas, todo mundo vê o chaveamento.

## 4. Como o jogo funciona

- Tabuleiro **4×4**, vitória com **3 em linha** (horizontal, vertical ou diagonal).
- A cada turno você ganha **mana** (sobe gradualmente até 6) e compra cartas até ter 4 na mão.
- No seu turno dá pra usar **cartas** (gastam mana) e colocar **uma peça**. Colocar não encerra
  o turno — você finaliza no botão **Finalizar turno**.
- **Duas cartas:** **Bloquear** (sela um espaço vazio) e **Apagar** (remove uma peça).
- **Deu velha** (tabuleiro cheio, ninguém fez 3): ganha quem tiver **mais peças**; se empatar
  nas peças, a partida é refeita.

## 5. Notas técnicas

- O cliente nunca decide nada: manda a intenção (`place` / `card` / `endTurn`) e o servidor valida
  e devolve o novo estado. A mão do oponente nunca chega no seu navegador.
- **Reconexão:** cada navegador tem um id fixo no `localStorage`. Se cair, é só reabrir o link —
  o servidor te devolve pra mesma partida.
- Porta configurável: `PORT=8080 npm start`.

Detalhes de arquitetura e dos fluxos estão em **`docs/`**.
