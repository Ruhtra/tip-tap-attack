// ============================================================
//  TIP-TAP ATTACK — servidor autoritativo (Node + Socket.io)
//  Mantem o estado da partida, valida jogadas e sincroniza os 2 jogadores.
// ============================================================
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// serve o cliente (index.html) da mesma pasta
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// ---------------- Regras do jogo ----------------
const WIN = 3, HAND_LIMIT = 4, MANA_MAX = 6;

const CARDS = {
  block:  { name:'Bloquear',    cost:1, glyph:'⊘', target:'empty' },
  erase:  { name:'Apagar',      cost:2, glyph:'∅', target:'anyPiece' },
  defend: { name:'Defender',    cost:1, glyph:'⛨', target:'ownPiece' },
  steal:  { name:'Roubar',      cost:3, glyph:'⇄', target:'enemyPiece' },
  expand: { name:'Expandir',    cost:2, glyph:'⊞', target:'none' },
  draw2:  { name:'Saque',       cost:1, glyph:'≣', target:'none' },
  surge:  { name:'Sobrecarga',  cost:0, glyph:'⚡', target:'none' },
};
const DECK_TEMPLATE = ['block','block','erase','defend','defend','steal','expand','draw2','surge','block','erase','surge'];
const CARD_DS = {
  block:'Sela um espaço vazio. Ninguém pode jogar nele pelo resto da partida.',
  erase:'Remove qualquer peça do tabuleiro (não funciona em peça defendida).',
  defend:'Protege uma peça sua: não pode ser apagada nem roubada até seu próximo turno.',
  steal:'Converte uma peça inimiga para a sua cor (não funciona em peça defendida).',
  expand:'Adiciona uma coluna nova ao tabuleiro — mais espaço, novas linhas.',
  draw2:'Compre 2 cartas imediatamente (respeita o limite da mão).',
  surge:'+2 de mana neste turno. Use para encadear cartas caras.',
};

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function newGameState(){
  const g = {
    rows:4, cols:4, turn:'x', over:false, winner:null, winline:null,
    mana:{x:1,o:1}, manaThisTurn:{x:1,o:1},
    deck:{x:shuffle(DECK_TEMPLATE), o:shuffle(DECK_TEMPLATE)},
    hand:{x:[], o:[]},
    placedThisTurn:false, turnCount:0,
    log:[],
  };
  const n = g.rows*g.cols;
  g.cells = Array(n).fill('');
  g.defended = Array(n).fill('');
  for(let i=0;i<HAND_LIMIT;i++){ drawCard(g,'x'); drawCard(g,'o'); }
  pushLog(g,'Partida iniciada. Jogador 1 (x) começa.');
  return g;
}
function drawCard(g,p){
  if(g.hand[p].length>=HAND_LIMIT) return false;
  if(g.deck[p].length===0) g.deck[p]=shuffle(DECK_TEMPLATE);
  g.hand[p].push(g.deck[p].pop());
  return true;
}
function idx(g,r,c){ return r*g.cols+c; }
function other(p){ return p==='x'?'o':'x'; }
function pieceCount(g,p){ return g.cells.filter(c=>c===p).length; }
function pname(p){ return p==='x'?'Jogador 1':'Jogador 2'; }
function pushLog(g,msg){ g.log.unshift(msg); if(g.log.length>40) g.log.pop(); }

function startTurn(g,p){
  g.turn=p; g.manaThisTurn[p]=g.mana[p]; g.placedThisTurn=false;
  for(let i=0;i<g.defended.length;i++) if(g.defended[i]===p) g.defended[i]='';
  drawCard(g,p);
}
function endTurn(g){
  if(g.over) return;
  const np=other(g.turn);
  g.turnCount++;
  g.mana[np]=Math.min(MANA_MAX, 1+Math.floor((g.turnCount+1)/2));
  startTurn(g,np);
}
function growBoard(g){
  const nc=g.cols+1, nr=g.rows;
  const cells=Array(nr*nc).fill(''), def=Array(nr*nc).fill('');
  for(let r=0;r<nr;r++)for(let c=0;c<g.cols;c++){ cells[r*nc+c]=g.cells[r*g.cols+c]; def[r*nc+c]=g.defended[r*g.cols+c]; }
  g.cols=nc; g.cells=cells; g.defended=def;
}
const DIRS=[[0,1],[1,0],[1,1],[1,-1]];
function findWinLine(g,p){
  for(let r=0;r<g.rows;r++)for(let c=0;c<g.cols;c++){
    if(g.cells[idx(g,r,c)]!==p) continue;
    for(const [dr,dc] of DIRS){
      const line=[idx(g,r,c)]; let rr=r+dr,cc=c+dc,ok=true;
      for(let k=1;k<WIN;k++){
        if(rr<0||cc<0||rr>=g.rows||cc>=g.cols||g.cells[idx(g,rr,cc)]!==p){ ok=false; break; }
        line.push(idx(g,rr,cc)); rr+=dr; cc+=dc;
      }
      if(ok&&line.length===WIN) return line;
    }
  }
  return null;
}
function checkWin(g,p){
  const line=findWinLine(g,p);
  if(line){ g.over=true; g.winner=p; g.winline=line; pushLog(g,`${pname(p)} venceu a partida!`); return true; }
  return false;
}

// aplica uma jogada validada; retorna {ok, error}
function applyMove(g, player, move){
  if(g.over) return { ok:false, error:'A partida já terminou.' };
  if(player!==g.turn) return { ok:false, error:'Não é o seu turno.' };

  if(move.type==='place'){
    if(g.placedThisTurn) return { ok:false, error:'Você já colocou uma peça neste turno.' };
    const i=move.cell;
    if(g.cells[i]!=='') return { ok:false, error:'Espaço ocupado ou bloqueado.' };
    g.cells[i]=player;
    pushLog(g, `${pname(player)} colocou peça.`);
    if(checkWin(g,player)) return { ok:true };
    pushLog(g, `Turno de ${pname(player)} encerrado.`);
    endTurn(g);
    return { ok:true };
  }

  if(move.type==='card'){
    const id=move.card;
    if(!CARDS[id]) return { ok:false, error:'Carta inválida.' };
    const pos=g.hand[player].indexOf(id);
    if(pos<0) return { ok:false, error:'Você não tem essa carta.' };
    const card=CARDS[id];
    if(card.cost>g.manaThisTurn[player]) return { ok:false, error:'Mana insuficiente.' };

    if(card.target!=='none'){
      const i=move.cell, v=g.cells[i];
      if(card.target==='empty' && v!=='') return { ok:false, error:'Escolha um espaço vazio.' };
      if(card.target==='anyPiece' && (v!=='x'&&v!=='o')) return { ok:false, error:'Escolha uma peça.' };
      if(card.target==='ownPiece' && v!==player) return { ok:false, error:'Escolha uma peça SUA.' };
      if(card.target==='enemyPiece' && v!==other(player)) return { ok:false, error:'Escolha uma peça INIMIGA.' };
      if((card.target==='anyPiece'||card.target==='enemyPiece') && g.defended[i]) return { ok:false, error:'Essa peça está defendida!' };
    }

    g.manaThisTurn[player]-=card.cost;
    g.mana[player]=g.manaThisTurn[player];

    const i=move.cell;
    switch(id){
      case 'block':  g.cells[i]='block'; pushLog(g,`${pname(player)} bloqueou um espaço.`); break;
      case 'erase':  g.cells[i]='';      pushLog(g,`${pname(player)} apagou uma peça.`); break;
      case 'defend': g.defended[i]=player; pushLog(g,`${pname(player)} defendeu uma peça.`); break;
      case 'steal':  g.cells[i]=player;  pushLog(g,`${pname(player)} roubou uma peça!`); break;
      case 'expand': growBoard(g);       pushLog(g,`${pname(player)} expandiu o tabuleiro.`); break;
      case 'draw2':  drawCard(g,player); drawCard(g,player); pushLog(g,`${pname(player)} comprou 2 cartas.`); break;
      case 'surge':  g.manaThisTurn[player]+=2; g.mana[player]=g.manaThisTurn[player]; pushLog(g,`${pname(player)} sobrecarregou (+2 mana).`); break;
    }
    // remove a carta da mão
    const pos2=g.hand[player].indexOf(id);
    if(pos2>=0) g.hand[player].splice(pos2,1);

    if(checkWin(g,player)) return { ok:true };
    return { ok:true };
  }

  if(move.type==='endTurn'){
    pushLog(g, `Turno de ${pname(player)} encerrado.`);
    endTurn(g);
    return { ok:true };
  }

  return { ok:false, error:'Jogada desconhecida.' };
}

// monta a "view" que cada cliente recebe (esconde o deck e a mão do oponente)
function viewFor(room, player){
  const g=room.state;
  return {
    you: player,
    rows:g.rows, cols:g.cols, turn:g.turn, over:g.over, winner:g.winner, winline:g.winline,
    cells:g.cells, defended:g.defended,
    mana:g.mana, manaThisTurn:g.manaThisTurn,
    placedThisTurn:g.placedThisTurn,
    handCounts:{ x:g.hand.x.length, o:g.hand.o.length },
    pieces:{ x:pieceCount(g,'x'), o:pieceCount(g,'o') },
    yourHand: player==='spectator' ? [] : g.hand[player].map(id=>({ id, ...CARDS[id], ds:CARD_DS[id] })),
    log:g.log,
    players:{ x: !!room.players.x, o: !!room.players.o },
    ready: !!room.ready,
    spectators: room.spectators.size,
  };
}

function broadcast(room){
  for(const [sid, role] of room.sockets){
    io.to(sid).emit('state', viewFor(room, role));
  }
}

// ---------------- Salas ----------------
// room = {
//   state, players:{x:sid|null, o:sid|null}, sockets:Map<sid,role>,
//   spectators:Set, ready:boolean, graceTimers:{x,o}
// }
const rooms = new Map();
const RECONNECT_GRACE_MS = 8000; // tempo para reentrar e recuperar o assento após cair/atualizar

function getRoom(code){
  if(!rooms.has(code)){
    rooms.set(code, {
      state:newGameState(),
      players:{x:null,o:null},
      sockets:new Map(),
      spectators:new Set(),
      ready:false,
      graceTimers:{x:null,o:null},
    });
  }
  return rooms.get(code);
}

// recalcula se a partida pode rolar (os dois assentos ocupados)
function updateReady(room){
  const wasReady = room.ready;
  room.ready = !!room.players.x && !!room.players.o;
  if(room.ready && !wasReady){
    pushLog(room.state, 'Os dois jogadores estão conectados. Que comece o jogo!');
  }
  return room.ready;
}

io.on('connection', (socket)=>{
  let joinedCode=null, role=null;

  socket.on('join', ({ code })=>{
    code=(code||'sala').toLowerCase().trim().slice(0,24) || 'sala';
    const room=getRoom(code);

    // IDEMPOTENTE: se este mesmo socket já está na sala, não reassinar (evita pegar 2 assentos)
    if(joinedCode===code && room.sockets.has(socket.id)){
      socket.emit('joined', { role, code });
      socket.emit('state', viewFor(room, role));
      return;
    }
    // se o socket estava em outra sala, sai dela primeiro
    if(joinedCode && joinedCode!==code){ leaveRoom(socket, joinedCode); }

    joinedCode=code;

    // designa papel: tenta preencher x, depois o; senão, espectador.
    // (assentos liberados por desconexão ficam null e podem ser reocupados — inclusive
    //  pelo próprio jogador que atualizou a página)
    if(room.players.x===null){ role='x'; room.players.x=socket.id; clearGrace(room,'x'); }
    else if(room.players.o===null){ role='o'; room.players.o=socket.id; clearGrace(room,'o'); }
    else { role='spectator'; room.spectators.add(socket.id); }

    room.sockets.set(socket.id, role);
    socket.join(code);
    socket.emit('joined', { role, code });
    updateReady(room);
    broadcast(room);
  });

  socket.on('move', (move)=>{
    if(!joinedCode) return;
    const room=rooms.get(joinedCode); if(!room) return;
    if(role!=='x' && role!=='o'){ socket.emit('invalid','Espectadores não jogam.'); return; }

    // GARANTIA 1: nada acontece até os dois estarem conectados
    if(!room.ready){ socket.emit('invalid','Aguardando o outro jogador conectar…'); return; }

    // GARANTIA 2: só joga quem é o dono do turno (o applyMove revalida, mas barramos cedo)
    if(room.state.turn!==role){ socket.emit('invalid','Não é o seu turno.'); return; }

    const res=applyMove(room.state, role, move);
    if(!res.ok){ socket.emit('invalid', res.error); }
    broadcast(room); // sempre rebroadcast: os dois lados re-renderizam (sem tela travada)
  });

  socket.on('rematch', ()=>{
    if(!joinedCode) return;
    const room=rooms.get(joinedCode); if(!room) return;
    room.state=newGameState();
    if(!room.ready) pushLog(room.state,'Aguardando os dois jogadores…');
    broadcast(room);
  });

  socket.on('disconnect', ()=>{
    if(joinedCode) leaveRoom(socket, joinedCode);
  });

  // ---- saída/limpeza de assento com período de graça para reconexão ----
  function leaveRoom(sock, code){
    const room=rooms.get(code); if(!room) return;
    const r=room.sockets.get(sock.id);
    room.sockets.delete(sock.id);

    if(r==='x' || r==='o'){
      // não libera na hora: dá uma janela para o jogador reentrar (ex.: F5) e retomar o assento
      const seat=r;
      // marca assento como "vago temporariamente"
      if(room.players[seat]===sock.id) room.players[seat]=null;
      room.ready=false;
      pushLog(room.state, `${pname(seat)} caiu — aguardando reconexão…`);
      broadcast(room);
      clearGrace(room, seat);
      room.graceTimers[seat]=setTimeout(()=>{
        // se ninguém reocupou nesse tempo, o assento simplesmente fica livre para o próximo
        room.graceTimers[seat]=null;
        if(room.sockets.size===0) rooms.delete(code);
        else { updateReady(room); broadcast(room); }
      }, RECONNECT_GRACE_MS);
    } else {
      room.spectators.delete(sock.id);
    }

    if(room.sockets.size===0 && !room.graceTimers.x && !room.graceTimers.o){
      rooms.delete(code);
    } else {
      updateReady(room);
      broadcast(room);
    }
  }
});

function clearGrace(room, seat){
  if(room.graceTimers[seat]){ clearTimeout(room.graceTimers[seat]); room.graceTimers[seat]=null; }
}

httpServer.listen(PORT, ()=>{
  console.log(`\n  TIP-TAP ATTACK rodando em  http://localhost:${PORT}`);
  console.log(`  Abra essa URL, escolha um nome de sala e compartilhe o link:`);
  console.log(`  http://localhost:${PORT}/?sala=NOME_DA_SALA\n`);
});
