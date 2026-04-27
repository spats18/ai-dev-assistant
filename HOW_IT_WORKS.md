# How It Works

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Machine                             │
│                                                                 │
│   ┌─────────────────┐        ┌─────────────────┐               │
│   │                 │        │                 │               │
│   │  React App      │        │   server.js     │               │
│   │  (Browser)      │        │   (Node.js)     │               │
│   │                 │        │                 │               │
│   │  port 5173      │        │   port 3001     │               │
│   │                 │        │                 │               │
│   └────────┬────────┘        └────────┬────────┘               │
│            │                          │                         │
│            │   WebSocket (socket.io)  │                         │
│            │ ◄───────────────────────►│                         │
│            │                          │                         │
│            │                          │  HTTP (streaming)       │
│            │                 ┌────────▼────────┐               │
│            │                 │                 │               │
│            │                 │     Ollama      │               │
│            │                 │  (AI runtime)   │               │
│            │                 │                 │               │
│            │                 │   port 11434    │               │
│            │                 │                 │               │
│            │                 └────────┬────────┘               │
│            │                          │                         │
│            │                 ┌────────▼────────┐               │
│            │                 │                 │               │
│            │                 │  qwen2.5-coder  │               │
│            │                 │    (1.5b model) │               │
│            │                 │                 │               │
│            │                 └─────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Request Flow (Step by Step)

```
User types a message and hits Send
        │
        ▼
React captures the input
Adds user bubble + empty assistant bubble to the screen
Emits a 'message' event over the WebSocket
        │
        ▼
server.js receives the message
Opens a streaming HTTP request to Ollama at localhost:11434
Sends the prompt with stream: true
        │
        ▼
Ollama loads the model (if not already in memory)
Starts generating tokens one by one
Sends each token back as a JSON chunk: { response: "Hello", done: false }
        │
        ▼
server.js receives each chunk
Emits a 'token' event back to the browser over WebSocket
        │
        ▼
React receives each token
Appends it to the last message bubble on screen
User sees text appearing word by word in real time
        │
        ▼
Ollama sends a final chunk: { done: true }
server.js emits a 'done' event
React removes the blinking cursor, re-enables the input
```

---

## In Plain English

Think of it like ordering food through a walkie-talkie system.

**You (the browser)** type a message and hit Send. The React app is just the screen — it draws the chat bubbles and handles what you type.

**The walkie-talkie** is the WebSocket. Unlike a normal web request where you ask and wait for a complete answer, a WebSocket keeps a live, open connection between your browser and the server the whole time — like leaving a phone call on.

**The middleman** is `server.js` running locally on port 3001. It receives your message and forwards it to Ollama.

**Ollama** is a separate program also running on your machine. It holds the AI model and does the actual thinking. Crucially, it doesn't wait until it has the full answer — it sends back one word (token) at a time as it generates them.

**The token relay:** As each word arrives at the server from Ollama, the server immediately bounces it back to your browser. React appends each word to the last chat bubble. That's why you see the text appear gradually — it's each word arriving live, not a loading spinner followed by a wall of text.

**The blinking cursor** is a CSS trick. It appears automatically on any message marked as `streaming` and disappears the moment the server signals `done`.

In short: **you type → browser sends over WebSocket → server forwards to Ollama → Ollama streams words back → server relays each word → browser draws it live.** Everything is local, nothing leaves your machine.

---

## How the React App Works

### Files at a Glance

| File | Role |
|---|---|
| `index.html` | HTML shell — just a `<div id="root">` that React mounts into |
| `src/main.jsx` | Entry point — mounts `<App />` into the DOM |
| `src/App.jsx` | The entire app — state, WebSocket logic, and UI in one component |
| `src/App.css` | Dark-themed chat styling |

### State (the app's memory)

The component tracks three pieces of state:

| State | What it holds |
|---|---|
| `messages` | Array of `{ role, text, streaming }` objects — the full chat history |
| `input` | Whatever the user is currently typing |
| `isStreaming` | True while Ollama is generating — disables the input and button |

### The WebSocket Connection

```js
const socket = io('http://localhost:3001')
```

This line lives *outside* the component so the connection is created once and persists across re-renders. Three events are listened for:

- **`token`** — appends the incoming word to the last message in state
- **`done`** — marks streaming as finished, removes the blinking cursor
- **`error`** — adds an error bubble, re-enables the input

### Sending a Message

When the user hits Send (or presses Enter), `sendMessage` does four things atomically:

1. Adds the user's message to the chat history
2. Adds an empty assistant message with `streaming: true` (the placeholder)
3. Clears the input field and sets `isStreaming = true`
4. Emits the message over the WebSocket to the server

Tokens from Ollama then fill in that empty placeholder one by one.

### The Blinking Cursor

Entirely CSS — no JavaScript involved:

```css
.message.assistant.streaming::after {
  content: '▋';
  animation: blink 0.7s steps(1) infinite;
}
```

Any assistant message with the `streaming` class gets the cursor appended automatically. It disappears when React removes the `streaming` class after the `done` event.

### Auto-Scroll

A hidden `<div>` anchored to the bottom of the message list. Any time `messages` changes, `scrollIntoView` fires to keep the latest content visible — so the chat always follows the output as it streams in.
