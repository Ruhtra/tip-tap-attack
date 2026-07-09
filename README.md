# Tip-Tap Attack: Torneio de Jogo da Velha Tático

Esse é um projeto de Lógica de Programação. Ele junta duas coisas que funcionam acopladas: um jogo
da velha 4×4 com cartas e um sistema de presença para a sala de aula.

A presença funciona assim: o professor abre o app, que mostra um QR Code. O aluno escaneia, digita
o nome e entra. Só de entrar, ele já fica na lista de presentes, que o professor pode baixar em CSV
no fim. Como o aluno entra para jogar, a presença acaba sendo registrada enquanto ele joga, sem
precisar de um momento separado só para isso.

O jogo em si é um jogo da velha 4×4 (vence quem alinha 3 peças) com cartas que gastam mana, jogado
num torneio mata-a-mata entre a turma.

## Acessar

O app está hospedado na Vercel: https://tip-tap-attack.ruhtra.work. Dá para usar direto por aí ou
baixar e rodar localmente (seção "Como rodar", no fim).

## Estrutura das pastas

A ideia da organização é separar a lógica do resto (servidor, tela, internet):

```
tip-tap-attack/
├── server.js       ← sobe o servidor (Express serve a tela + Socket.io pro tempo real)
├── arbitro.js      ← ouve os jogadores, chama a lógica e devolve o resultado
├── nucleo/         ← a lógica de programação
│   ├── partida.js  ← regras do jogo: tabuleiro, vitória, mana, cartas, velha
│   ├── torneio.js  ← chaveamento mata-a-mata: sorteio, byes, avançar o vencedor
│   └── sessao.js   ← sessões da sala: lista de alunos e reconexão
├── ui/             ← a tela que o aluno vê (canvas puro, sem framework)
└── docs/           ← explicação escrita de cada fluxo (base do vídeo)
```

## A lógica de programação está no `nucleo/`

É a parte que interessa para a disciplina. Os arquivos do `nucleo/` têm só funções puras: recebem
um estado, aplicam uma regra e devolvem o resultado, sem mexer com internet nem com tela. São
vetores, laços, condicionais e funções, então essa parte dá para ler e testar isolada do resto do
app.

- `partida.js`: as regras do jogo. O tabuleiro 4×4 é um vetor de 16 posições, e a checagem de
  vitória percorre o tabuleiro procurando 3 peças em linha nas quatro direções.
- `torneio.js`: monta a árvore do mata-a-mata. Embaralha os jogadores, trata número ímpar com
  "byes" e vai passando o vencedor de cada partida para a rodada seguinte, até sobrar o campeão.
- `sessao.js`: guarda quem está na sala e cuida da reconexão. Cada navegador tem um id fixo, então
  quem cai e volta reentra na mesma partida.

## O `server.js` e o `arbitro.js`

Esses dois pegam a lógica do `nucleo/` e a transformam num app que roda em rede. O `server.js` usa
o Express para servir a pasta `ui/` e o Socket.io para a comunicação em tempo real. O `arbitro.js`
fica no meio: recebe as jogadas dos alunos, chama o `nucleo/` para validar e manda o estado
atualizado de volta para os jogadores. É nele também que fica o limite de 30s por turno, para uma
partida não travar se alguém sair no meio.

Uma decisão do projeto é que o servidor é quem decide tudo. O cliente só manda a jogada e desenha a
resposta que volta. Toda a validação acontece no servidor, o que evita trapaça e mantém os dois
lados sempre com o mesmo estado.

## Como rodar

Precisa de Node.js 18+. Dentro da pasta:

```bash
npm install
npm start
```

Abra `http://localhost:3000`. Para testar sozinho, abra o painel numa aba e
`http://localhost:3000/?sessao=CODIGO` em outras duas. Para usar em sala pelo celular, é preciso
expor o servidor à internet (por exemplo, `npx localtunnel --port 3000`). O passo a passo completo
está na pasta `docs/`.
