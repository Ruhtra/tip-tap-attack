# 5. Telas e navegação do cliente

O front é **HTML/CSS/JS puro**, sem framework. A "navegação entre telas" é um truque
simples: **todas as telas existem no HTML ao mesmo tempo**, e a gente só mostra uma e
**esconde as outras** com a classe CSS `.hidden` (`display:none`).

Hoje existem dois arquivos de cliente — ver
[Visão geral → Estado atual](01-visao-geral.md#estado-atual-importante).

## `index.html` — o menu de abertura

Arquivo bem comentado, dividido em 3 partes: **estilos (CSS)**, **estrutura (HTML)** e
**comportamento (JS)**. É o exemplo mais didático de navegação do projeto.

### Como a troca de tela funciona

1. Cada tela é uma `<div class="screen">` com um `id` (`menu`, `pgIniciar`, …).
2. A lista de telas fica no vetor `TELAS` (`index.html:283`).
3. A função `mostrarTela(id)` percorre todas as telas e usa
   `classList.toggle('hidden', !ehAtela)` para **mostrar a escolhida e esconder o resto**
   (`index.html:286`).
4. Cada botão tem um atributo `data-go="idDaTela"`. Um único laço liga **todos** os botões
   de uma vez: ao clicar, chama `mostrarTela(botao.dataset.go)` (`index.html:297`).

> Esse padrão — "uma função que mostra uma tela e esconde as demais" — é o coração da
> navegação e vale a pena destacar no vídeo: é simples e se repete no cliente do jogo.

### Telas do menu

`Menu` (principal) → `Iniciar`, `Configurar`, `Como jogar`, `Créditos`. Hoje as páginas
internas são **placeholders** (só o título + botão "Voltar"), prontas para receber o
conteúdo real (ex.: a tela `Iniciar` vai mostrar o QR Code da sessão).

## `game.standby.html` — o cliente do jogo

Mesmo padrão de navegação, agora com mais telas. A lista é `SCREENS` (`game.standby.html:252`)
e a função equivalente é `showScreen(id)` (`game.standby.html:253`).

### As telas

- **Painel do Administrador** (`adminMenu`) — menu do professor: Iniciar, Configurar, Como
  jogar, Créditos.
- **Iniciar / QR** (`qrScreen`) — onde o QR Code da sessão vai aparecer (hoje placeholder).
- **Configuração** (`configScreen`) — resumo dos parâmetros da partida.
- **Como jogar** (`rulesScreen`) — as regras e a lista de cartas.
- **Créditos** (`creditsScreen`).
- **Lobby** (`lobby`) — onde se escolhe o nome da sala e entra.
- **Game** (`game`) — o tabuleiro, as estatísticas, a mão e o log.

### Entrar na sala (lobby e auto-join)

- O cliente lê `?sala=` ou `?room=` da URL (`game.standby.html:246`). Se houver, **pula o
  menu** e entra automaticamente quando a conexão abre (`game.standby.html:281`).
- O **join é único**, controlado pela flag `hasJoined` (`game.standby.html:261`) — isso evita
  o bug de uma pessoa pegar dois assentos. Ver
  [Fluxo do código → Reconexão](04-fluxo-do-codigo.md#reconexao-com-periodo-de-graca).
- Ao entrar, o cliente recebe `joined` e troca para a tela `game`; a caixa de
  compartilhamento mostra o link da sala, clicável para copiar (`game.standby.html:288`).

### Como a tela do jogo é desenhada: `render()`

Toda vez que chega um `state` do servidor, o cliente guarda em `ST` e chama `render()`
(`game.standby.html:300`). A função `render` (`game.standby.html:341`) **redesenha tudo** a
partir do estado: ela não guarda "verdade" própria, só reflete o que o servidor mandou.
Em resumo, `render` cuida de:

- o **selo de turno** (de quem é a vez / aguardando / fim de jogo);
- os **assentos** (quem está conectado, e qual é você);
- as **estatísticas** de mana e contagem de cartas dos dois jogadores;
- o **tabuleiro**: para cada célula, decide a classe (peça `x`/`o`, bloqueada, defendida,
  vencedora) e se ela é **clicável como alvo** (`targetable`) conforme a carta selecionada
  ou o modo de colocar peça (`game.standby.html:371`);
- a **sua mão** (só a sua — a do oponente nunca chega), marcando cartas que você **não pode
  pagar** com a classe `cant` (`game.standby.html:391`);
- os **botões** "Colocar peça" / "Passar turno", habilitados só no seu turno;
- a limpeza de seleções pendentes quando **não é a sua vez** (`game.standby.html:415`) — é a
  garantia "sem tela travada";
- o **prompt** (a frase de orientação) e o **log** de eventos;
- a **tela de vitória** (`veil`) quando a partida termina.

### A dupla checagem do turno no cliente

A função `myTurn()` (`game.standby.html:335`) só retorna `true` se: a partida está pronta
(2 jogadores), não acabou, é a sua vez **e** você é jogador (não espectador). Todos os
cliques (carta, célula, botões) checam `myTurn()` antes de enviar um `move`. Mas lembre:
**isso é só conforto visual** — quem decide de verdade é o servidor
([Arquitetura](02-arquitetura.md)).

## Onde mexer com cuidado

- A navegação por `.hidden` é proposital e simples. Não troque por roteador/SPA sem motivo:
  isso quebraria a clareza didática.
- Qualquer estado de jogo mostrado na tela **vem do `state`** do servidor. Não invente
  estado local que "decida" regra — só estado de **interface** (ex.: `placeMode`, `pending`,
  qual carta está selecionada).
