const { contextBridge, ipcRenderer } = require('electron');

// Aquí puedes exponer funciones seguras del sistema al frontend de React Native
// a través del objeto `window.electronAPI`
contextBridge.exposeInMainWorld('electronAPI', {
  // Ejemplo: platform: () => process.platform
});
