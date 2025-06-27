// public/app.js
const statusElem = document.getElementById('printer-status');
const previewDiv = document.getElementById('preview');

// Connect to WebSocket (same host/port)
const ws = new WebSocket(`ws://${location.host}`);
ws.onopen = () => { console.log('WebSocket connected'); };
ws.onmessage = event => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'status') {
    statusElem.textContent = msg.connected ? 'Connected' : 'Disconnected';
    statusElem.style.color = msg.connected ? 'green' : 'red';
  } else if (msg.type === 'image') {
    // New label image arrived: display preview
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + msg.image;
    previewDiv.appendChild(img);
  }
};
ws.onclose = () => { statusElem.textContent = 'Disconnected'; statusElem.style.color = 'red'; };
