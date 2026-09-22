const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  // Start the Express server as a background process
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' }
  });

  serverProcess.on('message', (msg) => {
    console.log('Server message:', msg);
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Caterly Smart OS",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true, // Single tab browser feel
  });

  // Load the app
  // In dev mode, we load from the Vite dev server
  // In production, we load from the Express server (which serves the static files)
  const url = isDev ? 'http://localhost:3000' : 'http://localhost:3000';
  
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer();
  // Give the server a moment to start
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
