# 1. Visão geral

## O que é o projeto

**Tip-Tap Attack** tem duas partes que andam juntas:

1. **Um jogo da velha tático multiplayer** — tabuleiro 4×4, vence quem alinhar 3 em
   linha, com uma **mão de cartas de habilidade** que gastam mana e alteram o tabuleiro.
   Dois jogadores jogam em tempo real por um link compartilhado.
2. **Uma camada de presença por QR Code** (objetivo de produto da proposta) — o professor
   projeta um QR Code no telão, cada aluno escaneia, informa o nome e fica registrado como
   presente. A lista pode ser exportada (Excel/CSV/TXT). Enquanto a chamada acontece, os
   alunos podem entrar no jogo.

A ideia é transformar a **chamada da turma** num momento rápido e divertido. O alvo de uso
é a sala de aula da disciplina de Lógica de Programação, eventualmente com torneio
mata-a-mata entre os alunos.

> A descrição completa da proposta (problema, objetivos, telas, perguntas ao professor)
> está em [`PROPOSTA.md`](../PROPOSTA.md).

## Princípio que guia o desenvolvimento: **código simples de explicar**

Como o trabalho termina com um **vídeo explicativo** de como cada trecho do código
funciona, a prioridade é **clareza acima de esperteza**:

- HTML/CSS/JS puro no front, **sem framework e sem build step**.
- Funções pequenas, com nomes em português e comentários que explicam o *porquê*.
- Nada de bibliotecas que escondam a lógica. Quem assistir o vídeo precisa conseguir
  acompanhar linha a linha.

## Stack

- **Backend:** Node.js (ESM, `"type":"module"`) + Express (serve os arquivos estáticos) +
  Socket.io 4.x (comunicação em tempo real).
- **Frontend:** páginas HTML servidas pelo próprio servidor. HTML/CSS/JS puro. O cliente
  Socket.io é carregado de `/socket.io/socket.io.js`.
- **Sem banco de dados.** Todo o estado vive **em memória** no servidor (um `Map` de salas).
  A lista de presença (quando existir) será exportada em arquivo.
- Requer **Node 18+**.

## Como rodar

```bash
npm install
npm start          # ou: node server.js
# abre em http://localhost:3000   (porta configurável: PORT=8080 npm start)
```

**Testar localmente com 2 jogadores:** abra `http://localhost:3000/?sala=teste` em duas
abas. A primeira aba vira o **Jogador 1 (`x`)**, a segunda o **Jogador 2 (`o`)**. A URL
aceita `?sala=` **ou** `?room=` para entrar automaticamente na sala.

**Jogar pela internet:** com o servidor rodando, em outro terminal:
`npx localtunnel --port 3000` e compartilhe a URL pública com `?sala=NOME` no final.

> Hoje **não há** script de teste/lint no `package.json`. Os testes são ad-hoc — ver
> [Fluxo do código → Como testar a lógica sem rede](04-fluxo-do-codigo.md#como-testar-a-logica-sem-rede).

## Estrutura de arquivos

```
tip-tap-attack/
├── server.js            ← servidor autoritativo (regras + sincronização)
├── index.html           ← MENU inicial do app (tela de abertura)
├── game.standby.html    ← CLIENTE COMPLETO do jogo (lobby + admin + tabuleiro + cartas)
├── package.json
├── README.md            ← instruções de execução/deploy
├── PROPOSTA.md          ← proposta entregue ao professor
├── CLAUDE.md            ← contexto e convenções do projeto
└── docs/                ← esta documentação
```

### Estado atual (importante)

O projeto está num momento de transição entre **"só o jogo"** e **"jogo + presença"**:

- **`game.standby.html`** contém o **jogo funcionando por completo** (todas as telas e a
  lógica de render). É o cliente que o `server.js` historicamente servia como `index.html`.
- **`index.html`** hoje é o **novo menu de abertura** do Tip-Tap Attack — bem comentado e
  didático, mas ainda com as páginas internas como *placeholder*. Ele será o ponto de
  entrada que costura o menu, o jogo e a futura tela de presença/QR Code.

Por padrão, o Express serve `index.html` na raiz (`server.js:17` usa `express.static`).
Para abrir diretamente o jogo completo durante o desenvolvimento, acesse
`http://localhost:3000/game.standby.html`.

> Sempre que essas responsabilidades de arquivo mudarem (ex.: o menu passar a embutir o
> jogo), **atualize esta seção e o [CLAUDE.md](../CLAUDE.md)**.
