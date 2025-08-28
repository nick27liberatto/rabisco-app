let isDrawing = false;
let lastPoint = null;
let currentColor = '#ffffff';
let isErasing = false;

const socket = io();
const fabricCanvas = new fabric.Canvas('board', {
  isDrawingMode: true,
  backgroundColor: '#222',
});

fabricCanvas.freeDrawingBrush.color = currentColor;
fabricCanvas.freeDrawingBrush.width = 2;
fabricCanvas.defaultCursor = 'url(./assets/pencil-white.png) 5 5, auto';
fabricCanvas.freeDrawingCursor = 'url(./assets/pencil-white.png) 5 5, auto';

const colorPicker = document.getElementById('colorPicker');
const eraserBtn = document.getElementById('eraserBtn');

if (colorPicker) {
  colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    if (!isErasing) {
      fabricCanvas.freeDrawingBrush.color = currentColor;
    }
  });
  currentColor = colorPicker.value;
  fabricCanvas.freeDrawingBrush.color = currentColor;
}

if (eraserBtn) {
  eraserBtn.addEventListener('click', () => {
    isErasing = !isErasing;
    if (isErasing) {
      fabricCanvas.freeDrawingBrush.color = '#222'; // cor do fundo
      eraserBtn.textContent = 'Pincel';
    } else {
      fabricCanvas.freeDrawingBrush.color = currentColor;
      eraserBtn.textContent = 'Borracha';
    }
  });
}

fabricCanvas.on('mouse:down', function(opt) {
  isDrawing = true;
  lastPoint = fabricCanvas.getPointer(opt.e);
});

fabricCanvas.on('mouse:up', function(opt) {
  isDrawing = false;
  lastPoint = null;
});

fabricCanvas.on('mouse:move', function(opt) {
  if (isDrawing) {
    const point = fabricCanvas.getPointer(opt.e);
    const colorToSend = isErasing ? '#222' : currentColor;
    socket.emit('draw-point-live', { x: point.x, y: point.y, last: lastPoint, color: colorToSend });
    lastPoint = point;
  }
});

// Envia o novo objeto desenhado para o servidor
fabricCanvas.on('path:created', function(e) {
  const path = e.path;
  socket.emit('draw-point-live', path.toObject());
});

// Recebe paths existentes ao conectar
socket.on('init-drawings', (allPaths) => {
  allPaths.forEach(obj => {
    fabricCanvas.add(new fabric.Path(obj.path, obj));
  });
});

socket.on('draw-point-live', ({ x, y, last, color }) => {
  if (last) {
    const line = new fabric.Line([last.x, last.y, x, y], {
      stroke: color || '#fff',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });
    fabricCanvas.add(line);
  }
});
