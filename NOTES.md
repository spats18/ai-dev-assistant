# Dev Notes

## Ports

`server.listen(3001)` means the backend is running on port 3001 — sitting and waiting for incoming connections.

React frontend runs on a different port — Vite defaults to port 5173.

```
React (5173)  →  sends message  →  Backend (3001)  →  calls Ollama (11434)  →  streams tokens back  →  Backend  →  React
```

Think of ports like doors on a computer. Each service sits behind its own door and listens for knocks. When React wants to talk to the backend, it knocks on door 3001.

That's also why we need CORS — browsers block frontend apps from talking to a server on a different port by default. CORS tells the backend "it's okay, let port 5173 in."


## How the Server and Socket.io Work

**The chain is:**
```
Express app
    ↓ wrapped in
HTTP server          ← this is what actually listens on 3001
    ↓ shared with
Socket.io (io)       ← hijacks the same port, handles WS connections
```

So `server.listen(3001)` starts everything — both Express AND socket.io are sharing that one port 3001.

When a request comes in on 3001, the HTTP server looks at it and decides:
- Normal HTTP request (like a REST call)? → goes to **Express**
- WebSocket connection request? → goes to **Socket.io**

So socket.io isn't a separate server — it's sitting on top of the same HTTP server, just handling a different type of traffic.

**The `cors` on Express** covers HTTP requests.
**The `cors: { origin: '*' }` on socket.io** covers WebSocket connections.

You need both because they're two different layers — Express doesn't automatically share its cors rules with socket.io.

Socket.io is the bridge that maintains the persistent connection between your React frontend and your Node backend, so tokens can stream back in real time instead of waiting for a full response.


## How the Ollama Streaming Works

When a message arrives over the WebSocket, the backend makes an HTTP POST request to Ollama at `localhost:11434/api/generate` with `stream: true`.

Instead of waiting for the full reply, Ollama sends back chunks of data as it generates them — one JSON object per chunk:
```json
{ "response": "Hello", "done": false }
{ "response": " there", "done": false }
{ "response": "!", "done": true }
```

The backend listens to the `data` event on the response stream. Each time a chunk arrives:
- It parses the JSON
- If `parsed.response` has text, it emits a `token` event to the frontend
- If `parsed.done` is true, it emits a `done` event so the frontend knows the response is complete

The frontend will receive these events in real time and append each token to the chat UI as it arrives — that's what creates the "typing" effect.

**Why `http.request()` and not `fetch`?**
Node's built-in `http.request()` gives direct access to the raw response stream via the `data` event. `fetch` buffers the response internally, making streaming harder to handle. For raw streaming, `http.request()` is the right tool.