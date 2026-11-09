const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onMaximizeChange: (callback) => ipcRenderer.on('window-maximize-changed', (_event, isMaximized) => callback(isMaximized))
});

