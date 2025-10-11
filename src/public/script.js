const colorPicker = document.getElementById('colorPicker');
const eraserBtn = document.getElementById('eraserBtn');
const brushSizeSlider = document.getElementById('brushSizeSlider');
const clearBtn = document.getElementById('clearBtn');
const backgroundColor = '#222';
let isDrawing = false;
let lastPoint = null;
let currentColor = '#ffffff';
let isErasing = false;
let brushSize = 2;
let cursor = 'url(./assets/pencil-white.png) 5 5, auto';

const socket = io();
const fabricCanvas = new fabric.Canvas('board', {
  isDrawingMode: true,
  backgroundColor: backgroundColor,
});

fabricCanvas.freeDrawingBrush.color = currentColor;
fabricCanvas.freeDrawingBrush.width = brushSize;
fabricCanvas.defaultCursor = cursor;
fabricCanvas.freeDrawingCursor = cursor;

if(brushSizeSlider) {
  brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    fabricCanvas.freeDrawingBrush.width = brushSize;
  }); 
}

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
      fabricCanvas.freeDrawingBrush.color = backgroundColor;
      eraserBtn.textContent = 'Lápis';
    } else {
      fabricCanvas.freeDrawingBrush.color = currentColor;
      eraserBtn.textContent = 'Borracha';
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = backgroundColor;
    socket.emit('clear-canvas');
  });
}

socket.on('clear-canvas', () => {
  fabricCanvas.clear();
  fabricCanvas.backgroundColor = backgroundColor;
});

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
    const colorToSend = isErasing ? backgroundColor : currentColor;
    
    socket.emit('draw-point-live', { 
      x: point.x, 
      y: point.y, 
      last: lastPoint, 
      color: colorToSend, 
      size: brushSize });

    lastPoint = point;
  }
});

fabricCanvas.on('path:created', function(e) {
  const path = e.path;
  const commands = path.path;

  if (commands.length < 2) return; 
  
  const [move, line] = commands;

  socket.emit('draw-point-live', { 
    x: line[1], 
    y: line[2], 
    last: { x: move[1], y: move[2] }, 
    lastPoint: null,
    color: path.stroke, 
    size: path.strokeWidth 
  });
});

socket.on('init-drawings', (allPaths) => {
  allPaths.forEach(obj => {
    if (!obj.last) return;
    const line = new fabric.Line([obj.last.x, obj.last.y, obj.x, obj.y], {
      stroke: obj.color || '#fff',
      strokeWidth: obj.size || 2,
      selectable: false,
      evented: false,
      objectCaching: false,
      strokeLineCap: 'round'
    });
    fabricCanvas.add(line);
  });
});

socket.on('draw-point-live', ({ x, y, last, color, size }) => {
  if (last) {
    const line = new fabric.Line([last.x, last.y, x, y], {
      stroke: color || '#fff',
      strokeWidth: size || 2,
      selectable: false,
      evented: false,
      objectCaching: false,
      strokeLineCap: 'round'
    });
    fabricCanvas.add(line);
  }
});
