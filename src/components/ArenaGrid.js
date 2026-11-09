// Arena Grid & Webview Manager Component (Clean SVGs, Tooltips & Sync Scroll)
import { ICONS } from './Icons.js';

export class ArenaGrid {
  constructor({ bots, activeBots, onToggleFocus }) {
    this.bots = bots;
    this.activeBots = activeBots;
    this.onToggleFocus = onToggleFocus;
    this.container = document.getElementById('views-container');
    this.focusedBotId = null;
    this.isSyncScrollEnabled = false;
    this.zoomLevels = {};
    this.bots.forEach(b => { this.zoomLevels[b.id] = 1.0; });

    this.init();
  }

  init() {
    this.renderCards();
    this.container.addEventListener('click', (e) => this.handleAction(e));
  }

  renderCards() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.bots.forEach(bot => {
      const card = document.createElement('div');
      const isVisible = this.activeBots.has(bot.id);
      card.className = `bot-card glass-panel ${isVisible ? '' : 'hidden'}`;
      card.id = `card-${bot.id}`;
      card.style.setProperty('--card-color', bot.accentColor);
      card.style.setProperty('--card-glow', bot.glowColor);

      card.innerHTML = `
        <div class="bot-card-header glass-header">
          <div class="bot-info">
            <span class="bot-brand-svg" style="color: ${bot.accentColor};">${bot.iconSvg}</span>
            <span class="bot-title" style="color: ${bot.accentColor}; font-weight: 600;">${bot.name}</span>
          </div>

          <div class="bot-header-controls">
            <button class="mini-icon-btn" data-action="zoom-out" data-bot="${bot.id}" title="Zoom Out">
              ${ICONS.zoomOut}
            </button>
            <button class="mini-icon-btn" data-action="zoom-in" data-bot="${bot.id}" title="Zoom In">
              ${ICONS.zoomIn}
            </button>
            <button class="mini-icon-btn" data-action="home" data-bot="${bot.id}" title="Reset to Home">
              ${ICONS.home}
            </button>
            <button class="mini-icon-btn" data-action="reload" data-bot="${bot.id}" title="Reload Bot">
              ${ICONS.reload}
            </button>
            <button class="mini-icon-btn" data-action="focus" data-bot="${bot.id}" title="Focus Mode">
              ${ICONS.focus}
            </button>
            <button class="mini-icon-btn" data-action="open-ext" data-bot="${bot.id}" title="Open in Browser">
              ${ICONS.externalLink}
            </button>
          </div>
        </div>

        <div class="webview-wrapper">
          <webview
            id="webview-${bot.id}"
            partition="${bot.partition}"
            src="${bot.url}"
            preload="webview-preload.js"
            allowpopups
          ></webview>
        </div>
      `;

      this.container.appendChild(card);

      const webview = card.querySelector(`#webview-${bot.id}`);
      webview.addEventListener('did-start-loading', () => {
        card.classList.add('loading');
      });
      webview.addEventListener('did-stop-loading', () => {
        card.classList.remove('loading');
        if (this.isSyncScrollEnabled) {
          this.injectScrollTracker(webview);
        }
      });

      // Synchronized Scroll Listener via Webview Console Bridge
      webview.addEventListener('console-message', (e) => {
        if (this.isSyncScrollEnabled && e.message && e.message.startsWith('ARENA_SCROLL:')) {
          const pct = parseFloat(e.message.split(':')[1]);
          if (!isNaN(pct)) {
            this.broadcastScroll(bot.id, pct);
          }
        }
      });
    });
  }

  async handleAction(e) {
    const btn = e.target.closest('.mini-icon-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const botId = btn.dataset.bot;
    const bot = this.bots.find(b => b.id === botId);
    const webview = document.getElementById(`webview-${botId}`);

    if (!webview) return;

    if (!this.zoomLevels[botId]) {
      this.zoomLevels[botId] = 1.0;
    }

    switch (action) {
      case 'reload':
        webview.reload();
        break;
      case 'home':
        if (bot) webview.loadURL(bot.homeUrl);
        break;
      case 'zoom-in': {
        const next = Math.min(2.5, Math.round((this.zoomLevels[botId] + 0.15) * 100) / 100);
        this.zoomLevels[botId] = next;
        try {
          webview.setZoomFactor(next);
        } catch (_) {}
        try {
          webview.executeJavaScript(`document.body.style.zoom = '${next}';`);
        } catch (_) {}
        btn.title = `Zoom In (${Math.round(next * 100)}%)`;
        break;
      }
      case 'zoom-out': {
        const next = Math.max(0.4, Math.round((this.zoomLevels[botId] - 0.15) * 100) / 100);
        this.zoomLevels[botId] = next;
        try {
          webview.setZoomFactor(next);
        } catch (_) {}
        try {
          webview.executeJavaScript(`document.body.style.zoom = '${next}';`);
        } catch (_) {}
        btn.title = `Zoom Out (${Math.round(next * 100)}%)`;
        break;
      }
      case 'open-ext':
        if (bot && window.electronAPI) {
          window.electronAPI.openExternal(webview.getURL() || bot.url);
        }
        break;
      case 'focus':
        if (this.onToggleFocus) this.onToggleFocus(botId);
        break;
    }
  }

  setSyncScroll(enabled) {
    this.isSyncScrollEnabled = enabled;
    if (enabled) {
      this.activeBots.forEach(id => {
        const wv = document.getElementById(`webview-${id}`);
        if (wv) this.injectScrollTracker(wv);
      });
    }
  }

  injectScrollTracker(wv) {
    try {
      wv.executeJavaScript(`
        if (!window.__arenaScrollBound) {
          window.__arenaScrollBound = true;
          window.__arenaIgnoreNext = false;
          window.addEventListener('scroll', function() {
            if (window.__arenaIgnoreNext) return;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var p = max > 0 ? (window.scrollY / max) : 0;
            console.log('ARENA_SCROLL:' + p.toFixed(4));
          }, { passive: true });
        }
      `);
    } catch (_) {}
  }

  broadcastScroll(originBotId, pct) {
    this.activeBots.forEach(id => {
      if (id === originBotId) return;
      const wv = document.getElementById(`webview-${id}`);
      if (wv) {
        try {
          wv.executeJavaScript(`
            window.__arenaIgnoreNext = true;
            var max = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: ${pct} * max, behavior: 'instant' });
            setTimeout(function() { window.__arenaIgnoreNext = false; }, 60);
          `);
        } catch (_) {}
      }
    });
  }

  updateVisibility(activeBots) {
    this.activeBots = activeBots;
    this.bots.forEach(bot => {
      const card = document.getElementById(`card-${bot.id}`);
      if (card) {
        card.classList.toggle('hidden', !this.activeBots.has(bot.id));
      }
    });
  }

  setLayoutClass(layoutClass) {
    this.container.className = `views-container ${layoutClass}`;
  }

  reloadVisibleBots() {
    this.activeBots.forEach(id => {
      const wv = document.getElementById(`webview-${id}`);
      if (wv) wv.reload();
    });
  }
}
