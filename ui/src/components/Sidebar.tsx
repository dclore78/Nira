import React from 'react'
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">NIRA</div>
      <div className="section">Menu</div>
      <a className="item" href="#">Chat</a>
      <a className="item" href="#">Journal</a>
      <div className="foot">Local • Private</div>
    </aside>
  )
}