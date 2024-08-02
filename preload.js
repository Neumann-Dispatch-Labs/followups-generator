const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readTrucks: () => ipcRenderer.invoke('read-trucks'),
  writeTrucks: (trucks) => ipcRenderer.invoke('write-trucks', trucks),
});
