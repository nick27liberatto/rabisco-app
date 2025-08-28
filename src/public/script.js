
const socket = io();
const fabricCanvas = new fabric.Canvas('board', {
  isDrawingMode: true,
  backgroundColor: 'white',
});

fabricCanvas.freeDrawingBrush.color = 'black';
fabricCanvas.freeDrawingBrush.width = 2;

// Envia o novo objeto desenhado para o servidor
fabricCanvas.on('path:created', function(e) {
  const path = e.path;
  socket.emit('draw-path', path.toObject());
});

// Recebe paths existentes ao conectar
socket.on('init-drawings', (allPaths) => {
  allPaths.forEach(obj => {
    fabricCanvas.add(new fabric.Path(obj.path, obj));
  });
});

// Recebe paths desenhados por outros usuários
socket.on('draw-path', (obj) => {
  fabricCanvas.add(new fabric.Path(obj.path, obj));
});
