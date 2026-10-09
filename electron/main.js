const { app, BrowserWindow } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const isDevRaw = require('electron-is-dev');
const isDev = isDevRaw.default ?? isDevRaw;


const loadURL = serve.default ? serve.default({ directory: 'out' }) : serve({ directory: 'out' });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Ziga POS',
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/favicon_512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.setMenuBarVisibility(false);
  try {
    mainWindow.webContents.setUserAgent(mainWindow.webContents.getUserAgent() + ' Electron ZigaDesktopApp/1.0');
  } catch (e) {}

  if (isDev) {
    // In development mode, load the Next.js local server
    // Using port 3333 to avoid conflicts with port 3000 which might be occupied
    mainWindow.loadURL('http://localhost:3333?desktop=true');

    // Optionally open DevTools in dev mode
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the statically exported files
    loadURL(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure smooth application startup
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
