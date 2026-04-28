const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  saveApp: (appData) => ipcRenderer.invoke('save-app', appData),
  launchApp: (path) => ipcRenderer.invoke('launch-app', path),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  selectVideo: () => ipcRenderer.invoke('select-video'),
  updateApp: (appData) => ipcRenderer.invoke('update-app', appData),
  closeApp: () => ipcRenderer.invoke('close-app'),
  fetchGameData: (title) => ipcRenderer.invoke('fetch-game-data', title),
  fetchSteamGridData: (title) => ipcRenderer.invoke('fetch-steamgrid-data', title),
});



