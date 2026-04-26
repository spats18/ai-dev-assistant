# AI Dev Assistant — Project Context

## What This Is
A personal AI coding assistant with a React frontend, Node.js backend,
and a locally hosted LLM via Ollama. Simple, functional, no cloud costs.

## Current Scope (Phase 1)
Build a working chat interface that streams responses from a local LLM.
That's it. No auth, no DB, no agents yet.

## Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express + WebSocket (socket.io)
- **LLM:** Ollama running locally on http://localhost:11434
- **Model:** qwen2.5-coder:7b

## Project Structure
- /frontend        → React app (chat UI, WebSocket client)
- /backend         → Express server (Ollama proxy, WebSocket server)

## How It Works
1. User types a message in React UI
2. Sent over WebSocket to Node.js backend
3. Backend forwards to Ollama at localhost:11434
4. Ollama streams tokens back
5. Backend pipes stream → WebSocket → React (token by token)

## Phase 2 (Future — don't build yet)
- Java Spring Boot microservices (AI Orchestrator, Agent Service)
- Redis (sessions, cache, pub/sub)
- PostgreSQL + pgvector
- Monaco editor
- JWT auth + OAuth2
- Multi-step autonomous agent

## Rules for Claude Code
- I am writing the code, not you — guide and suggest, don't write everything
- Keep it simple, Phase 1 only
- No premature optimization
- Call out when something will matter in Phase 2