# 6. Presença por QR Code (proposta — em construção)

> **Estado:** este é o **foco da Unidade 3** segundo a [proposta](../PROPOSTA.md), mas ainda
> **não está implementado** no código. Este documento descreve o **fluxo pretendido** para
> guiar a implementação. Conforme o código nascer, atualize aqui o que de fato existe e
> aponte os trechos (ex.: `server.js:NNN`).

## A ideia

Acoplar **controle de presença** à abertura do app. O professor inicia uma sessão e projeta
um **QR Code** no telão; cada aluno escaneia, informa o nome e fica **registrado como
presente**, com data/hora. A lista pode ser **exportada** (Excel/CSV/TXT). Enquanto isso, os
alunos entram no jogo.

## Fluxo pretendido

### Lado do professor (administrador)
1. Abre o app e cai no **Painel do Administrador** (o menu).
2. Clica em **Iniciar** → o servidor cria uma **sessão** e o cliente mostra o **QR Code**.
3. Acompanha a **tabela de presença** sendo preenchida **em tempo real** conforme os alunos
   entram (via Socket.io, mesmo canal do jogo).
4. Ao final, **exporta** a lista.

### Lado do aluno
1. Aponta a câmera para o **QR Code** projetado.
2. Abre uma tela simples pedindo o **nome (ou matrícula/identificador)**.
3. Confirma → fica **registrado como presente** automaticamente.
4. Pode **entrar no jogo** e jogar durante a chamada.

```
  PROFESSOR                         SERVIDOR                      ALUNO (celular)
  ─────────                         ────────                      ───────────────
  Iniciar  ───────────────────────▶ cria sessão + QR
  vê QR no telão  ◀─────────────────                              escaneia o QR
                                                                  abre tela de nome
                                    registra presença  ◀───────── envia nome
  tabela atualiza  ◀──────────────  (broadcast da lista)
  Exportar  ───────────────────────▶ gera Excel/CSV/TXT
```

## Decisões de design a respeitar

- **Servidor autoritativo também aqui.** A lista de presença é **estado do servidor**, igual
  ao jogo. O cliente só envia "cheguei, meu nome é X" e renderiza a tabela que o servidor
  devolve. Ver [Arquitetura](02-arquitetura.md).
- **Sem banco de dados.** A presença vive em memória (provavelmente dentro do objeto da
  sessão/sala) e é **exportada em arquivo** quando o professor pede. Isso mantém o projeto
  simples, coerente com o resto.
- **Simples de explicar.** Geração de QR Code e exportação devem usar a abordagem mais
  legível possível (idealmente algo que o vídeo consiga mostrar passo a passo).

## Campos da presença (a confirmar com o professor)

A proposta deixa em aberto (ver perguntas em [`PROPOSTA.md` §10](../PROPOSTA.md)):

- **Nome / identificador** (mínimo).
- Possíveis extras: **matrícula**, **turma**, **data/hora** automática.
- Possível regra: **uma presença por aluno** (evitar duplicatas).

## Formato de exportação (a confirmar)

A proposta cita **Excel, CSV e/ou TXT**. Sugestão de implementação simples e legível:

- **CSV/TXT** podem ser gerados com manipulação de string pura no servidor (fácil de
  explicar) e baixados pelo navegador.
- **Excel** "de verdade" exigiria biblioteca; uma alternativa simples é gerar um CSV que o
  Excel abre nativamente.

## Itens de implementação (checklist da Unidade 3)

Derivado de [`PROPOSTA.md` §8](../PROPOSTA.md):

- [ ] Painel do Administrador navegável *(já existe o esqueleto em `game.standby.html` e o
      menu em `index.html`)*.
- [ ] Geração e exibição do **QR Code** da sessão.
- [ ] Tela de **identificação do aluno**.
- [ ] **Tabela de presença** em tempo real.
- [ ] **Exportação** (Excel/CSV e TXT).
- [ ] Integração com o jogo já existente (entrar na partida a partir da sessão).

> Quando cada item for feito, **documente o fluxo real aqui** e atualize o checklist.
