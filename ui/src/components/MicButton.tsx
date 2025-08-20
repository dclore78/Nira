import React, { useEffect, useRef, useState } from 'react'
export default function MicButton({ onBlob, disabled }: { onBlob: (b: Blob) => void, disabled?: boolean }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null)
  const [on, setOn] = useState(false)
  const chunks = useRef<Blob[]>([])
  useEffect(() => () => { if (rec && rec.state !== 'inactive') rec.stop() }, [rec])
  const toggle = async () => {
    if (disabled) return
    if (!on) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      r.ondataavailable = e => e.data.size && chunks.current.push(e.data)
      r.onstop = () => { const blob = new Blob(chunks.current, { type: 'audio/webm' }); chunks.current = []; onBlob(blob) }
      r.start()
      setRec(r); setOn(true)
    } else {
      rec?.stop(); setOn(false)
    }
  }
  return <button className={`mic ${on ? 'on' : ''}`} onClick={toggle} disabled={disabled}>{on ? 'Stop' : 'Mic'}</button>
}