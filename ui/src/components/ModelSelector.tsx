import React, { useEffect, useState } from 'react'
import { getCatalog, getLocalModels, pullModelStart, pullModelStatus } from '../api'

export default function ModelSelector({ value, onChange }: { value?: string, onChange: (m: string) => void }) {
  const [catalog, setCatalog] = useState<string[]>([])
  const [local, setLocal] = useState<string[]>([])
  const [pulling, setPulling] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)

  useEffect(() => {
    getCatalog().then(res => setCatalog(res.models || []))
    loadLocal()
  }, [])

  const loadLocal = async () => {
    try {
      const res = await getLocalModels()
      setLocal(res.models?.map(m => m.name) || [])
    } catch (e) {
      console.error('Failed to load local models:', e)
    }
  }

  const handleSelect = async (model: string) => {
    if (local.includes(model)) {
      onChange(model)
      return
    }
    
    // Need to download
    setPulling(model)
    setProgress(0)
    try {
      const res = await pullModelStart(model)
      if (res.done) {
        await loadLocal()
        onChange(model)
        setPulling(null)
        return
      }
      if (res.job_id) {
        setJobId(res.job_id)
        pollProgress(res.job_id, model)
      }
    } catch (e) {
      console.error('Failed to start pull:', e)
      setPulling(null)
    }
  }

  const pollProgress = async (id: string, model: string) => {
    const poll = async () => {
      try {
        const res = await pullModelStatus(id)
        setProgress(res.progress || 0)
        if (res.done) {
          await loadLocal()
          onChange(model)
          setPulling(null)
          setJobId(null)
        } else {
          setTimeout(poll, 1000)
        }
      } catch (e) {
        console.error('Failed to check progress:', e)
        setPulling(null)
        setJobId(null)
      }
    }
    poll()
  }

  return (
    <div className="model-selector">
      <label>Model:</label>
      <select 
        value={value || ''} 
        onChange={e => handleSelect(e.target.value)}
        disabled={!!pulling}
      >
        <option value="">Select a model...</option>
        {catalog.map(model => (
          <option key={model} value={model}>
            {model} {local.includes(model) ? '✓' : '⬇'}
          </option>
        ))}
      </select>
      {pulling && (
        <div className="pull-progress">
          Downloading {pulling}... {progress}%
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}