const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('src/public'));

let drawings = []; // cada item = Fabric.js path object

io.on('connection', (socket) => {
  console.log('Usuário conectado');

  socket.emit('init-drawings', drawings);

  socket.on('draw-path', (pathObj) => {
    drawings.push(pathObj);
    socket.broadcast.emit('draw-path', pathObj);
  });
});

http.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
