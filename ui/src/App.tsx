import React, { useState, useEffect } from 'react'
import AvatarPanel from './components/AvatarPanel'
import Sidebar from './components/Sidebar'
import ChatJournal from './components/ChatJournal'
import ModelSelector from './components/ModelSelector'
import MicButton from './components/MicButton'
import { chat, stt, ollamaHealth, staticUrl, type Msg } from './api'
import './App.css'

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [ttsUrl, setTtsUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendReady, setBackendReady] = useState(false)

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      const res = await ollamaHealth()
      setBackendReady(res.ok)
    } catch (e) {
      console.error('Health check failed:', e)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    
    const newMessages: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await chat(newMessages, model || undefined)
      if (res.error) {
        console.error('Chat error:', res.error)
        return
      }
      
      if (res.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply! }])
      }
      
      if (res.avatar_url) {
        setAvatarUrl(staticUrl(res.avatar_url))
      }
      
      if (res.tts_url) {
        setTtsUrl(staticUrl(res.tts_url))
      }
    } catch (e) {
      console.error('Chat failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = async (blob: Blob) => {
    try {
      const res = await stt(blob)
      if (res.text) {
        await sendMessage(res.text)
      }
    } catch (e) {
      console.error('STT failed:', e)
    }
  }

  if (!backendReady) {
    return (
      <div className="splash">
        <div className="splash-content">
          <div className="nira-logo">NIRA</div>
          <div className="loading">Starting up...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar />
      
      <main className="main">
        <header className="header">
          <ModelSelector value={model} onChange={setModel} />
        </header>
        
        <div className="chat-area">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="content">{msg.content}</div>
              </div>
            ))}
            {loading && <div className="message assistant loading">Thinking...</div>}
          </div>
          
          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button 
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
            <MicButton onBlob={handleVoice} disabled={loading} />
          </div>
        </div>
      </main>
      
      <AvatarPanel mediaUrl={avatarUrl} name="NIRA" />
      <ChatJournal />
      
      {ttsUrl && (
        <audio key={ttsUrl} src={ttsUrl} autoPlay />
      )}
    </div>
  )
}