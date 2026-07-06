// desenha cada tela do app. desenhaTela() olha estado.tela e chama a função certa.
// cada tela desenha e registra os cliques; as ações caem no rede.js.
import { estado } from './estado.js';
import { CORES, novaTela, caixa, borda, escrever, imagem, botao, clicavel } from './desenho.js';
import * as rede from './rede.js';

const L = 440, A = 620;                         // mesmo tamanho do canvas

export function desenhaTela(){
  novaTela();
  if(estado.tela === 'menu')       telaMenu();
  else if(estado.tela === 'comojogar') telaComoJogar();
  else if(estado.tela === 'creditos')  telaCreditos();
  else if(estado.tela === 'painel')    telaPainel();
  else if(estado.tela === 'alunos')    telaAlunos();
  // a tela 'entrar' é a caixa de html, não desenho aqui
  else if(estado.tela === 'chave')     telaChave();
  else if(estado.tela === 'jogo')      telaJogo();
  if(estado.aviso) escrever(estado.aviso, L/2, A - 22, CORES.o, 11);
}

function telaMenu(){
  escrever('TIP-TAP ATTACK', L/2, 130, CORES.texto, 26);
  escrever('torneio de jogo da velha tático', L/2, 160, CORES.apagado, 11);
  botao('▶ Iniciar torneio', L/2-110, 240, 220, 52, acaoIniciar);
  botao('Como jogar', L/2-110, 306, 220, 46, () => { estado.tela = 'comojogar'; });
  botao('Créditos',   L/2-110, 362, 220, 46, () => { estado.tela = 'creditos'; });
}
function acaoIniciar(){
  estado.souHost = true;
  estado.codigo  = 'sala-' + Math.random().toString(36).slice(2, 6);
  estado.tela    = 'painel';
  // gera o QR apontando pra tela de entrar do aluno (?sessao=CODIGO)
  const link = location.origin + location.pathname + '?sessao=' + encodeURIComponent(estado.codigo);
  estado.qr = new Image();
  estado.qr.onload = desenhaTela;    // redesenha quando a imagem carregar
  estado.qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=' + encodeURIComponent(link);
  rede.abrirSessao();
}

function telaComoJogar(){
  escrever('Como jogar', L/2, 80, CORES.texto, 20);
  const linhas = [
    ['Tabuleiro 4×4. Vence quem alinhar', 0],
    ['3 peças em linha (horizontal,', 0],
    ['vertical ou diagonal).', 0],
    ['', 0],
    ['A cada turno você ganha mana e', 0],
    ['compra cartas. Pode usar cartas', 0],
    ['e colocar UMA peça (encerra o turno).', 0],
    ['', 0],
    ['⊘ Bloquear — sela um espaço vazio', 1],
    ['∅ Apagar — remove uma peça', 1],
  ];
  let y = 120;
  linhas.forEach(([t, destaque]) => { escrever(t, L/2, y, destaque ? CORES.texto : CORES.apagado, 12); y += 26; });
  botao('← Voltar', L/2-70, y + 10, 140, 44, () => { estado.tela = 'menu'; });
}

function telaCreditos(){
  escrever('Créditos', L/2, 130, CORES.texto, 22);
  escrever('Tip-Tap Attack', L/2, 180, CORES.texto, 15);
  escrever('Disciplina de Lógica de Programação', L/2, 210, CORES.apagado, 12);
  escrever('Node.js · Socket.io · Canvas', L/2, 234, CORES.apagado, 12);
  botao('← Voltar', L/2-70, 300, 140, 44, () => { estado.tela = 'menu'; });
}

function telaPainel(){
  escrever('Painel do professor', L/2, 60, CORES.texto, 18);
  escrever('sessão: ' + estado.codigo, L/2, 84, CORES.ouro, 13);
  if(estado.qr) imagem(estado.qr, L/2-90, 100, 180, 180);
  escrever('a turma escaneia o QR para entrar', L/2, 296, CORES.apagado, 11);
  escrever(estado.participantes.length + ' aluno(s) na sala', L/2, 326, CORES.texto, 13);

  botao('Ver alunos', L/2-110, 352, 220, 40, () => { estado.tela = 'alunos'; });
  botao('Também vou jogar', L/2-110, 400, 220, 40, abrirAbaDeJogo);
  botao('▶ Iniciar torneio', L/2-110, 448, 220, 46, () => rede.iniciarTorneio());
}
// abre o jogo numa aba nova; esta aba continua sendo o painel (chave + lista).
// assim o professor joga numa aba e acompanha o torneio na outra.
function abrirAbaDeJogo(){
  window.open(location.pathname + '?sessao=' + encodeURIComponent(estado.codigo), '_blank');
}

// a lista de todos os alunos da sala, com botão pra baixar em CSV
function telaAlunos(){
  escrever('Alunos na sala', L/2, 60, CORES.texto, 18);
  escrever(estado.participantes.length + ' no total', L/2, 84, CORES.ouro, 12);
  let y = 122;
  estado.participantes.slice(0, 14).forEach((p, i) => { escrever((i+1) + '. ' + p.nome, L/2, y, CORES.apagado, 13); y += 24; });
  if(estado.participantes.length > 14) escrever('… e mais ' + (estado.participantes.length - 14), L/2, y, CORES.apagado, 11);

  botao('⬇ Baixar CSV', L/2-110, 500, 220, 44, baixarCSV);
  // volta pro painel (lobby) ou pra chave (se o torneio já começou)
  botao('← Voltar', L/2-70, 554, 140, 40, () => { estado.tela = (estado.chave && estado.chave.rodadas.length) ? 'chave' : 'painel'; });
}
// monta um CSV simples (uma coluna, um nome por linha) e pede pro navegador baixar.
// o '﻿' é um marcador de UTF-8 pro Excel não estragar os acentos.
function baixarCSV(){
  const linhas = ['nome'];
  estado.participantes.forEach(p => linhas.push(p.nome));
  const texto = '﻿' + linhas.join('\r\n');
  const arquivo = new Blob([texto], { type:'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = 'alunos-' + estado.codigo + '.csv';
  link.click();
}

function telaChave(){
  escrever('Chaveamento', L/2, 60, CORES.texto, 18);
  if(estado.chave && estado.chave.campeao) escrever('🏆 Campeão: ' + estado.chave.campeao.nome, L/2, 88, CORES.ouro, 14);
  if(estado.souHost) botao('Ver alunos', L/2-70, 562, 140, 36, () => { estado.tela = 'alunos'; });   // só o professor
  if(!estado.chave || !estado.chave.rodadas.length){
    escrever('Aguardando o professor iniciar…', L/2, 300, CORES.apagado, 12);
    return;
  }
  // cada rodada é uma coluna
  const colW = 122, gap = 8, y0 = 120;
  estado.chave.rodadas.forEach((rodada, ri) => {
    const x = 16 + ri * (colW + gap);
    escrever('Rodada ' + (ri + 1), x + colW/2, y0 - 14, CORES.apagado, 10);
    rodada.forEach((m, mi) => confronto(x, y0 + mi * 66, colW, m, ri));
  });
}
function confronto(x, y, w, m, ri){
  const venc = m.vencedor ? m.vencedor.nome : null;
  const nomeA = m.a ? m.a.nome : (ri === 0 ? '(bye)' : '—');
  const nomeB = m.b ? m.b.nome : (ri === 0 ? '(bye)' : '—');
  caixa(x, y, w, 50, CORES.painel2);
  borda(x, y, w, 50, CORES.linha, 1);
  escrever(nomeA, x + w/2, y + 15, venc === nomeA ? CORES.x : CORES.apagado, 11);
  escrever(nomeB, x + w/2, y + 35, venc === nomeB ? CORES.x : CORES.apagado, 11);
}

function telaJogo(){
  const partida = estado.ST; if(!partida) return;
  const suaVez     = !partida.over && partida.turn === estado.eu;
  const adversario = estado.eu === 'x' ? 'o' : 'x';
  const nomes      = partida.nomes || { x:'Jogador 1', o:'Jogador 2' };

  // de quem é a vez (quando não é a minha, mostro "aguardando fulano..." animado)
  if(partida.over) escrever('Fim de jogo', L/2, 40, CORES.ouro, 15);
  else if(suaVez)  escrever('SUA VEZ', L/2, 40, estado.eu === 'x' ? CORES.x : CORES.o, 16);
  else             escrever('aguardando ' + nomes[adversario] + pontinhos(), L/2, 40, CORES.apagado, 13);

  escrever(nomes[estado.eu] + ' (você, ' + estado.eu + ')   vs   ' + nomes[adversario] + ' (' + adversario + ')', L/2, 62, CORES.apagado, 10);
  const manaAgora = (partida.turn === estado.eu ? partida.manaThisTurn[estado.eu] : partida.mana[estado.eu]);
  escrever('mana agora: ' + manaAgora + '   ·   próximo turno: ' + partida.proxMana, L/2, 80, CORES.mana, 11);

  desenharTabuleiro(partida, suaVez);
  if(suaVez) escrever(dicaDoTurno(partida), L/2, 360, CORES.ouro, 11);
  desenharMao(partida, suaVez);

  // o botão Finalizar só aparece na minha vez (fora dela nada responde)
  if(suaVez) botao('Finalizar turno', L/2-110, 520, 220, 44, () => { estado.carta = null; rede.jogar({ type:'endTurn' }); });

  if(partida.over) fimDeJogo(partida, nomes);
}
// dica do que fazer, dependendo da situação
function dicaDoTurno(partida){
  if(estado.carta) return (estado.carta.target === 'empty' ? 'Escolha um espaço vazio' : 'Escolha uma peça') + ' · toque na carta p/ cancelar';
  if(partida.placedThisTurn) return 'Peça colocada — use cartas ou finalize';
  return 'Toque num espaço para colocar sua peça';
}
function pontinhos(){ return '.'.repeat((estado.tick % 3) + 1); }   // . .. ...

function desenharTabuleiro(partida, suaVez){
  const colunas = partida.cols, tam = 60, gap = 6;
  const x0 = (L - (colunas*tam + (colunas-1)*gap)) / 2, y0 = 96;
  for(let indice=0; indice<partida.cells.length; indice++){
    const linha = Math.floor(indice/colunas), coluna = indice % colunas;
    const x = x0 + coluna*(tam+gap), y = y0 + linha*(tam+gap);
    const conteudo = partida.cells[indice];   // '', 'x', 'o' ou 'block'
    const ehAlvo = suaVez && celulaPodeSerTocada(conteudo);
    caixa(x, y, tam, tam, conteudo === 'block' ? '#221f2c' : CORES.painel2);
    borda(x, y, tam, tam, ehAlvo ? CORES.ouro : CORES.linha, ehAlvo ? 2 : 1);
    if(conteudo === 'x') escrever('x', x+tam/2, y+tam/2, CORES.x, 32);
    else if(conteudo === 'o') escrever('o', x+tam/2, y+tam/2, CORES.o, 32);
    else if(conteudo === 'block') escrever('⊘', x+tam/2, y+tam/2, CORES.bloco, 20);
    if(partida.winline && partida.winline.includes(indice)) borda(x, y, tam, tam, CORES.ouro, 3);
    clicavel(x, y, tam, tam, () => clicarCelula(indice));
  }
}
// essa célula pode ser tocada agora? (ganha o contorno dourado)
function celulaPodeSerTocada(conteudo){
  const partida = estado.ST;
  if(estado.carta){
    if(estado.carta.target === 'empty')    return conteudo === '';
    if(estado.carta.target === 'anyPiece') return conteudo === 'x' || conteudo === 'o';
    return false;
  }
  return !partida.placedThisTurn && conteudo === '';   // sem carta, é pra colocar peça
}
function clicarCelula(indice){
  const partida = estado.ST;
  const suaVez = !partida.over && partida.turn === estado.eu;
  if(!suaVez) return;                        // fora da sua vez o clique não faz nada
  if(estado.carta){                          // com carta selecionada, uso a carta na célula
    rede.jogar({ type:'card', card:estado.carta.id, cell:indice });
    estado.carta = null;
    return;
  }
  if(!partida.placedThisTurn && partida.cells[indice] === '')   // sem carta, coloco a peça direto
    rede.jogar({ type:'place', cell:indice });
}

function desenharMao(partida, suaVez){
  escrever('suas cartas (toque para usar)', L/2, 384, CORES.apagado, 10);
  const cartas = partida.yourHand || [];
  if(cartas.length === 0){ escrever('mão vazia', L/2, 410, CORES.apagado, 11); return; }
  // grade fixa de 2 colunas: cabe até 4 cartas sem cortar nem "pular" quando muda a quantidade
  const colunas = 2, gap = 8, x0 = 20, y0 = 396, altCarta = 52;
  const largCarta = (L - 2*x0 - gap) / colunas;
  cartas.forEach((carta, posicao) => {
    const x = x0 + (posicao % colunas)*(largCarta+gap), y = y0 + Math.floor(posicao/colunas)*(altCarta+8);
    const podePagar   = suaVez && carta.cost <= partida.manaThisTurn[estado.eu];
    const selecionada = estado.carta && estado.carta.slot === posicao;   // seleção pela posição, não pelo tipo
    caixa(x, y, largCarta, altCarta, CORES.painel2);
    borda(x, y, largCarta, altCarta, selecionada ? CORES.ouro : CORES.linha, selecionada ? 2 : 1);
    escrever(carta.name, x+largCarta/2, y+19, podePagar ? CORES.texto : CORES.apagado, 14);
    escrever('mana ' + carta.cost, x+largCarta/2, y+37, CORES.mana, 10);
    if(podePagar) clicavel(x, y, largCarta, altCarta, () => selecionarCarta(carta, posicao));
  });
}
// toca pra selecionar; toca de novo na mesma pra cancelar
function selecionarCarta(carta, posicao){
  estado.carta = (estado.carta && estado.carta.slot === posicao) ? null : { id:carta.id, target:carta.target, slot:posicao };
}
function fimDeJogo(partida, nomes){
  caixa(L/2-160, 250, 320, 110, CORES.painel);
  borda(L/2-160, 250, 320, 110, CORES.ouro);
  const nomeVencedor = partida.winner ? nomes[partida.winner] : '';
  let titulo, sub;
  if(partida.draw && partida.winner){ titulo = 'Velha!'; sub = (partida.winner === estado.eu ? 'Você venceu' : nomeVencedor + ' venceu') + ' (mais peças)'; }
  else if(partida.draw){ titulo = 'Empate!'; sub = 'mesmo número de peças'; }
  else { titulo = (partida.winner === estado.eu ? 'Você venceu!' : nomeVencedor + ' venceu'); sub = 'alinhou 3 — aguarde a chave'; }
  escrever(titulo, L/2, 288, CORES.ouro, 24);
  escrever(sub, L/2, 325, CORES.apagado, 12);
}
