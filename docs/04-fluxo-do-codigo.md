# 4. Fluxo do código

Este documento percorre **como a informação anda** entre cliente e servidor: o protocolo de
mensagens, o passo a passo de uma jogada e o ciclo de vida de uma sala.

## Protocolo Socket.io

A comunicação em tempo real usa **eventos** Socket.io. Pense neles como "cartas trocadas
pelo correio": cada lado envia um evento com um nome e um conteúdo.

### Cliente → servidor

| Evento     | Conteúdo                  | O que pede                                                |
|------------|---------------------------|----------------------------------------------------------|
| `join`     | `{ code }`                | Entrar/reentrar numa sala (idempotente — ver abaixo).    |
| `move`     | um objeto `Move`          | Tentar uma jogada.                                       |
| `rematch`  | (nada)                    | Reiniciar a partida da sala.                             |

Os tipos de `Move` (campo `type`):

- `{ type:'place', cell }` — coloca uma peça na célula `cell`. **Encerra o turno.**
- `{ type:'card', card, cell }` — usa uma carta. Use `cell = -1` quando a carta não tem alvo.
- `{ type:'endTurn' }` — passa o turno sem colocar peça.

### Servidor → cliente

| Evento    | Conteúdo                          | O que comunica                                          |
|-----------|-----------------------------------|---------------------------------------------------------|
| `joined`  | `{ role, code }`                  | Seu papel na sala: `'x'`, `'o'` ou `'spectator'`.       |
| `state`   | uma `View` (ver `viewFor`)        | O estado completo para **desenhar a tela**.             |
| `invalid` | `string`                          | Uma jogada/ação foi recusada (mostrar o aviso ao usuário).|

> A `View` recebida em `state` é o que o cliente desenha. Ela esconde a mão do oponente e o
> baralho — ver [Arquitetura → A "view" por jogador](02-arquitetura.md#a-view-por-jogador--esconder-o-que-nao-pode-ser-visto).

## O passo a passo de uma jogada

Tudo entra pelo handler `socket.on('move', ...)` (`server.js:266`). Antes de aplicar
qualquer regra, o servidor faz **barreiras de segurança**:

1. Você está numa sala? Se não, ignora (`server.js:267`).
2. Você é jogador (não espectador)? Senão, `invalid` "Espectadores não jogam." (`server.js:269`).
3. A partida está **pronta** (os dois conectados)? Senão, `invalid` "Aguardando o outro
   jogador conectar…" (`server.js:272`).
4. É **o seu turno**? Senão, `invalid` "Não é o seu turno." (`server.js:275`).

Só então chama `applyMove(room.state, role, move)` (`server.js:277`), que **revalida tudo
de novo** e aplica o efeito. Por fim, **sempre** faz `broadcast` (`server.js:279`).

Dentro de `applyMove` (`server.js:114`), por tipo de jogada:

### `place` (colocar peça)
1. Recusa se a partida acabou ou já colocou peça neste turno (`server.js:118`).
2. Recusa se a célula não está vazia (ocupada ou bloqueada) (`server.js:121`).
3. Grava a peça, checa vitória (`checkWin`). Se não venceu, **encerra o turno** (`endTurn`).

### `card` (usar carta)
1. A carta existe? Você a tem na mão? Tem mana suficiente? (`server.js:131`).
2. Se a carta tem alvo, valida o alvo e a defesa (`server.js:138`).
3. **Desconta a mana**, aplica o efeito no `switch` por carta (`server.js:151`), **remove a
   carta da mão** (`server.js:161`) e checa vitória.

### `endTurn` (passar)
Registra no log e chama `endTurn` (`server.js:168`).

> **Importante:** usar carta **não** encerra o turno; só `place` e `endTurn` encerram. Por
> isso a ordem natural é: cartas → peça (ou → passar).

## Ciclo de vida da sala

### O objeto `room`

Criado em `getRoom` (`server.js:210`):

```js
room = {
  state,                       // estado do jogo (newGameState())
  players: { x: sid|null, o: sid|null },  // qual socket ocupa cada assento
  sockets: Map<sid, role>,     // todos os conectados e seus papéis
  spectators: Set<sid>,        // quem está só assistindo
  ready: boolean,              // true só quando x E o estão ocupados
  graceTimers: { x, o },       // timers de reconexão (RECONNECT_GRACE_MS = 8000)
}
```

### `join` — entrar numa sala (idempotente)

No handler `socket.on('join', ...)` (`server.js:237`):

- O código da sala é normalizado (minúsculas, sem espaços, até 24 caracteres) (`server.js:238`).
- **Idempotência:** se **este mesmo socket** já está na sala, o servidor só reenvia o estado
  e **não** atribui um novo assento (`server.js:242`). Isso corrige um bug antigo em que uma
  pessoa pegava `x` **e** `o` por emitir `join` duas vezes.
- Atribuição de papel: tenta `x`, depois `o`; se ambos ocupados, vira **espectador**
  (`server.js:255`).
- `updateReady(room)` recalcula `ready` e, na virada para `true`, anuncia no log (`server.js:225`).

### Reconexão com período de graça

Quando um jogador cai ou aperta F5, o handler `disconnect` chama `leaveRoom` (`server.js:295`):

- Se era jogador (`x`/`o`), o assento **não** é liberado na hora: vira `null`, `ready` cai
  para `false`, e abre-se uma **janela de 8 segundos** (`RECONNECT_GRACE_MS`, `server.js:208`)
  para a mesma pessoa **reentrar e retomar o assento** (`server.js:309`).
- Se ninguém reocupar nesse tempo, o assento fica livre para o próximo (`server.js:311`).
- Se a sala ficou totalmente vazia e sem timers pendentes, ela é **apagada** da memória
  (`server.js:319`).

No cliente, a flag `hasJoined` é **resetada no `disconnect`** para permitir reentrar
(`game.standby.html:285`).

## As 5 garantias (não regredir)

Estas correções foram pedidas e testadas. Ao mexer no código, **mantenha todas**:

1. **Jogo só inicia com os dois conectados.** `room.ready` só vira `true` com ambos os
   assentos ocupados; `move` é recusado enquanto `!ready` (`server.js:272`). O cliente trava
   o tabuleiro e mostra "Aguardando o outro jogador conectar…".
2. **Só joga quem é dono do turno.** Dupla checagem: o cliente desabilita os controles fora
   do turno (`myTurn()` em `game.standby.html:335`) e o servidor recusa `move` se
   `room.state.turn !== role` (`server.js:275`), além da revalidação em `applyMove`.
3. **Join idempotente.** O mesmo socket não ocupa dois assentos. O cliente tem um único
   caminho de join (flag `hasJoined`, `game.standby.html:261`) e o servidor é idempotente
   por `socket.id` (`server.js:242`).
4. **Reconexão com graça.** Ao cair/atualizar, o assento fica reservado por 8s para o mesmo
   jogador retomar, em vez de virar espectador.
5. **Sem tela travada.** `move` **sempre** faz `broadcast` (mesmo quando inválido), os dois
   lados re-renderizam e seleções pendentes (carta/colocação) são limpas fora do turno
   (`game.standby.html:415`).

## Como testar a lógica sem rede

As funções de regra (`newGameState`, `applyMove`, etc.) são **puras sobre o objeto `g`** —
não dependem de Socket.io. Dá para extraí-las e exercitá-las num script Node isolado
(importação dinâmica), sem subir a rede.

A lógica de salas pode ser testada com **sockets mockados**: um objeto com `on/emit/join` e
um `io` falso que captura os `emit`. Útil para cobrir: o gate de `ready`, a troca de turno,
o join duplicado, o espectador barrado e a jogada antes de haver oponente.

> Ainda **não há** testes automatizados versionados — é um item do backlog.
