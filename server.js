// server.js
const express = require('express');
const http = require('http');
const { Server: WebSocketServer } = require('ws');
const usbDetect = require('usb-detection');
const printers = require('@agsolutions-at/printers');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const spooler = require('./spooler'); 
// Create Express app and static file server
const app = express();
app.use(express.static('public'));  // serve UI files
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast JSON message to all connected clients
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

// Check printer status and notify UI
function updateStatus() {
  const printerList = printers.getPrinters();
  // Filter for Munbyn or default to first
  let connected = false;
  printerList.forEach(p => {
    if (p.name.includes('Munbyn') || p.name.toLowerCase().includes('thermal')) {
      connected = true;
    }
  });
  // Fallback: if any printers installed, assume connected
  if (!connected && printerList.length > 0) connected = true;

  broadcast({ type: 'status', connected });
}


// Notify UI whenever the queue changes
spooler.setStatusCallback(() => {
  const queue = spooler.getQueue();
  broadcast({ type: 'queue', jobs: queue });
});
// Handle incoming WebSocket connections
wss.on('connection', ws => {
  // Send initial printer status on connect
  updateStatus();

  ws.on('message', async (msg) => {
  try {
    const data = JSON.parse(msg);
    if (data.type === 'print' && Array.isArray(data.images)) {
      for (let base64png of data.images) {
        // Broadcast image preview to UI
        broadcast({ type: 'image', image: base64png });
        // Add to spooler queue
        spooler.addJob(base64png);
      }
    }
  } catch (err) {
    console.error('Error handling message:', err);
  }
});
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// USB detection for plug/unplug events
usbDetect.startMonitoring();
usbDetect.on('add', () => { console.log('USB device added'); updateStatus(); });
usbDetect.on('remove', () => { console.log('USB device removed'); updateStatus(); });

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Print server running at http://localhost:${PORT}`);
  // Initial status
  updateStatus();
});
