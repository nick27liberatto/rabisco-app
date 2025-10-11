const fs = require('fs');
const fileName = 'drawings.json';
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('src/public'));

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let drawings = [];

io.on('connection', (socket) => {
  console.log('Usuário conectado', socket.id);

  socket.emit('init-drawings', drawings);

  socket.on('draw-point-live', (point) => {
    drawings.push(point);

    fs.writeFileSync(fileName, JSON.stringify(drawings, null, 2));

    socket.broadcast.emit('draw-point-live', point);
  });

  socket.on('clear-canvas', () => {
    drawings = [];
    if (fs.existsSync(fileName)) {
      fs.writeFileSync(fileName, "{}");
    }
    console.log('Canvas limpo por um usuário');
    socket.broadcast.emit('clear-canvas');
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado', socket.id);  
  });
});

http.listen(3000, () => {
  if (fs.existsSync(fileName)) {
    const data = fs.readFileSync(fileName);
    drawings = JSON.parse(data);
  }
  console.log('Servidor rodando em http://localhost:3000')
});
