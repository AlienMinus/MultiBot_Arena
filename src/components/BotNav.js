// Secondary Navigation Strip (Clean Brand SVGs & Tooltips)
import { ICONS } from './Icons.js';

export class BotNav {
  constructor({ bots, activeBots, onToggleBot, onReloadAll, onToggleAll, onOpenCompare, onToggleSyncScroll }) {
    this.bots = bots;
    this.activeBots = activeBots;
    this.onToggleBot = onToggleBot;
    this.onReloadAll = onReloadAll;
    this.onToggleAll = onToggleAll;
    this.onOpenCompare = onOpenCompare;
    this.onToggleSyncScroll = onToggleSyncScroll;
    this.isSyncScrollActive = false;

    this.container = document.getElementById('bot-pills-container');
    this.stripActions = document.getElementById('strip-actions');

    this.init();
  }

  init() {
    this.renderPills();
    this.renderActions();
  }

  renderPills() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.bots.forEach(bot => {
      const pill = document.createElement('button');
      pill.className = `bot-pill glass-pill ${this.activeBots.has(bot.id) ? 'active' : ''}`;
      pill.id = `pill-${bot.id}`;
      pill.title = `Toggle ${bot.name} (${bot.provider})`;
      pill.style.setProperty('--bot-color', bot.accentColor);
      pill.style.setProperty('--bot-glow', bot.glowColor);

      pill.innerHTML = `
        <span class="bot-icon-svg" style="color: ${bot.accentColor};">${bot.iconSvg}</span>
        <span class="pill-name">${bot.name}</span>
      `;

      pill.addEventListener('click', () => {
        if (this.onToggleBot) this.onToggleBot(bot.id);
      });

      this.container.appendChild(pill);
    });
  }

  renderActions() {
    if (!this.stripActions) return;
    this.stripActions.innerHTML = `
      <button class="glass-btn primary icon-only" id="btn-compare-view" title="Compare Responses Side-by-Side (Alt+C)">
        ${ICONS.compare}
      </button>
      <button class="glass-btn icon-only" id="btn-sync-scroll" title="Synchronized Scrolling (Off)">
        ${ICONS.syncScroll}
      </button>
      <button class="glass-btn icon-only" id="btn-reload-all" title="Reload All Active Bots">
        ${ICONS.reload}
      </button>
      <button class="glass-btn icon-only" id="btn-toggle-all" title="Toggle All Models">
        ${ICONS.toggleAll}
      </button>
    `;

    this.stripActions.querySelector('#btn-compare-view')?.addEventListener('click', () => {
      if (this.onOpenCompare) this.onOpenCompare();
    });

    const syncBtn = this.stripActions.querySelector('#btn-sync-scroll');
    syncBtn?.addEventListener('click', () => {
      this.isSyncScrollActive = !this.isSyncScrollActive;
      syncBtn.classList.toggle('active', this.isSyncScrollActive);
      syncBtn.title = `Synchronized Scrolling (${this.isSyncScrollActive ? 'ON' : 'OFF'})`;
      if (this.onToggleSyncScroll) this.onToggleSyncScroll(this.isSyncScrollActive);
    });

    this.stripActions.querySelector('#btn-reload-all')?.addEventListener('click', () => {
      if (this.onReloadAll) this.onReloadAll();
    });

    this.stripActions.querySelector('#btn-toggle-all')?.addEventListener('click', () => {
      if (this.onToggleAll) this.onToggleAll();
    });
  }

  updatePillState(activeBots) {
    this.activeBots = activeBots;
    this.bots.forEach(bot => {
      const pill = document.getElementById(`pill-${bot.id}`);
      if (pill) {
        pill.classList.toggle('active', this.activeBots.has(bot.id));
      }
    });
  }
}
