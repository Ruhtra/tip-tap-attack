// funçõezinhas pra desenhar no canvas (caixa, texto, botão...).
// também guardo aqui a lista de áreas clicáveis da tela atual.

// as cores do jogo (antes ficavam no css)
export const CORES = {
  fundo:'#0c0b10', painel:'#16141d', painel2:'#1d1b26',
  texto:'#ece9f5', apagado:'#8b85a3', linha:'#2a2738',
  x:'#2de2c4', o:'#ff5d8f', mana:'#6ea8ff', ouro:'#ffcf5c', bloco:'#6b6680',
};

let ctx = null, L = 0, A = 0;
export const clicaveis = [];       // { x, y, w, h, aoClicar }

// chamado uma vez no começo. desenho na resolução real da tela (devicePixelRatio)
// senão fica tudo borrado no celular, que tem 2 ou 3 pixels por pixel "normal".
export function iniciarDesenho(canvas, larguraLogica, alturaLogica){
  L = larguraLogica; A = alturaLogica;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = L * dpr;
  canvas.height = A * dpr;
  canvas.style.width = L + 'px';
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);             // aí eu continuo desenhando em 0..440 / 0..620
}
export function larg(){ return L; }
export function alt(){ return A; }

// começa uma tela do zero: limpa os clicáveis e pinta o fundo
export function novaTela(){
  clicaveis.length = 0;
  caixa(0, 0, L, A, CORES.fundo);
}

export function caixa(x, y, w, h, cor){ ctx.fillStyle = cor; ctx.fillRect(x, y, w, h); }
export function borda(x, y, w, h, cor, esp){ ctx.strokeStyle = cor; ctx.lineWidth = esp || 2; ctx.strokeRect(x, y, w, h); }
export function escrever(txt, x, y, cor, tam, alin){
  ctx.fillStyle = cor;
  ctx.font = 'bold ' + tam + 'px monospace';
  ctx.textAlign = alin || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y);
}
export function imagem(img, x, y, w, h){ if(img && img.complete && img.naturalWidth) ctx.drawImage(img, x, y, w, h); }

// marca uma área como clicável (sem desenhar nada)
export function clicavel(x, y, w, h, aoClicar){ clicaveis.push({ x, y, w, h, aoClicar }); }

// desenha um botão e já registra o clique dele
export function botao(rotulo, x, y, w, h, aoClicar, cor){
  cor = cor || CORES.ouro;
  caixa(x, y, w, h, CORES.painel);
  borda(x, y, w, h, cor);
  escrever(rotulo, x + w/2, y + h/2, cor, 15);
  clicavel(x, y, w, h, aoClicar);
}
