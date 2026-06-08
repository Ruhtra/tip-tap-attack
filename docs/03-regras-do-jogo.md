# 3. Regras do jogo

> **Fonte da verdade:** `server.js`. Se a regra escrita aqui divergir do código, o **código
> vence** — e este documento deve ser corrigido.

## Constantes do jogo

Definidas em `server.js:22`:

| Constante     | Valor | Significado                                  |
|---------------|-------|----------------------------------------------|
| `WIN`         | `3`   | Quantas peças em linha para vencer.          |
| `HAND_LIMIT`  | `4`   | Máximo de cartas na mão.                      |
| `MANA_MAX`    | `6`   | Teto de mana por turno.                       |

O tabuleiro começa **4×4** (`rows:4, cols:4` em `newGameState`, `server.js:48`), mas pode
**crescer em colunas** durante a partida com a carta *Expandir*.

## Objetivo: 3 em linha

Vence quem alinhar **3 peças da sua cor** em qualquer direção: horizontal, vertical ou nas
duas diagonais. A checagem está em `findWinLine` (`server.js:93`), que varre o tabuleiro e
testa as 4 direções de `DIRS = [[0,1],[1,0],[1,1],[1,-1]]` (`server.js:92`).

Quando alguém vence, o servidor marca `g.over=true`, guarda `g.winner` e a linha vencedora
em `g.winline` (`checkWin`, `server.js:107`). O cliente usa `winline` para **destacar** as
células que fecharam o jogo.

## O turno: o que acontece a cada vez

No **início do seu turno** (`startTurn`, `server.js:74`):

1. A mana disponível do turno é recarregada (`manaThisTurn`).
2. As **defesas que eram suas expiram** (uma peça defendida fica protegida só até o seu
   próximo turno).
3. Você **compra 1 carta** (até o limite de 4 na mão).

A **mana cresce devagar** ("ramp"), calculada na troca de turno (`endTurn`, `server.js:83`):

```js
mana = min(6, 1 + floor((turnCount + 1) / 2))
```

Na prática: começa em 1 e sobe ~+1 a cada 2 turnos, até o teto de 6. Isso faz as cartas
caras (como *Roubar*, custo 3) só ficarem viáveis depois de alguns turnos.

### O que você pode fazer no seu turno

- Jogar **quantas cartas quiser**, enquanto tiver mana.
- Colocar **uma** peça.

> **Ordem importa:** colocar a peça **encerra o turno** (`place` chama `endTurn`,
> `server.js:126`). Por isso, **use as cartas antes** de colocar a peça. Se quiser não
> colocar peça, dá para **passar o turno** (`endTurn`).

## As cartas

Definidas no objeto `CARDS` (`server.js:24`), com a descrição amigável em `CARD_DS`
(`server.js:34`). Cada carta tem **custo de mana** e um **tipo de alvo**.

| Carta        | Glifo | Custo | Alvo          | Efeito                                                                 |
|--------------|:-----:|:-----:|---------------|------------------------------------------------------------------------|
| **Bloquear** |  ⊘   |  1    | espaço vazio  | Sela um espaço vazio **para sempre** (vira `'block'`). Ninguém joga ali.|
| **Apagar**   |  ∅   |  2    | qualquer peça | Remove uma peça do tabuleiro. **Falha** em peça defendida.              |
| **Defender** |  ⛨   |  1    | peça sua      | Protege uma peça sua **até o seu próximo turno** (não pode ser apagada/roubada). |
| **Roubar**   |  ⇄   |  3    | peça inimiga  | Converte uma peça do inimigo para a **sua** cor. **Falha** em peça defendida. |
| **Expandir** |  ⊞   |  2    | (sem alvo)    | Adiciona **uma coluna** ao tabuleiro, preservando o que já estava lá.   |
| **Saque**    |  ≣   |  1    | (sem alvo)    | Compra **2 cartas** (respeita o limite de 4 na mão).                    |
| **Sobrecarga**| ⚡   |  0    | (sem alvo)    | **+2 de mana** neste turno. Serve para encadear cartas caras.           |

O baralho de cada jogador é embaralhado no início (`DECK_TEMPLATE`, `server.js:33`;
`shuffle`, `server.js:44`). Quando acaba, é reembaralhado (`drawCard`, `server.js:62`).

### Como o alvo é validado

A validação do alvo está em `applyMove` (`server.js:138`). Os tipos de alvo (`card.target`):

- `empty` — a célula precisa estar vazia.
- `anyPiece` — precisa ter uma peça (`x` ou `o`).
- `ownPiece` — precisa ser **sua** peça.
- `enemyPiece` — precisa ser peça do **adversário**.
- `none` — a carta não tem alvo (`cell = -1`).

Para `anyPiece` e `enemyPiece`, o servidor também checa se a peça está **defendida**
(`g.defended[i]`) e, se estiver, recusa com "Essa peça está defendida!" (`server.js:144`).

## Defesa: como funciona e quando expira

Quando você usa *Defender*, o servidor marca `g.defended[i] = player` (`server.js:154`).
Essa marca diz **quem** defendeu aquela célula. Ela é removida no **início do próximo turno
do dono** (`startTurn`, `server.js:76`). Ou seja: a defesa cobre você durante o turno do
adversário e cai assim que volta para você.

## Expandir: por que mexe nos índices

O tabuleiro é guardado como um **vetor plano** (`g.cells`), onde a célula da linha `r`,
coluna `c` fica no índice `idx(g,r,c) = r*g.cols + c` (`server.js:68`).

A carta *Expandir* chama `growBoard` (`server.js:86`), que **reconstrói** `cells` e
`defended` para a nova largura, copiando o conteúdo antigo para as posições certas. Como o
número de colunas muda, **qualquer índice salvo em outro lugar precisa ser recalculado** —
não dá para guardar um índice "cru" e reusar depois de um expand.

## Determinismo

Há **embaralhamento** do baralho no início (sorte na ordem das cartas), mas a partida é
decidida por **decisão**, não por sorte oculta: ambos os jogadores têm o mesmo baralho-base
e veem o tabuleiro inteiro o tempo todo.
