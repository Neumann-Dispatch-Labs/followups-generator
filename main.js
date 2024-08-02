const path = require('path');
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets/tricon.ico') 
  });

  mainWindow.loadFile('web/index.html');

  
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle file read and write
ipcMain.handle('read-trucks', async () => {
  const filePath = path.join(__dirname, 'web/db/trucks.json');
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading trucks file:', error);
    return {};
  }
});

ipcMain.handle('write-trucks', async (event, trucks) => {
  const filePath = path.join(__dirname, 'web/db/trucks.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(trucks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing trucks file:', error);
  }
});
