# AI Dev Assistant — Project Context

## Overview
A personal AI coding assistant built with a React frontend, Node.js backend, and a locally hosted LLM via Ollama. Designed to be simple, functional, and free of cloud costs.

## Phase 1 — Current Scope
Build a working chat interface that streams responses from a local LLM in real time. No auth, no database, no agents yet.

## Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express + WebSocket (socket.io)
- **LLM:** Ollama — running locally on `http://localhost:11434`
- **Model:** `qwen2.5-coder:7b`

## Project Structure
```
/frontend    → React app (chat UI, WebSocket client)
/backend     → Express server (Ollama proxy, WebSocket server)
```

## How It Works
1. User types a message in the React UI
2. Message is sent over WebSocket to the Node.js backend
3. Backend forwards the message to Ollama at `localhost:11434`
4. Ollama streams tokens back to the backend
5. Backend pipes each token over WebSocket to React in real time

## Guidelines for Claude Code
- Claude can write frontend (React) code directly
- For backend code — guide and suggest, don't write everything
- Keep it simple, Phase 1 only
- No premature optimization
- Flag anything that will become relevant in future phases
