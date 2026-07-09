// escuta os eventos dos jogadores e roda os confrontos do torneio
// é o único arquivo que fala com os clientes (io.emit), a lógica pura fica em nucleo/


import { novaPartida, aplicarJogada, viewDaPartida } from './nucleo/partida.js';
import {
  abrirSessao, entrarSessao, iniciarTorneio, removerSocket,
  jogadorDoSocket, obterSessao, viewSessao, viewChave,
} from './nucleo/sessao.js';
import { registrarVencedor, confrontosProntos } from './nucleo/torneio.js';

// deixa o código da sessão seguro: minúsculas, sem espaços, até 24 letras
function normCodigo(code){ return (code||'sessao').toLowerCase().trim().slice(0,24) || 'sessao'; }

// cada turno dura no máximo 30s. se o jogador não finalizar
const TEMPO_DO_TURNO = Number(process.env.TURNO_MS) || 30000;

export function ligarArbitro(io){
  // manda a sala de espera (participantes + chave) pra todo mundo da sessão
  function emitirSessao(code){
    const s = obterSessao(code);
    if(!s) return;
    io.to('sessao:'+code).emit('sessao', viewSessao(s));
    const chave = viewChave(s);
    if(chave) io.to('sessao:'+code).emit('chave', chave);
  }

  // manda o estado da partida pros dois jogadores do confronto (com os nomes)
  function emitirPartida(s, confrontoId){
    const p = s.partidas.get(confrontoId); if(!p) return;
    const nomes = { x:p.x.nome, o:p.o.nome };
    if(p.x.sid) io.to(p.x.sid).emit('state', { ...viewDaPartida(p.state, 'x'), nomes });
    if(p.o.sid) io.to(p.o.sid).emit('state', { ...viewDaPartida(p.state, 'o'), nomes });
  }

  // relógio do turno: quando começa a vez de alguém, ligo um timer de 30s
  function armarTimerDoTurno(s, confrontoId){
    const p = s.partidas.get(confrontoId);
    if(!p) return;
    clearTimeout(p.timer);
    p.timer = setTimeout(() => finalizarTurnoAutomatico(s, confrontoId), TEMPO_DO_TURNO);
  }
  // estourou o tempo: o servidor finaliza o turno de quem estava jogando
  function finalizarTurnoAutomatico(s, confrontoId){
    const p = s.partidas.get(confrontoId);
    if(!p || p.state.over) return;
    aplicarJogada(p.state, p.state.turn, { type:'endTurn' });   
    emitirPartida(s, confrontoId);
    if(p.state.over) resolverFimDePartida(s, confrontoId);
    else             armarTimerDoTurno(s, confrontoId);          
  }

  // começa toda partida cujos dois jogadores já estão definidos
  function iniciarPartidasProntas(s){
    if(!s.torneio) return;
    for(const c of confrontosProntos(s.torneio)){
      if(s.partidas.has(c.id)) continue;
      s.partidas.set(c.id, { state:novaPartida(), x:c.a, o:c.b });
      s.ondeEsta.set(c.a.id, { confrontoId:c.id, papel:'x' });
      s.ondeEsta.set(c.b.id, { confrontoId:c.id, papel:'o' });
      emitirPartida(s, c.id);
      armarTimerDoTurno(s, c.id);    
    }
  }

  // partida acabou: marca o vencedor e avança a chave (se empatou de vez, refaz)
  function resolverFimDePartida(s, confrontoId){
    const p = s.partidas.get(confrontoId); if(!p) return;
    clearTimeout(p.timer);            
    const jogo = p.state;
    if(jogo.winner === 'x' || jogo.winner === 'o'){
      const vencedor = jogo.winner === 'x' ? p.x : p.o;
      registrarVencedor(s.torneio, confrontoId, vencedor);
      s.partidas.delete(confrontoId);
      s.ondeEsta.delete(p.x.id);
      s.ondeEsta.delete(p.o.id);
      if(s.torneio.campeao) s.fase = 'fim';
      iniciarPartidasProntas(s);    
      emitirSessao(s.code);
    } else {
      p.state = novaPartida();      
      emitirPartida(s, confrontoId);
      armarTimerDoTurno(s, confrontoId);  
    }
  }

  // acha a partida do jogador e aplica a jogada dele
  function jogarNoConfronto(socket, move){
    const info = jogadorDoSocket(socket.id);
    const s = info && obterSessao(info.code);
    if(!s) return;
    const pos = s.ondeEsta.get(info.jogadorId);
    if(!pos) return;
    const p = s.partidas.get(pos.confrontoId);
    if(!p) return;
    const res = aplicarJogada(p.state, pos.papel, move);
    if(!res.ok) socket.emit('invalid', res.error);
    emitirPartida(s, pos.confrontoId);
    if(p.state.over) resolverFimDePartida(s, pos.confrontoId);
    else if(res.ok && move.type === 'endTurn') armarTimerDoTurno(s, pos.confrontoId);   // vez do outro: reinicia os 30s
  }

  io.on('connection', (socket)=>{

    socket.on('abrirSessao', ({ code, jogadorId })=>{
      code = normCodigo(code);
      abrirSessao(code, socket.id, jogadorId);
      socket.join('sessao:'+code);
      emitirSessao(code);
    });

    socket.on('entrar', ({ code, nome, jogadorId })=>{
      code = normCodigo(code);
      const res = entrarSessao(code, socket.id, nome, jogadorId);
      if(!res.ok){ socket.emit('invalid', res.error); return; }
      socket.join('sessao:'+code);
      socket.emit('entrou', { code, nome });
      emitirSessao(code);
      // se voltou no meio de um confronto, devolvo o tabuleiro pra ele
      const pos = res.sessao.ondeEsta.get(jogadorId);
      if(pos) emitirPartida(res.sessao, pos.confrontoId);
    });

    socket.on('iniciarTorneio', ()=>{
      const info = jogadorDoSocket(socket.id);
      if(!info) return;
      const res = iniciarTorneio(info.code, info.jogadorId);
      if(!res.ok){ socket.emit('invalid', res.error); return; }
      iniciarPartidasProntas(res.sessao);
      emitirSessao(info.code);
    });

    socket.on('move', (move)=> jogarNoConfronto(socket, move));

    socket.on('disconnect', ()=>{
      const code = removerSocket(socket.id);
      if(code) emitirSessao(code);
    });
  });
}
