import React from 'react'
export default function AvatarPanel({ mediaUrl, name }: { mediaUrl: string | null, name: string }) {
  const isVideo = !!mediaUrl && mediaUrl.toLowerCase().endsWith('.mp4')
  return (
    <aside className="avatar-panel">
      <div className="avatar-frame">
        {mediaUrl ? (
          isVideo ? (
            <video className="avatar" src={mediaUrl} autoPlay loop muted playsInline />
          ) : (
            <img className="avatar" src={mediaUrl} alt={`${name} avatar`} />
          )
        ) : (
          <div className="avatar placeholder">{name}</div>
        )}
        <div className="pulse-ring" />
      </div>
      <div className="avatar-wordmark" aria-label={name}>
        <span className="nira-n">N</span><span className="nira-i">I</span><span className="nira-r">R</span><span className="nira-a">A</span>
      </div>
      <div className="avatar-mic" title="Microphone">🎤</div>
    </aside>
  )
}