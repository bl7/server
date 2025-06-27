const statusElem = document.getElementById('printer-status');
const previewDiv = document.getElementById('preview');
const queueDiv = document.getElementById('queue');

// Connect to WebSocket (same host/port)
const ws = new WebSocket(`ws://${location.host}`);

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = event => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'status') {
    statusElem.textContent = msg.connected ? 'Connected' : 'Disconnected';
    statusElem.style.color = msg.connected ? 'green' : 'red';
  }

  else if (msg.type === 'image') {
    // New label image arrived: display preview
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + msg.image;
    img.style.maxWidth = '150px';
    img.style.margin = '5px';
    previewDiv.appendChild(img);
  }

  else if (msg.type === 'queue') {
    // Update the queue display
    queueDiv.innerHTML = '<h3>Print Queue:</h3>';
    msg.jobs.forEach(job => {
      const line = document.createElement('div');
      line.textContent = `Job ${job.id}: ${job.status}`;
      queueDiv.appendChild(line);
    });
  }
};

ws.onclose = () => {
  statusElem.textContent = 'Disconnected';
  statusElem.style.color = 'red';
};
