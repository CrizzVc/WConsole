const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const serve = require('electron-serve').default || require('electron-serve');

const loadURL = serve({ directory: path.join(__dirname, '../dist') });

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

  // Registrar protocolo personalizado para cargar imágenes locales de forma segura
  protocol.handle('local-file', (request) => {
    const filePath = request.url.replace('local-file://', '');
    return net.fetch('file://' + decodeURIComponent(filePath));
  });

  // IPC: Obtener todas las aplicaciones
  ipcMain.handle('get-apps', () => {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    const injectImage = (items) => {
      return items.map(item => {
        if (item.image && fs.existsSync(item.image)) {
          try {
            const ext = path.extname(item.image).substring(1).toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : (ext || 'png');
            const base64Data = fs.readFileSync(item.image, 'base64');
            item.imageBase64 = `data:image/${mimeType};base64,${base64Data}`;
          } catch(e) {
            console.error('Error leyendo imagen', e);
          }
        }
        return item;
      });
    };

    data.games = injectImage(data.games || []);
    data.media = injectImage(data.media || []);
    return data;
  });

  // IPC: Guardar una nueva aplicación
  ipcMain.handle('save-app', (event, appData) => {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    // Asignar un ID único simple
    appData.id = Date.now().toString();
    
    if (appData.type === 'game') {
      data.games.push(appData);
    } else {
      data.media.push(appData);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return data;
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

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
