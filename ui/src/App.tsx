import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AvatarPanel } from './components/AvatarPanel';
import { Journal } from './components/Journal';
import { API_BASE_URL } from './utils/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ModelInfo {
  name: string;
  size: string;
  available: boolean;
  downloading: boolean;
  progress: number;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama2');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Check backend health on startup
  useEffect(() => {
    checkBackendHealth();
    fetchModels();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('error');
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models`);
      if (response.ok) {
        const modelData = await response.json();
        setModels(modelData);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          model: selectedModel,
          conversation_history: messages
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from AI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const downloadModel = async (modelName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models/${modelName}/download`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh models list after download
        await fetchModels();
      }
    } catch (error) {
      console.error('Failed to download model:', error);
    }
  };

  if (backendStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="pulse text-cyan text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-cyan">Connecting to NIRA...</h2>
          <p className="text-muted mt-2">Starting up the AI backend</p>
        </div>
      </div>
    );
  }

  if (backendStatus === 'error') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-500">Backend Connection Failed</h2>
          <p className="text-muted mt-2">Please make sure the NIRA backend is running</p>
          <button 
            className="btn mt-4"
            onClick={checkBackendHealth}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar 
          models={models}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onDownloadModel={downloadModel}
          onClearConversation={clearConversation}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea 
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
        />
      </div>
      
      {/* Right Panel */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        {/* Avatar Panel */}
        <div className="flex-1">
          <AvatarPanel />
        </div>
        
        {/* Journal */}
        <div className="flex-1">
          <Journal />
        </div>
      </div>
    </div>
  );
}

export default App;