A cross-platform Node.js-based local print server for Munbyn USB thermal label printers.

It listens on http://localhost:8080 for WebSocket connections from your web app and accepts PNG images of labels to print.

Incoming labels are sent to the connected Munbyn printer (203 DPI, 5.6 cm width × 31mm / 40mm / 80mm height) and also previewed on the local web interface.

The server auto-starts on system login for both Windows and macOS.

Features
✅ WebSocket API for receiving print jobs as PNG images from your web app.

✅ Embedded Express Web UI at http://localhost:8080 showing printer status and live label previews.

✅ Supports Munbyn USB thermal printers (203 DPI).

✅ USB plug/unplug detection for live printer status updates.

✅ Auto-starts on system login (using auto-launch).

✅ Multi-label print jobs supported.

Requirements
Node.js (v16 or newer)

Munbyn USB thermal printer (203 DPI)

Munbyn printer driver installed (Windows or macOS)

Installation
Clone the repository:

bash
Copy
Edit
git clone https://github.com/yourusername/munbyn-print-server.git
cd munbyn-print-server
Install dependencies:

bash
Copy
Edit
npm install
Start the server:

bash
Copy
Edit
npm start
After starting, the server runs at:

Web UI: http://localhost:8080

WebSocket: ws://localhost:8080

Sending Print Jobs
Your web app should open a WebSocket connection to ws://localhost:8080 and send print jobs as JSON.

Example WebSocket message format:

json
Copy
Edit
{
"type": "print",
"images": [
"<base64-encoded PNG>",
"<base64-encoded PNG>"
]
}
images: An array of PNG images in Base64 (one or more labels).

On receiving this, the server will:

Broadcast the label images to the local web UI for preview.

Send the images to the Munbyn printer for immediate printing.

Web UI – Label Preview & Status
Visit:

http://localhost:8080

You’ll see:

Printer connection status (Connected / Disconnected)

Live preview of incoming label images (appears as thumbnails)

Auto Start on System Login
The server automatically registers itself to start on user login for both Windows and macOS using the auto-launch npm package.

This ensures the server runs in the background at boot.

If you want to disable auto-start, remove the auto-launch configuration in the code.

Printer Driver Setup
Before using this server:

Download and install the official Munbyn USB printer driver for your OS:

Windows: ITPP129B Driver from Munbyn’s website.

macOS: ITPP129 Mac Driver from Munbyn.

After installation:

Make sure the printer is visible in your system’s printer list.

Create a custom paper size in your OS printer settings (e.g., 56mm width × desired height: 31mm / 40mm / 80mm).

Dependencies
express

ws

@agsolutions-at/printers

pdf-lib

usb-detection

auto-launch

Install them all via:

bash
Copy
Edit
npm install
Building Standalone Executable (Optional)
If you want to package this server as a standalone app (e.g., EXE for Windows or .app for Mac):

Use a packager like pkg or electron-builder.

(Example packaging instructions can be added later.)

Screenshots
(Screenshots of the Web UI showing printer status and label previews go here.)

License
MIT License.

Contribution Guidelines
Contributions are welcome!

Fork the repo

Create a feature branch

Commit your changes

Open a Pull Request

For bug reports or feature requests, please open an issue.
