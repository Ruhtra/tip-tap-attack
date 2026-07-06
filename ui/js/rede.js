// conversa com o servidor pelo socket.io: recebe os eventos (e atualiza o estado)
// e manda as ações do jogador. quando muda algo, pede pra redesenhar.
import { estado } from './estado.js';

const socket = io();                 // o io vem do socket.io carregado no index.html
let redesenhar = () => {};
export function aoAtualizar(cb){ redesenhar = cb; }

// id fixo do jogador, guardado no navegador. serve pra, se cair e voltar,
// o servidor saber que é a mesma pessoa e devolver a partida.
let jogadorId = localStorage.getItem('ttaId');
if(!jogadorId){
  jogadorId = 'j' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('ttaId', jogadorId);
}

// o que chega do servidor
socket.on('connect', () => {
  // se reconectou: o professor reabre a sessão; o aluno reentra (se já deu o nome)
  if(estado.souHost) socket.emit('abrirSessao', { code:estado.codigo, jogadorId });
  else if(estado.nomeEnviado) socket.emit('entrar', { code:estado.codigo, nome:estado.nomeEnviado, jogadorId });
});
socket.on('sessao', (s) => { estado.participantes = s.participantes; redesenhar(); });
socket.on('chave',  (c) => { estado.chave = c; if(!estado.emPartida) estado.tela = 'chave'; redesenhar(); });
socket.on('entrou', () => { estado.tela = 'chave'; redesenhar(); });
socket.on('state',  (s) => {
  estado.ST = s; estado.eu = s.you; estado.emPartida = !s.over;
  estado.tela = 'jogo'; estado.aviso = '';
  redesenhar();
});
socket.on('invalid', (msg) => { estado.aviso = msg; redesenhar(); });

// o que a gente manda pro servidor
export function abrirSessao(){ socket.emit('abrirSessao', { code:estado.codigo, jogadorId }); }
export function iniciarTorneio(){ socket.emit('iniciarTorneio'); }
export function entrar(nome){
  estado.nomeEnviado = nome;
  localStorage.setItem('ttaNome', nome);   // lembra o nome pra reentrar sozinho depois
  socket.emit('entrar', { code:estado.codigo, nome, jogadorId });
}
export function jogar(move){ socket.emit('move', move); }
