const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { pathToFileURL } = require('url');
const serve = require('electron-serve').default || require('electron-serve');

const loadURL = serve({ directory: path.join(__dirname, '../dist') });

protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

const dbPath = path.join(app.getPath('userData'), 'database.json');

// Inicializar la base de datos local
function initDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ games: [], media: [] }, null, 2));
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Determinar si estamos en modo desarrollo o producción
  const isDev = !app.isPackaged;

  if (isDev) {
    // En desarrollo, carga Expo Web (por defecto corre en el puerto 8081)
    mainWindow.loadURL('http://localhost:8081');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, usa electron-serve para servir la carpeta dist de Expo
    loadURL(mainWindow);
  }
}

app.whenReady().then(() => {
  initDB();

  // Registrar protocolo personalizado para cargar imágenes locales y videos de forma segura
  // Usamos registerFileProtocol para mejor soporte de streaming/rangos en videos
  protocol.registerFileProtocol('local-file', (request, callback) => {
    try {
      let filePath = decodeURIComponent(request.url.replace('local-file://', ''));
      
      // En Windows, las rutas pueden venir como /C:/ o C/ o C:/
      if (process.platform === 'win32') {
        if (filePath.startsWith('/')) filePath = filePath.slice(1);
        if (/^[a-zA-Z]\//.test(filePath)) {
          filePath = filePath[0] + ':' + filePath.slice(1);
        }
      }
      
      callback({ path: path.normalize(filePath) });
    } catch (err) {
      console.error('Protocol error:', err);
    }
  });

  // IPC: Obtener todas las aplicaciones
  ipcMain.handle('get-apps', () => {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    const injectMedia = (items) => {
      return items.map(item => {
        // Portada
        if (item.image && fs.existsSync(item.image)) {
          try {
            const ext = path.extname(item.image).substring(1).toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : (ext || 'png');
            const base64Data = fs.readFileSync(item.image, 'base64');
            item.imageBase64 = `data:image/${mimeType};base64,${base64Data}`;
          } catch(e) { console.error('Error leyendo imagen', e); }
        }
        // Fondo
        if (item.backgroundImage && fs.existsSync(item.backgroundImage)) {
          try {
            const ext = path.extname(item.backgroundImage).substring(1).toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : (ext || 'png');
            const base64Data = fs.readFileSync(item.backgroundImage, 'base64');
            item.backgroundImageBase64 = `data:image/${mimeType};base64,${base64Data}`;
          } catch(e) { console.error('Error leyendo fondo', e); }
        }
        // Logo
        if (item.logo && fs.existsSync(item.logo)) {
          try {
            const ext = path.extname(item.logo).substring(1).toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : (ext || 'png');
            const base64Data = fs.readFileSync(item.logo, 'base64');
            item.logoBase64 = `data:image/${mimeType};base64,${base64Data}`;
          } catch(e) { console.error('Error leyendo logo', e); }
        }
        return item;
      });
    };

    data.games = injectMedia(data.games || []);
    data.media = injectMedia(data.media || []);
    return data;
  });

  // IPC: Guardar una nueva aplicación
  ipcMain.handle('save-app', (event, appData) => {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    appData.id = Date.now().toString();
    
    if (appData.type === 'game') {
      data.games = data.games || [];
      data.games.push(appData);
    } else {
      data.media = data.media || [];
      data.media.push(appData);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return data;
  });

  // IPC: Actualizar una aplicación existente
  ipcMain.handle('update-app', (event, updatedApp) => {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const updateInList = (list) => {
      const index = list.findIndex(item => item.id === updatedApp.id);
      if (index !== -1) {
        // Filtramos campos vacíos para no borrar datos existentes accidentalmente
        const filteredUpdate = Object.fromEntries(
          Object.entries(updatedApp).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        );
        list[index] = { ...list[index], ...filteredUpdate };
        return true;
      }
      return false;
    };

    if (!updateInList(data.games || []) && !updateInList(data.media || [])) {
      return { success: false, error: 'App not found' };
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { success: true, data };
  });

  // IPC: Ejecutar un programa externo
  ipcMain.handle('launch-app', (event, executablePath) => {
    if (!executablePath) return;
    
    // Ejecutar la ruta proporcionada
    exec(`"${executablePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error al ejecutar la aplicación:', error);
      }
    });
  });

  // IPC: Abrir diálogo para seleccionar ejecutable
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Ejecutables', extensions: ['exe', 'bat', 'lnk', 'url'] }]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // IPC: Abrir diálogo para seleccionar imagen (portada)
  ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // IPC: Abrir diálogo para seleccionar video
  ipcMain.handle('select-video', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'mkv', 'avi'] }]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // IPC: Cerrar la aplicación
  ipcMain.handle('close-app', () => {
    app.quit();
  });

  createWindow();


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
