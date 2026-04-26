// Imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // allows the React frontend (port 5173) to make requests to this server (port 3001)
app.get('/', (req, res) => res.send('Backend is running')); // health check — confirms the server is up in a browser
const server = http.createServer(app); // socket.io needs a raw Node HTTP server, not just the Express app
const io = new Server(server, { cors: { origin: '*' } }); // attaches socket.io to the same HTTP server; cors here covers WebSocket connections specifically

// fires every time a new client (React app) opens a WebSocket connection
io.on('connection', (socket) => {

    // listens for a 'message' event sent by the frontend
    socket.on('message', (userMessage) => {
        console.log('Received message:', userMessage);

        // config for the HTTP request to Ollama
        const options = {
            hostname: 'localhost',
            port: 11434,           // Ollama's default port
            path: '/api/generate', // Ollama's text generation endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        // open a streaming HTTP request to Ollama
        const req = http.request(options, (res) => {
            // 'data' fires each time a new chunk arrives from Ollama
            res.on('data', (chunk) => {
                const parsed = JSON.parse(chunk.toString()); // each chunk is one JSON object e.g. { response: "Hello", done: false }
                if (parsed.response) socket.emit('token', parsed.response); // forward the token to the frontend in real time
                if (parsed.done) socket.emit('done'); // tell the frontend the full response is complete
            });
        });

        // send the prompt; stream:true tells Ollama to send tokens as generated rather than waiting for the full response
        req.write(JSON.stringify({ model: 'qwen2.5-coder:7b', prompt: userMessage, stream: true }));
        req.end(); // signals we're done writing the request body — Ollama starts processing

        // catches network-level errors e.g. Ollama not running
        req.on('error', (err) => {
            console.error('Ollama error:', err.message);
            socket.emit('error', 'Failed to reach Ollama');
        });
    });
});

server.listen(3001, () => console.log('Backend running on port 3001'));
