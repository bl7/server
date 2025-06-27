// spooler.js
const printers = require('@agsolutions-at/printers');
const { PDFDocument } = require('pdf-lib');

// Simple in-memory job queue
const jobQueue = [];
let isPrinting = false;
let statusCallback = () => {};

function setStatusCallback(cb) {
  statusCallback = cb;
}

function getQueue() {
  return jobQueue.map((job, index) => ({
    id: job.id,
    status: job.status,
    position: index,
  }));
}

async function pngToPdf(pngBuffer) {
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
  return await pdfDoc.save();
}

async function processQueue() {
  if (isPrinting || jobQueue.length === 0) return;
  isPrinting = true;

  const job = jobQueue[0];
  job.status = 'Printing';
  statusCallback();

  try {
    const available = printers.getPrinters();
    if (available.length === 0) {
      console.error('No printers available. Retrying in 5 seconds...');
      job.status = 'Retrying';
      statusCallback();
      setTimeout(() => { isPrinting = false; processQueue(); }, 5000);
      return;
    }

    const printerName = available[0].name;
    const pdfBuffer = await pngToPdf(job.imageBuffer);
    await printers.print(printerName, pdfBuffer, 'Label Print', []);
    console.log(`Job ${job.id} printed successfully.`);

    job.status = 'Done';
    statusCallback();
    jobQueue.shift();
    isPrinting = false;
    processQueue();

  } catch (err) {
    console.error('Printing error:', err);
    job.status = 'Error';
    statusCallback();
    jobQueue.shift();
    isPrinting = false;
    processQueue();
  }
}

function addJob(base64Image) {
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const job = {
    id: Date.now(),
    imageBuffer,
    status: 'Queued',
  };
  jobQueue.push(job);
  statusCallback();
  processQueue();
}

module.exports = {
  addJob,
  getQueue,
  setStatusCallback,
};
