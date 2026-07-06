// tudo que o app precisa lembrar fica aqui, num objeto só.
// trocar de tela é só mudar estado.tela.
export const estado = {
  tela: 'menu',        // menu | comojogar | creditos | painel | alunos | entrar | chave | jogo
  aviso: '',           // mensagem de erro que aparece no rodapé

  // torneio
  codigo: '',          // código da sessão
  souHost: false,      // sou o professor?
  nomeEnviado: '',     // guardo pra reentrar se cair
  participantes: [],   // [{ nome }]
  chave: null,         // { rodadas, campeao }
  qr: null,            // imagem do QR Code

  // a partida atual
  ST: null,            // estado do jogo que vem do servidor
  eu: null,            // meu lado: 'x' ou 'o'
  emPartida: false,
  carta: null,         // carta selecionada (null = modo colocar peça)
  tick: 0,             // conta pra animar o "aguardando..."
};
