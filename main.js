const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');
const { BOTS } = require('./bot-config');

// 1. Disable Blink Automation Flags to eliminate "navigator.webdriver" detection
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy');
app.commandLine.appendSwitch('disable-site-isolation-trials');

// Standard modern desktop User-Agents
const CHROME_VERSION = process.versions.chrome;
const MODERN_CHROME_UA =
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION} Safari/537.36`;

// Firefox UA specifically for accounts.google.com to bypass Google's embedded browser block
const FIREFOX_GOOGLE_AUTH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';

app.userAgentFallback = MODERN_CHROME_UA;

let mainWindow = null;

function setupPartitionSession(partitionName) {
  const ses = session.fromPartition(partitionName);
  
  // Set clean User-Agent by default
  ses.setUserAgent(MODERN_CHROME_UA);

  // Clean request headers and dynamically spoof Firefox for Google Accounts
  ses.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, callback) => {
    const requestHeaders = { ...details.requestHeaders };
    const url = details.url || '';

    // If authenticating through Google, spoof Firefox to bypass "Insecure browser" block
    if (url.includes('accounts.google.com') || url.includes('accounts.youtube.com')) {
      requestHeaders['User-Agent'] = FIREFOX_GOOGLE_AUTH_UA;
      delete requestHeaders['sec-ch-ua'];
      delete requestHeaders['sec-ch-ua-mobile'];
      delete requestHeaders['sec-ch-ua-platform'];
    } else {
      requestHeaders['User-Agent'] = MODERN_CHROME_UA;
      requestHeaders['sec-ch-ua'] = `"Chromium";v="${CHROME_VERSION.split('.')[0]}", "Google Chrome";v="${CHROME_VERSION.split('.')[0]}", "Not?A_Brand";v="99"`;
      requestHeaders['sec-ch-ua-mobile'] = '?0';
      requestHeaders['sec-ch-ua-platform'] = '"Windows"';
    }

    callback({ cancel: false, requestHeaders });
  });

  // Strip headers preventing iframe / webview embedding and OAuth handshakes
  ses.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // Remove frame restriction headers
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];

    // Relax Opener & Embedder policies so OAuth handshake postMessage succeeds
    delete responseHeaders['cross-origin-opener-policy'];
    delete responseHeaders['Cross-Origin-Opener-Policy'];
    delete responseHeaders['cross-origin-embedder-policy'];
    delete responseHeaders['Cross-Origin-Embedder-Policy'];

    // Relax Content-Security-Policy frame-ancestors
    const relaxCSP = (cspStr) => {
      return cspStr
        .replace(/frame-ancestors\s+[^;]+(;|$)/gi, '')
        .replace(/child-src\s+[^;]+(;|$)/gi, '');
    };

    if (responseHeaders['content-security-policy']) {
      responseHeaders['content-security-policy'] = responseHeaders['content-security-policy'].map(relaxCSP);
    }
    if (responseHeaders['Content-Security-Policy']) {
      responseHeaders['Content-Security-Policy'] = responseHeaders['Content-Security-Policy'].map(relaxCSP);
    }

    callback({ cancel: false, responseHeaders });
  });

  // Grant standard permissions (notifications, clipboard, media)
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true);
  });

  return ses;
}

function createWindow() {
  // Pre-configure all bot partition sessions
  BOTS.forEach(bot => {
    setupPartitionSession(bot.partition);
  });

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1000,
    minHeight: 700,
    frame: false, // Custom frameless title bar
    backgroundColor: '#090204',
    icon: path.join(__dirname, 'arena.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true
    }
  });

  mainWindow.loadFile('index.html');

  // Track maximize state
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximize-changed', false);
  });

  // Handle OAuth popups from inside webviews
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler(({ url }) => {
        // Native Chromium popup handling preserves window.opener and cookies
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 650,
            height: 750,
            autoHideMenuBar: true,
            backgroundColor: '#090204',
            webPreferences: {
              session: contents.session,
              preload: path.join(__dirname, 'webview-preload.js'),
              nodeIntegration: false,
              contextIsolation: true,
              sandbox: true
            }
          }
        };
      });
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('open-external', (_event, url) => {
  if (url) shell.openExternal(url);
});
