const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#0b1220',
    autoHideMenuBar: true,
    useContentSize: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  const captureArg = process.argv.find((a) => a.startsWith('--capture='));
  const loadOptions = captureArg ? { query: { auto: '1', debug: '1' } } : undefined;
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), loadOptions);

  win.once('ready-to-show', () => {
    win.show();
  });

  // Verification hook: `electron . --capture=<path>` renders once and saves a PNG.
  if (captureArg) {
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log('[renderer:' + level + '] ' + message);
    });
    const outPath = captureArg.split('=')[1];
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage();
          fs.writeFileSync(outPath, image.toPNG());
          console.log('CAPTURED ' + outPath);
        } catch (err) {
          console.error('CAPTURE_ERR', err && err.message);
        } finally {
          app.quit();
        }
      }, 3000);
    });
  }

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
