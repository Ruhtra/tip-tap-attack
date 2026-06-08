# 2. Arquitetura — o servidor autoritativo

Esta é a **decisão de design mais importante do projeto** e precisa ser preservada.

## A ideia em uma frase

> **O servidor manda. O cliente só pede e desenha.**

O cliente (o navegador) **nunca** decide o resultado de nada. Ele apenas:

1. envia **intenções** de jogada (`move`), e
2. **renderiza** o estado (`state`) que o servidor devolve.

Toda a regra do jogo — de quem é o turno, se há mana suficiente, se o alvo da carta é
válido, se alguém venceu — é validada **no servidor**, dentro da função `applyMove`
(`server.js:114`).

## Por que isso importa

- **Anti-trapaça:** como o navegador do aluno não decide nada, não adianta editar o
  JavaScript da página para "ganhar". O servidor revalida tudo.
- **Sem dessincronização:** existe **uma única fonte da verdade** (o estado no servidor).
  Os dois jogadores sempre veem a mesma partida, porque os dois recebem a mesma base de
  estado depois de cada jogada.
- **Sem vazamento de informação:** o servidor monta uma *view* específica para cada
  jogador e **esconde a mão do oponente** e o baralho. Você recebe só o que pode ver.

## O caminho de uma jogada (visão de alto nível)

```
  NAVEGADOR (cliente)                         SERVIDOR (autoritativo)
  ──────────────────                          ───────────────────────
  clico numa célula
        │
        │   socket.emit('move', {...})
        └──────────────────────────────────▶  recebe 'move'
                                               valida: é a sua vez? jogo pronto?  (server.js:266)
                                               applyMove(...) aplica a regra        (server.js:114)
                                               monta a view de CADA jogador         (viewFor, server.js:178)
                                       ◀──────  socket.emit('state', view)  (broadcast)
  recebe 'state'
  render() redesenha a tela
```

Pontos-chave do desenho:

- **O `move` sempre provoca um `broadcast`** (`server.js:279`), mesmo quando a jogada é
  inválida. Assim os dois lados re-renderizam e a tela nunca "trava" num estado pendente.
- O servidor envia a mensagem `invalid` **só para quem** fez a jogada errada
  (`server.js:278`), para mostrar o aviso a essa pessoa.

## A "view" por jogador — esconder o que não pode ser visto

A função `viewFor(room, player)` (`server.js:178`) é quem decide **o que cada cliente
enxerga**. Ela copia o estado público (tabuleiro, turno, mana, contadores) e:

- envia **`yourHand`** = só a mão do jogador que está pedindo;
- envia **`handCounts`** = apenas a **quantidade** de cartas do oponente (não as cartas);
- **nunca** envia o baralho (`deck`).

Resultado: a informação secreta do adversário não chega ao seu navegador — não há como
"espiar" abrindo o DevTools.

## Onde mora o estado

Não há banco de dados. Tudo vive em memória num `Map` chamado `rooms` (`server.js:207`).
Cada sala guarda o estado do jogo, quem são os jogadores, os espectadores e os timers de
reconexão. Os detalhes do objeto `room` e seu ciclo de vida estão em
[Fluxo do código → Ciclo de vida da sala](04-fluxo-do-codigo.md#ciclo-de-vida-da-sala).

> Consequência: se o servidor reiniciar, as partidas em andamento se perdem. Isso é
> aceitável para o uso em aula e mantém o projeto simples (sem banco).

## Regra de ouro para features novas

Qualquer funcionalidade que envolva **regra de jogo** deve ser implementada e validada
**no servidor primeiro**. O cliente é só apresentação. Se a regra não está em `applyMove`
(ou numa função pura chamada por ele), ela **não existe** do ponto de vista do jogo.
