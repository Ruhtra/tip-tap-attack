// sobe o servidor: o express serve a pasta ui e o socket.io cuida do tempo real.
// a lógica de verdade fica no arbitro.js e na pasta nucleo/.
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ligarArbitro } from './arbitro.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors:{ origin:'*' } });

app.use(express.static(join(__dirname, 'ui')));   // serve o index.html e os js/css da pasta ui
ligarArbitro(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, ()=>{
  console.log(`\n  TIP-TAP ATTACK rodando em  http://localhost:${PORT}\n`);
});
