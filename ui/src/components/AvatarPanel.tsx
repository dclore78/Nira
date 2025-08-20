import React, { useState } from 'react';
import { User, Volume2, VolumeX } from 'lucide-react';

export const AvatarPanel: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-md border-l border-gray-700/50 p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-400 mb-1">Avatar</h3>
        <p className="text-sm text-gray-400">Visual AI Assistant</p>
      </div>

      {/* Avatar Display */}
      <div className="relative mb-6">
        <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 flex items-center justify-center overflow-hidden">
          {/* Avatar Image */}
          <img
            src="/assets/avatar.jpg"
            alt="NIRA Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default avatar
              const target = e.target as HTMLImageElement;
              target.src = '/assets/default-avatar.svg';
            }}
          />
          
          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="absolute inset-0 border-4 border-cyan-400 rounded-xl glow"></div>
          )}
        </div>

        {/* Voice Controls */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              isMuted
                ? 'bg-red-500/80 text-white'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Avatar Status */}
      <div className="card p-3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-400 pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">
            {isSpeaking ? 'Speaking...' : 'Listening'}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          {isSpeaking 
            ? 'NIRA is currently speaking'
            : 'Ready to respond to your messages'
          }
        </p>
      </div>

      {/* Avatar Info */}
      <div className="card p-3">
        <h4 className="text-sm font-semibold text-cyan-400 mb-2">Avatar Features</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Lip-sync animation</li>
          <li>• Emotion detection</li>
          <li>• Real-time speech</li>
          <li>• Visual feedback</li>
        </ul>
      </div>

      {/* Voice Settings */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Voice Settings</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Voice Speed</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              defaultValue="1"
              className="w-full accent-cyan-400"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Voice Pitch</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              defaultValue="1"
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};