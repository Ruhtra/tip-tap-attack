// as sessões do torneio (a sala de espera do professor).
// cada jogador tem um id fixo (guardado no navegador), então se cair
// e voltar, ele reentra na mesma partida mesmo com um socket novo.
import { criarTorneio } from './torneio.js';

const sessoes = new Map();          // code -> sessao
const sidParaJogador = new Map();   // socket.id -> { code, jogadorId }

function limpaNome(n){ return String(n || '').trim().slice(0, 20) || 'Anônimo'; }

export function pegarSessao(code){
  if(!sessoes.has(code)){
    sessoes.set(code, {
      code, hostId:null, participantes:new Map(), fase:'lobby', torneio:null,
      partidas:new Map(),   // confrontoId -> { state, x, o }
      ondeEsta:new Map(),   // jogadorId -> { confrontoId, papel }
    });
  }
  return sessoes.get(code);
}
export function obterSessao(code){ return sessoes.get(code) || null; }

function juntar(s, jogadorId, nome, sid){
  s.participantes.set(jogadorId, { id:jogadorId, nome:limpaNome(nome), sid });
  sidParaJogador.set(sid, { code:s.code, jogadorId });
}

// professor abre a sessão. isso só marca quem é o host e liga o painel;
// ele NÃO entra na chave por aqui. se quiser jogar, abre o jogo em outra
// aba e entra como um aluno normal (assim o painel continua vivo).
export function abrirSessao(code, sid, jogadorId){
  const s = pegarSessao(code);
  s.hostId = jogadorId;
  sidParaJogador.set(sid, { code, jogadorId });
  return s;
}

// aluno entra — ou reconecta, se esse jogadorId já existe
export function entrarSessao(code, sid, nome, jogadorId){
  const s = pegarSessao(code);
  const existente = s.participantes.get(jogadorId);
  if(existente){                          // voltou: só troco o socket dele
    existente.sid = sid;
    existente.nome = limpaNome(nome);
    sidParaJogador.set(sid, { code, jogadorId });
    return { ok:true, sessao:s, reconectou:true };
  }
  if(s.fase !== 'lobby') return { ok:false, error:'O torneio já começou.' };
  juntar(s, jogadorId, nome, sid);
  return { ok:true, sessao:s, reconectou:false };
}

export function iniciarTorneio(code, jogadorId){
  const s = sessoes.get(code);
  if(!s) return { ok:false, error:'Sessão não encontrada.' };
  if(s.hostId !== jogadorId) return { ok:false, error:'Só o professor inicia o torneio.' };
  if(s.participantes.size < 2) return { ok:false, error:'Precisa de pelo menos 2 participantes.' };
  s.torneio = criarTorneio([...s.participantes.values()]);
  s.fase = 'rodando';
  return { ok:true, sessao:s };
}

// socket caiu. no lobby tiro o participante; com o torneio rolando só marco
// offline (pra ele poder voltar). devolve o code afetado
export function removerSocket(sid){
  const info = sidParaJogador.get(sid);
  sidParaJogador.delete(sid);
  if(!info) return null;
  const s = sessoes.get(info.code);
  if(!s) return null;
  const p = s.participantes.get(info.jogadorId);
  if(p && p.sid === sid){
    if(s.fase === 'lobby') s.participantes.delete(info.jogadorId);
    else p.sid = null;                    // offline, mas ainda na chave
  }
  if(s.hostId === info.jogadorId && s.fase === 'lobby') s.hostId = null;
  return info.code;
}

export function jogadorDoSocket(sid){ return sidParaJogador.get(sid) || null; }

// o que os clientes recebem
export function viewSessao(s){
  const lista = [...s.participantes.values()];
  return { code:s.code, fase:s.fase, participantes:lista.map(p => ({ nome:p.nome })), total:lista.length };
}
export function viewChave(s){
  return s.torneio ? { rodadas: s.torneio.rodadas, campeao: s.torneio.campeao } : null;
}
