import React from 'react';
import { Brain, Download, Trash2, Settings } from 'lucide-react';

interface ModelInfo {
  name: string;
  size: string;
  available: boolean;
  downloading: boolean;
  progress: number;
}

interface SidebarProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onDownloadModel: (model: string) => void;
  onClearConversation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  models,
  selectedModel,
  onModelSelect,
  onDownloadModel,
  onClearConversation
}) => {
  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-md border-r border-gray-700/50 p-4 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cyan-400">NIRA</h1>
            <p className="text-xs text-gray-400">Neural Interactive Assistant</p>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">AI Models</h3>
        <div className="space-y-2">
          {models.map((model) => (
            <div key={model.name} className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="model"
                    value={model.name}
                    checked={selectedModel === model.name}
                    onChange={(e) => onModelSelect(e.target.value)}
                    className="text-cyan-400"
                    disabled={!model.available}
                  />
                  <div>
                    <span className="text-sm font-medium">{model.name}</span>
                    <div className="text-xs text-gray-400">{model.size}</div>
                  </div>
                </label>
                
                {!model.available && !model.downloading && (
                  <button
                    className="btn-secondary p-1"
                    onClick={() => onDownloadModel(model.name)}
                    title="Download model"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {model.downloading && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Downloading...</span>
                    <span>{model.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${model.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {model.available && (
                <div className="text-xs text-green-400 mt-1">✓ Ready</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-3">
        <button
          className="btn-secondary w-full justify-center"
          onClick={onClearConversation}
        >
          <Trash2 className="w-4 h-4" />
          Clear Chat
        </button>
        
        <button className="btn-secondary w-full justify-center">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full pulse"></div>
          <span className="text-xs text-gray-400">Connected</span>
        </div>
      </div>
    </div>
  );
};