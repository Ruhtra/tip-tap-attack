// o chaveamento do torneio (eliminação simples, mata-a-mata).
// tudo puro, sem rede

function embaralhar(lista){
  const a = lista.slice();
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}
// menor potência de 2 >= n (5 vira 8, 8 continua 8, 9 vira 16)
function proximaPotenciaDe2(n){ let x = 1; while(x < n) x *= 2; return x; }

let _seq = 0;
function novoId(){ return 'm' + (_seq++); }

// monta a chave a partir da lista de participantes (cada um { id, nome })
export function criarTorneio(participantes, { sortear = true } = {}){
  const jogadores = sortear ? embaralhar(participantes) : participantes.slice();
  const n = jogadores.length;
  if(n < 2) return { rodadas: [], campeao: n === 1 ? jogadores[0] : null };

  const tamanho = proximaPotenciaDe2(n);
  const byes    = tamanho - n;             // quantos passam direto na 1ª rodada

  // rodadas vazias: tamanho/2 confrontos, depois a metade... até a final
  const rodadas = [];
  for(let m = tamanho/2; m >= 1; m = m/2){
    const confrontos = [];
    for(let c=0;c<m;c++) confrontos.push({ id:novoId(), a:null, b:null, vencedor:null });
    rodadas.push(confrontos);
  }

  // 1ª rodada: as sala ficam com 1 jogador só (passa direto),
  // o resto recebe os pares que vão se enfrentar
  const r1 = rodadas[0];
  for(let i=0;i<r1.length;i++){
    r1[i].a = jogadores[i];
    if(i >= byes) r1[i].b = jogadores[r1.length + (i - byes)];
  }

  const t = { rodadas, campeao:null };
  r1.forEach((m, pos)=>{ if(m.a && !m.b){ m.vencedor = m.a; avancar(t, 0, pos); } });   // resolve os byes
  return t;
}

// leva o vencedor de um confronto pro lugar dele na rodada seguinte
function avancar(t, indiceRodada, pos){
  const confronto = t.rodadas[indiceRodada][pos];
  const proxima   = t.rodadas[indiceRodada + 1];
  if(!proxima){ t.campeao = confronto.vencedor; return; }   // era a final
  const alvo = proxima[Math.floor(pos/2)];
  if(pos % 2 === 0) alvo.a = confronto.vencedor;
  else              alvo.b = confronto.vencedor;
}

// quando uma partida acaba: marca o vencedor e avança a chave
export function registrarVencedor(t, idConfronto, vencedor){
  for(let r=0;r<t.rodadas.length;r++){
    const pos = t.rodadas[r].findIndex(m=>m.id===idConfronto);
    if(pos >= 0){
      t.rodadas[r][pos].vencedor = vencedor;
      avancar(t, r, pos);
      return true;
    }
  }
  return false;
}

// confrontos prontos pra jogar agora (os dois lados definidos e ainda sem vencedor)
export function confrontosProntos(t){
  const prontos = [];
  for(const rodada of t.rodadas)
    for(const m of rodada)
      if(m.a && m.b && !m.vencedor) prontos.push(m);
  return prontos;
}
