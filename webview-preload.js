// Webview Preload Script to Mask Automation & Emulate Standard Browser

try {
  // Strip navigator.webdriver flag
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true
  });
  
  if (navigator.__proto__) {
    delete navigator.__proto__.webdriver;
  }

  // Emulate standard window.chrome properties expected by Google
  if (!window.chrome) {
    window.chrome = {};
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = {
      connect: () => {},
      sendMessage: () => {}
    };
  }

  // Emulate standard plugins array
  if (navigator.plugins && navigator.plugins.length === 0) {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' }
      ]
    });
  }
} catch (_) {}

