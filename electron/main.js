const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const spawn = require('cross-spawn');
const axios = require('axios');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;
const isDev = process.argv.includes('--dev');
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function createWindow() {
  // Create the browser window
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
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    title: 'NIRA - Neural Interactive Response Assistant'
  });

  // Start the backend server
  startBackend().then(() => {
    // Load the UI
    loadUI();
  }).catch((error) => {
    console.error('Failed to start backend:', error);
    showErrorDialog('Backend Startup Failed', 
      'Failed to start the NIRA backend server. Please check your installation.');
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    try {
      const backendPath = isDev 
        ? path.join(__dirname, '..', 'backend', 'server.py')
        : path.join(process.resourcesPath, 'backend', 'server.exe');

      console.log('Starting backend from:', backendPath);

      if (isDev) {
        // Development mode: run Python script directly
        backendProcess = spawn('python', [backendPath, '--host', '127.0.0.1', '--port', BACKEND_PORT.toString()], {
          cwd: path.dirname(backendPath),
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else {
        // Production mode: run compiled executable
        if (!fs.existsSync(backendPath)) {
          throw new Error(`Backend executable not found: ${backendPath}`);
        }
        
        backendProcess = spawn(backendPath, ['--host', '127.0.0.1', '--port', BACKEND_PORT.toString()], {
          stdio: ['ignore', 'pipe', 'pipe']
        });
      }

      let resolved = false;

      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Backend stdout:', output);
        
        if (output.includes('Uvicorn running') && !resolved) {
          resolved = true;
          // Wait a moment for the server to be fully ready
          setTimeout(() => {
            checkBackendHealth().then(resolve).catch(reject);
          }, 2000);
        }
      });

      backendProcess.stderr.on('data', (data) => {
        console.error('Backend stderr:', data.toString());
      });

      backendProcess.on('error', (error) => {
        console.error('Backend process error:', error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code} and signal ${signal}`);
        if (!resolved) {
          resolved = true;
          reject(new Error(`Backend process exited with code ${code}`));
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          checkBackendHealth().then(resolve).catch(reject);
        }
      }, 10000);

    } catch (error) {
      reject(error);
    }
  });
}

async function checkBackendHealth() {
  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 2000 });
      if (response.status === 200) {
        console.log('Backend health check passed');
        return;
      }
    } catch (error) {
      console.log(`Backend health check attempt ${retries + 1} failed:`, error.message);
    }

    retries++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Backend health check failed after maximum retries');
}

function loadUI() {
  if (isDev) {
    // Development mode: load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Production mode: load from bundled files
    const uiPath = path.join(__dirname, 'ui', 'dist', 'index.html');
    if (fs.existsSync(uiPath)) {
      mainWindow.loadFile(uiPath);
    } else {
      showErrorDialog('UI Files Missing', 
        'The UI files are missing. Please reinstall NIRA.');
    }
  }
}

function showErrorDialog(title, message) {
  dialog.showErrorBox(title, message);
}

function cleanupBackend() {
  if (backendProcess) {
    console.log('Terminating backend process...');
    backendProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        console.log('Force killing backend process...');
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
    
    backendProcess = null;
  }
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  cleanupBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  cleanupBackend();
});

// Handle protocol for development
if (isDev) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('disable-web-security');
}