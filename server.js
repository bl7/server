// server.js
const express = require('express');
const http = require('http');
const { Server: WebSocketServer } = require('ws');
const usbDetect = require('usb-detection');
const printers = require('@agsolutions-at/printers');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

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

// Convert PNG buffer to a single-page PDF buffer
async function pngToPdf(pngBytes) {
  const pdfDoc = await PDFDocument.create();
  // Embed the PNG image
  const pngImage = await pdfDoc.embedPng(pngBytes);
  // Create a page that fits the image dimensions (convert px to points, assuming 96 DPI)
  const width = pngImage.width;
  const height = pngImage.height;
  const page = pdfDoc.addPage([width, height]);
  // Draw image covering the page
  page.drawImage(pngImage, { x: 0, y: 0, width, height });
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Handle incoming WebSocket connections
wss.on('connection', ws => {
  // Send initial printer status on connect
  updateStatus();

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'print' && Array.isArray(data.images)) {
        // Received print job (array of base64 PNGs)
        for (let base64png of data.images) {
          // Convert base64 to buffer
          const pngBuffer = Buffer.from(base64png, 'base64');
          // Preview: broadcast image to UI clients
          broadcast({ type: 'image', image: base64png });
          // Convert to PDF for printing
          const pdfBuffer = await pngToPdf(pngBuffer);
          // Send to printer
          const available = printers.getPrinters();
          if (available.length === 0) {
            console.error('No printers available');
            continue;
          }
          const printerName = available[0].name;  // use first detected printer
          printers.print(printerName, pdfBuffer, 'Label Print', []);
        }
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
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
