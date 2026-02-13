const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    listRecordings: () => ipcRenderer.invoke('list-recordings'),
    saveRecording: (buffer, filename) => ipcRenderer.invoke('save-recording', { buffer, filename }),
    readFile: (filename) => ipcRenderer.invoke('read-file', filename),
    openRecordingsFolder: () => ipcRenderer.invoke('open-recordings-folder'),
    uploadToGemini: (data) => ipcRenderer.invoke('upload-to-gemini', data),
    deleteFile: (filename) => ipcRenderer.invoke('delete-file', filename),
    importFile: (data) => ipcRenderer.invoke('import-file', data),
});
