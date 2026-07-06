// regras do jogo: tabuleiro 4x4, vence quem alinhar 3 peças.
// aqui só os objetos de estado (chamo ele de "jogo"). nada de rede ou tela.

const WIN = 3;
const HAND_LIMIT = 4;
const MANA_MAX = 6;

// as duas cartas do jogo
export const CARDS = {
  block: { name:'Bloquear', cost:1, glyph:'⊘', target:'empty' },
  erase: { name:'Apagar',   cost:2, glyph:'∅', target:'anyPiece' },
};
export const CARD_DS = {
  block:'Sela um espaço vazio: ninguém joga nele pelo resto da partida.',
  erase:'Remove qualquer peça do tabuleiro.',
};
const BARALHO_BASE = ['block','erase','block','erase','block','erase','block','erase'];

// embaralha uma cópia do vetor (não mexe no original)
function embaralhar(cartas){
  cartas = cartas.slice();
  for(let i=cartas.length-1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [cartas[i],cartas[j]] = [cartas[j],cartas[i]]; }
  return cartas;
}
// o tabuleiro é um vetor "reto", então converto linha/coluna na posição dentro dele
function indiceDaCelula(jogo, linha, coluna){ return linha*jogo.cols + coluna; }
// devolve o adversário
function adversarioDe(jogador){ return jogador==='x' ? 'o' : 'x'; }
// conta quantas peças daquele jogador estão no tabuleiro
export function contarPecas(jogo, jogador){ return jogo.cells.filter(c => c===jogador).length; }
// nome amigável do jogador
function nomeDoJogador(jogador){ return jogador === 'x' ? 'Jogador 1' : 'Jogador 2'; }
// armazena histórico da partida
function anotarHistorico(jogo, mensagem){ jogo.log.unshift(mensagem); if(jogo.log.length>40) jogo.log.pop(); }

export function novaPartida(){
  const jogo = {
    rows:4, cols:4, turn:'x', over:false, winner:null, winline:null, draw:false,
    mana:{x:1,o:1}, manaThisTurn:{x:1,o:1},
    deck:{ x:embaralhar(BARALHO_BASE), o:embaralhar(BARALHO_BASE) },
    hand:{ x:[], o:[] },
    placedThisTurn:false, turnCount:0, log:[],
  };
  jogo.cells = Array(jogo.rows*jogo.cols).fill('');   // '' = vazio, 'x'/'o' = peça, 'block' = bloqueado
  for(let i=0;i<HAND_LIMIT;i++){ comprarCarta(jogo,'x'); comprarCarta(jogo,'o'); }
  anotarHistorico(jogo,'Partida iniciada. Jogador 1 (x) começa.');
  return jogo;
}
function comprarCarta(jogo, jogador){
  if(jogo.hand[jogador].length >= HAND_LIMIT) return;
  if(jogo.deck[jogador].length === 0) jogo.deck[jogador] = embaralhar(BARALHO_BASE);   // acabou o baralho, embaralho de novo
  jogo.hand[jogador].push(jogo.deck[jogador].pop());
}
function iniciarTurno(jogo, jogador){
  jogo.turn = jogador;
  jogo.manaThisTurn[jogador] = jogo.mana[jogador];
  jogo.placedThisTurn = false;
  comprarCarta(jogo, jogador);
}
function encerrarTurno(jogo){
  if(jogo.over) return;
  const proximo = adversarioDe(jogo.turn);
  jogo.turnCount++;
  jogo.mana[proximo] = Math.min(MANA_MAX, 1 + Math.floor((jogo.turnCount+1)/2));   // a mana sobe devagar até 6
  iniciarTurno(jogo, proximo);
}
// mana que o jogador vai ter no começo do próximo turno dele
function manaDoProximoTurno(jogo, jogador){
  const passos = (jogo.turn === jogador) ? 2 : 1;
  return Math.min(MANA_MAX, 1 + Math.floor((jogo.turnCount + passos + 1) / 2));
}

const DIRECOES = [[0,1],[1,0],[1,1],[1,-1]];   // horizontal, vertical e as duas diagonais
// procura 3 peças do jogador em linha e devolve as posições (ou null)
function procurarLinhaVencedora(jogo, jogador){
  for(let linha=0; linha<jogo.rows; linha++) for(let coluna=0; coluna<jogo.cols; coluna++){
    if(jogo.cells[indiceDaCelula(jogo,linha,coluna)] !== jogador) continue;
    for(const [dLinha,dColuna] of DIRECOES){
      const posicoes = [indiceDaCelula(jogo,linha,coluna)];
      let l = linha+dLinha, c = coluna+dColuna, alinhou = true;
      for(let passo=1; passo<WIN; passo++){
        if(l<0 || c<0 || l>=jogo.rows || c>=jogo.cols || jogo.cells[indiceDaCelula(jogo,l,c)] !== jogador){ alinhou = false; break; }
        posicoes.push(indiceDaCelula(jogo,l,c)); l += dLinha; c += dColuna;
      }
      if(alinhou && posicoes.length===WIN) return posicoes;
    }
  }
  return null;
}
function verificarVitoria(jogo, jogador){
  const linha = procurarLinhaVencedora(jogo, jogador);
  if(linha){ jogo.over=true; jogo.winner=jogador; jogo.winline=linha; anotarHistorico(jogo,`${nomeDoJogador(jogador)} venceu a partida!`); return true; }
  return false;
}
function tabuleiroCheio(jogo){ return jogo.cells.every(c => c !== ''); }
// deu velha: tabuleiro cheio e ninguém fez 3 em linha. ganha quem tiver mais peças
function verificarVelha(jogo){
  if(jogo.over || !tabuleiroCheio(jogo)) return false;
  jogo.over = true; jogo.draw = true; jogo.winline = null;
  const pecasX = contarPecas(jogo,'x'), pecasO = contarPecas(jogo,'o');
  if(pecasX > pecasO)      jogo.winner = 'x';
  else if(pecasO > pecasX) jogo.winner = 'o';
  else                     jogo.winner = null;    // empatou até nas peças
  if(jogo.winner) anotarHistorico(jogo, `Velha! ${nomeDoJogador(jogo.winner)} vence por ter mais peças (${Math.max(pecasX,pecasO)} a ${Math.min(pecasX,pecasO)}).`);
  else            anotarHistorico(jogo, `Velha! Empate total (${pecasX} a ${pecasO}).`);
  return true;
}

// valida e aplica uma jogada. tipos: place, card, endTurn
export function aplicarJogada(jogo, jogador, jogada){
  if(jogo.over) return { ok:false, error:'A partida já terminou.' };
  if(jogador !== jogo.turn) return { ok:false, error:'Não é o seu turno.' };

  if(jogada.type==='place'){
    if(jogo.placedThisTurn) return { ok:false, error:'Você já colocou uma peça neste turno.' };
    if(jogo.cells[jogada.cell] !== '') return { ok:false, error:'Espaço ocupado ou bloqueado.' };
    jogo.cells[jogada.cell] = jogador;
    jogo.placedThisTurn = true;           // só pode uma peça por turno
    anotarHistorico(jogo, `${nomeDoJogador(jogador)} colocou peça.`);
    verificarVitoria(jogo, jogador);
    verificarVelha(jogo);
    return { ok:true };
  }

  if(jogada.type==='card'){
    const carta = CARDS[jogada.card];
    if(!carta) return { ok:false, error:'Carta inválida.' };
    if(jogo.hand[jogador].indexOf(jogada.card) < 0) return { ok:false, error:'Você não tem essa carta.' };
    if(carta.cost > jogo.manaThisTurn[jogador]) return { ok:false, error:'Mana insuficiente.' };
    const alvo = jogo.cells[jogada.cell];
    if(carta.target==='empty'    && alvo !== '')                return { ok:false, error:'Escolha um espaço vazio.' };
    if(carta.target==='anyPiece' && alvo !== 'x' && alvo !== 'o') return { ok:false, error:'Escolha uma peça.' };

    jogo.manaThisTurn[jogador] -= carta.cost;
    jogo.mana[jogador] = jogo.manaThisTurn[jogador];
    if(jogada.card==='block'){ jogo.cells[jogada.cell]='block'; anotarHistorico(jogo,`${nomeDoJogador(jogador)} bloqueou um espaço.`); }
    else                     { jogo.cells[jogada.cell]='';      anotarHistorico(jogo,`${nomeDoJogador(jogador)} apagou uma peça.`); }

    const posicao = jogo.hand[jogador].indexOf(jogada.card);
    if(posicao>=0) jogo.hand[jogador].splice(posicao,1);   // gastou a carta
    return { ok:true };
  }

  if(jogada.type==='endTurn'){
    if(verificarVelha(jogo)) return { ok:true };
    anotarHistorico(jogo, `Turno de ${nomeDoJogador(jogador)} encerrado.`);
    encerrarTurno(jogo);
    return { ok:true };
  }

  return { ok:false, error:'Jogada desconhecida.' };
}

// o que o cliente recebe pra desenhar. mando a mão só de quem pediu, nunca a do adversário
export function viewDaPartida(jogo, jogador){
  return {
    you: jogador,
    cols:jogo.cols, turn:jogo.turn,
    over:jogo.over, winner:jogo.winner, winline:jogo.winline, draw:jogo.draw,
    cells:jogo.cells,
    mana:jogo.mana, manaThisTurn:jogo.manaThisTurn, placedThisTurn:jogo.placedThisTurn,
    proxMana: manaDoProximoTurno(jogo, jogador),
    handCounts:{ x:jogo.hand.x.length, o:jogo.hand.o.length },
    yourHand: jogo.hand[jogador].map(id => ({ id, ...CARDS[id], ds:CARD_DS[id] })),
    log:jogo.log,
  };
}
