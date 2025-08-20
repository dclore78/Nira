import React, { useState } from 'react'
export default function ChatJournal() {
  const [text, setText] = useState('')
  return (
    <aside className="journal">
      <div className="title">Journal</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Notes..." />
      <div className="row">
        <button>Save</button>
      </div>
    </aside>
  )
}