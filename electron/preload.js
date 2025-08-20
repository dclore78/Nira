const { contextBridge, ipcRenderer } = require('electron')

// Expose minimal API to renderer if needed
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any needed APIs here
})