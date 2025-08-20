const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

let mainWindow
let backendProcess

const isDev = process.env.NODE_ENV === 'development'
const BACKEND_PORT = 5000

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    title: 'NIRA',
    show: false,
    backgroundColor: '#1a1a1a'
  })

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false)

  // Load the UI
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Load from built UI in renderer/
    const uiPath = path.join(__dirname, 'renderer', 'index.html')
    if (fs.existsSync(uiPath)) {
      await mainWindow.loadFile(uiPath)
    } else {
      console.error('UI files not found at:', uiPath)
      app.quit()
      return
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

async function startBackend() {
  const backendExe = isDev 
    ? path.join(__dirname, '..', 'backend', 'dist', 'nyra-backend.exe')
    : path.join(process.resourcesPath, 'nyra-backend.exe')

  if (!fs.existsSync(backendExe)) {
    console.error('Backend executable not found:', backendExe)
    return false
  }

  return new Promise((resolve) => {
    backendProcess = spawn(backendExe, [], {
      stdio: 'ignore',
      detached: false,
      windowsHide: true
    })

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err)
      resolve(false)
    })

    // Give backend time to start
    setTimeout(() => {
      resolve(true)
    }, 3000)
  })
}

async function waitForBackend() {
  const maxRetries = 30
  const retryDelay = 1000

  for (let i = 0; i < maxRetries; i++) {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`http://127.0.0.1:${BACKEND_PORT}/health`, {
        timeout: 2000
      })
      if (response.ok) {
        console.log('Backend is ready')
        return true
      }
    } catch (error) {
      // Backend not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay))
  }
  
  console.error('Backend failed to start within timeout')
  return false
}

app.whenReady().then(async () => {
  console.log('Starting NIRA...')
  
  // Start backend first
  const backendStarted = await startBackend()
  if (!backendStarted) {
    console.error('Failed to start backend')
    app.quit()
    return
  }

  // Wait for backend to be ready
  const backendReady = await waitForBackend()
  if (!backendReady) {
    console.error('Backend health check failed')
    app.quit()
    return
  }

  // Create main window
  await createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow()
  }
})

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill()
  }
})

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})