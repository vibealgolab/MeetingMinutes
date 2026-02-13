import { app, BrowserWindow, ipcMain, shell, session, desktopCapturer } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleAIFileManager } from "@google/generative-ai/server";

// Get current directory equivalent to __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Determine the path to the recordings directory
// In portable mode (packaged), this should be next to the executable.
// In dev mode, it can be in the project root.
const getRecordingsPath = () => {
    // For portable apps, we want to save next to the actual EXE the user ran,
    // not in the temporary folder where the app extracts itself.
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'Recordings');
    }

    const exePath = path.dirname(app.getPath('exe'));
    return app.isPackaged
        ? path.join(exePath, 'Recordings')
        : path.join(__dirname, '..', 'Recordings');
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true, // Keep security enabled
        },
        autoHideMenuBar: true,
    });

    // In production, load the local index.html
    // In dev, load localhost
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
        // Open DevTools in dev mode
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();

    // Ensure Recordings directory exists
    const recordingsPath = getRecordingsPath();
    if (!fs.existsSync(recordingsPath)) {
        fs.mkdirSync(recordingsPath, { recursive: true });
    }

    // Handle Screen Capture Permission (System Audio)
    // Electron requires this handler. We auto-select the main screen.
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] })
            .then((sources) => {
                // Return the first screen (usually the main one)
                // request.video and request.audio could be checked, but for now grant access.
                if (sources.length > 0) {
                    callback({ video: sources[0], audio: 'loopback' });
                } else {
                    // No screen found?
                    callback(null);
                }
            })
            .catch((error) => {
                console.error("Screen capture error:", error);
                callback(null);
            });
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Handlers ---

// 5. Upload File to Gemini (Server-side)
ipcMain.handle('upload-to-gemini', async (event, { apiKey, filePath, mimeType }) => {
    try {
        let finalPath = filePath;

        // If not an absolute path, assume it's in the recordings folder
        if (!path.isAbsolute(finalPath)) {
            finalPath = path.join(getRecordingsPath(), filePath);
        }

        console.log("Checking if file exists before upload:", finalPath);
        if (!fs.existsSync(finalPath)) {
            const errorMsg = `File not found at ${finalPath}. Recordings path is ${getRecordingsPath()}`;
            console.error(errorMsg);
            throw new Error(`File not found: ${filePath}. Tried: ${finalPath}`);
        }

        console.log("Uploading file to Gemini:", finalPath);
        const fileManager = new GoogleAIFileManager(apiKey);

        // Upload the file
        const uploadResponse = await fileManager.uploadFile(finalPath, {
            mimeType: mimeType,
            displayName: path.basename(finalPath),
        });

        console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);
        return uploadResponse.file.uri;

    } catch (err) {
        console.error("Gemini Upload Error:", err);
        throw err;
    }
});

// 6. Import External File to Recordings Folder
ipcMain.handle('import-file', async (event, { filePath }) => {
    try {
        const dir = getRecordingsPath();
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filename = path.basename(filePath);
        // Add timestamp to prevent overwrite if name exists
        const timestamp = new Date().getTime();
        const newFilename = `imported_${timestamp}_${filename}`;
        const destination = path.join(dir, newFilename);

        await fs.promises.copyFile(filePath, destination);
        console.log("Imported file to:", destination);

        return {
            success: true,
            path: destination,
            name: newFilename
        };
    } catch (err) {
        console.error("Failed to import file:", err);
        throw err;
    }
});

// 1. Get List of Recordings
ipcMain.handle('list-recordings', async () => {
    const dir = getRecordingsPath();
    if (!fs.existsSync(dir)) return [];

    try {
        const files = await fs.promises.readdir(dir);
        // Filter for audio files
        const supportedExts = ['.mp3', '.wav', '.m4a', '.webm', '.aac', '.ogg'];
        const audioFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return supportedExts.includes(ext);
        });

        // Return full details if needed, for now just names or simple objects
        // We'll return objects with path (for playback)
        // Note: For local playback in Electron with web security, we might need a custom protocol
        // or just use file:// protocol if allowed. 
        // For simplicity in this plan, we'll return the filename and let the frontend request 
        // the full file content via another handler or use a safe buffer approach.
        // Actually, passing 'file://' path to audio src might be blocked by CSP.
        // Better: frontend asks backend to "read file" as blob/base64.
        return audioFiles.map(f => ({
            name: f,
            path: path.join(dir, f)
        }));
    } catch (err) {
        console.error("Failed to list recordings:", err);
        return [];
    }
});

// 2. Save Recording
ipcMain.handle('save-recording', async (event, { buffer, filename }) => {
    const dir = getRecordingsPath();
    const filePath = path.join(dir, filename);

    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        await fs.promises.writeFile(filePath, Buffer.from(buffer));
        console.log("Saved recording to:", filePath);
        return { success: true, path: filePath };
    } catch (err) {
        console.error("Failed to save file:", err);
        throw err;
    }
});

// 3. Read File (for playback/analysis)
ipcMain.handle('read-file', async (event, filename) => {
    const dir = getRecordingsPath();
    const filePath = path.join(dir, filename);

    try {
        // Return as base64 or buffer? Buffer is transferrable.
        // Reading full file into memory might be heavy for large WAVs, but fine for typical meetings (<100MB).
        const buffer = await fs.promises.readFile(filePath);
        return buffer;
    } catch (err) {
        console.error("Failed to read file:", err);
        throw err;
    }
});

// 4. Open Recordings Folder
ipcMain.handle('open-recordings-folder', () => {
    const dir = getRecordingsPath();
    shell.openPath(dir);
});

// 5. Delete Recording
ipcMain.handle('delete-file', async (event, filename) => {
    const dir = getRecordingsPath();
    const filePath = path.join(dir, filename);

    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log("Deleted file:", filePath);
            return { success: true };
        } else {
            return { success: false, error: 'File not found' };
        }
    } catch (err) {
        console.error("Failed to delete file:", err);
        throw err;
    }
});
