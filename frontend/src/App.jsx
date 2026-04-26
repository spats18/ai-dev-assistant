import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3001', {
  reconnectionAttempts: 3,  // stop trying after 3 failed attempts
  timeout: 5000,
})

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting') // 'connecting' | 'connected' | 'disconnected'
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    socket.on('connect', () => setConnectionStatus('connected'))

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected')
      setIsStreaming(false)
    })

    // fires when all reconnection attempts fail
    socket.on('connect_error', () => setConnectionStatus('disconnected'))

    socket.on('token', (token) => {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: updated[updated.length - 1].text + token,
        }
        return updated
      })
    })

    socket.on('done', () => {
      setIsStreaming(false)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false }
        return updated
      })
    })

    socket.on('error', (err) => {
      setIsStreaming(false)
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${err}`, streaming: false }])
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('token')
      socket.off('done')
      socket.off('error')
    }
  }, [])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || isStreaming || connectionStatus !== 'connected') return

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '', streaming: true },
    ])
    setInput('')
    setIsStreaming(true)
    socket.emit('message', text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage()
  }

  const isDisabled = isStreaming || connectionStatus !== 'connected'

  return (
    <div className="chat-container">
      <div className="chat-header">
        AI Dev Assistant
        <span className={`status-dot ${connectionStatus}`} title={connectionStatus} />
      </div>

      {connectionStatus === 'disconnected' && (
        <div className="connection-banner">
          Cannot connect to backend — make sure <code>node server.js</code> is running on port 3001
        </div>
      )}

      {connectionStatus === 'connecting' && (
        <div className="connection-banner connecting">
          Connecting to backend...
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role} ${msg.streaming ? 'streaming' : ''}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder={connectionStatus !== 'connected' ? 'Waiting for connection...' : 'Ask something...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
        />
        <button onClick={sendMessage} disabled={isDisabled}>
          {isStreaming ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default App
