// junta tudo: pega o canvas, trata o clique, mostra a caixa de nome quando
// precisa e redesenha quando o servidor manda novidade.
import { estado } from './estado.js';
import { iniciarDesenho, clicaveis, larg, alt } from './desenho.js';
import { desenhaTela } from './telas.js';
import * as rede from './rede.js';

const quadro = document.getElementById('quadro');
iniciarDesenho(quadro, 440, 620);

// desenhar = pintar o canvas + mostrar/esconder a caixa de nome
function render(){ desenhaTela(); sincronizarCaixaNome(); }
rede.aoAtualizar(render);

// clique: converte a posição do toque pra coordenada do quadro e vê o que foi tocado
quadro.onclick = (e) => {
  const r = quadro.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (larg() / r.width);
  const my = (e.clientY - r.top)  * (alt()  / r.height);
  for(const c of clicaveis){
    if(mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h){ c.aoClicar(); break; }
  }
  render();
};

// a caixa de nome é a única parte HTML (canvas não abre teclado no celular).
// mostro só na tela 'entrar'.
const caixaNome = document.getElementById('telaEntrar');
const campoNome = document.getElementById('entrarNome');
function sincronizarCaixaNome(){
  const mostrar = (estado.tela === 'entrar');
  caixaNome.classList.toggle('mostrar', mostrar);
  document.getElementById('entrarCodigo').textContent = estado.codigo;
  if(mostrar) campoNome.focus();
}
function enviarNome(){ rede.entrar(campoNome.value.trim() || 'Anônimo'); }
document.getElementById('entrarBtn').onclick = enviarNome;
campoNome.addEventListener('keydown', (e) => { if(e.key === 'Enter') enviarNome(); });

// anima o "aguardando..." quando não é a minha vez (só aí precisa redesenhar sozinho)
setInterval(() => {
  const s = estado.ST;
  if(estado.tela === 'jogo' && s && !s.over && s.turn !== estado.eu){
    estado.tick = (estado.tick + 1) % 3;
    render();
  }
}, 450);

// se abriu pelo QR (?sessao=CODIGO), começa na caixa de nome
const sessao = new URLSearchParams(location.search).get('sessao');
if(sessao){
  estado.codigo = sessao;
  estado.tela = 'entrar';
  // se já entrou antes, deixo o nome escrito na caixa pra ele confirmar ou trocar
  campoNome.value = localStorage.getItem('ttaNome') || '';
}

render();
