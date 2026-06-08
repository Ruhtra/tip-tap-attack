# Documentação — Tip-Tap Attack

Esta pasta reúne **toda a explicação de como o projeto funciona**: as regras do jogo,
a arquitetura e os fluxos do código. O objetivo é servir de base para o **vídeo
explicativo** da disciplina de Lógica de Programação — por isso cada documento tenta
explicar o *porquê* de cada decisão, em linguagem simples, apontando para o trecho de
código correspondente (ex.: `server.js:114`).

> **Regra do projeto:** sempre que uma tarefa mexer em **fluxo** (regra de jogo, protocolo
> de rede, ciclo de vida de sala, navegação de telas, presença/QR Code), a explicação
> desse fluxo deve ser **escrita ou atualizada aqui** em `docs/`. A documentação é um
> entregável, não um extra.

## Índice

1. [Visão geral](01-visao-geral.md) — o que é o projeto, a stack, como rodar e a estrutura de arquivos.
2. [Arquitetura](02-arquitetura.md) — o princípio do **servidor autoritativo** e por que ele importa.
3. [Regras do jogo](03-regras-do-jogo.md) — tabuleiro, vitória, mana, turno e todas as cartas.
4. [Fluxo do código](04-fluxo-do-codigo.md) — protocolo Socket.io, o passo a passo de uma jogada e o ciclo de vida da sala.
5. [Telas e navegação do cliente](05-telas-cliente.md) — o menu, o lobby, o painel do administrador e a renderização do jogo.
6. [Presença por QR Code](06-presenca-qrcode.md) — a camada de chamada da turma (proposta; em construção).

## Mapa rápido dos arquivos

| Arquivo             | Papel                                                                 |
|---------------------|-----------------------------------------------------------------------|
| `server.js`         | Servidor autoritativo: guarda o estado, valida jogadas, sincroniza.   |
| `index.html`        | **Menu inicial** do app (tela de abertura, navegação entre telas).    |
| `game.standby.html` | **Cliente completo do jogo**: lobby, painel do admin, tabuleiro, cartas. |
| `PROPOSTA.md`        | Proposta entregue ao professor (presença por QR Code + jogo).         |
| `CLAUDE.md`          | Contexto e convenções para dar continuidade ao projeto.               |
| `docs/`              | Esta documentação.                                                    |

> **Atenção (estado atual):** o jogo funcional está em `game.standby.html`, enquanto
> `index.html` é o novo menu de abertura ainda sendo integrado. Ver
> [Visão geral](01-visao-geral.md#estrutura-de-arquivos) para detalhes.
