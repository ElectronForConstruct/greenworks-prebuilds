const electron      = require('electron');
// Module to control application life.
const app           = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const bootstrap = require('./main');

var mainWindow = null;

app.on('window-all-closed', function () {
  if (process.platform != 'darwin')
    app.quit();
});

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width         : 800,
    height        : 600,
    show          : true,
    webPreferences: { nodeIntegration: true },
  });
  bootstrap();
  mainWindow.loadURL('file://' + __dirname + '/index.html');
  console.log('Exiting');
  process.exit(0);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});
