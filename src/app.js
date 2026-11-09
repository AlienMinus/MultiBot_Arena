// Main Application Orchestrator

import { BOTS } from './config/bots.js';
import { BroadcastService } from './services/broadcast.js';
import { CompareService } from './services/compare.js';
import { Titlebar } from './components/Titlebar.js';
import { BotNav } from './components/BotNav.js';
import { ArenaGrid } from './components/ArenaGrid.js';
import { PromptDock } from './components/PromptDock.js';
import { CompareModal } from './components/CompareModal.js';

class ArenaApp {
  constructor() {
    this.activeBots = new Set(['claude', 'deepseek', 'gemini', 'chatgpt', 'grok', 'perplexity']);
    this.broadcastTargets = new Set(['claude', 'deepseek', 'gemini', 'chatgpt', 'grok', 'perplexity']);
    this.currentLayout = 'hexa';

    // Services
    this.broadcastService = new BroadcastService();
    this.compareService = new CompareService();

    // Components
    this.init();
  }

  init() {
    // 1. Arena Grid
    this.arenaGrid = new ArenaGrid({
      bots: BOTS,
      activeBots: this.activeBots,
      onToggleFocus: (botId) => this.focusSingleBot(botId)
    });

    // 2. Titlebar
    this.titlebar = new Titlebar({
      onLayoutChange: (layout) => this.handleLayoutChange(layout),
      initialLayout: 'hexa'
    });

    // 3. Navigation Strip
    this.botNav = new BotNav({
      bots: BOTS,
      activeBots: this.activeBots,
      onToggleBot: (botId) => this.toggleBot(botId),
      onReloadAll: () => this.arenaGrid.reloadVisibleBots(),
      onToggleAll: () => this.toggleAllBots(),
      onOpenCompare: () => this.compareModal.open(this.activeBots),
      onToggleSyncScroll: (active) => this.arenaGrid.setSyncScroll(active)
    });

    // 4. Prompt Dock
    this.promptDock = new PromptDock({
      bots: BOTS,
      broadcastTargets: this.broadcastTargets,
      onBroadcast: (text) => this.handleBroadcast(text),
      onTargetChange: (targets) => { this.broadcastTargets = targets; }
    });

    // 5. Compare Modal
    this.compareModal = new CompareModal({
      compareService: this.compareService,
      bots: BOTS
    });

    // 6. Global Shortcuts
    this.bindGlobalShortcuts();

    // Set initial layout
    this.handleLayoutChange('hexa');
  }

  handleLayoutChange(layout) {
    this.currentLayout = layout;
    this.titlebar.setLayout(layout);

    if (layout === 'hexa') {
      BOTS.forEach(b => this.activeBots.add(b.id));
      this.arenaGrid.setLayoutClass('layout-hexa');
    } else if (layout === '2x2') {
      if (this.activeBots.size < 4) {
        ['claude', 'deepseek', 'gemini', 'chatgpt'].forEach(id => this.activeBots.add(id));
      }
      this.arenaGrid.setLayoutClass('layout-2x2');
    } else if (layout === '1x2') {
      if (this.activeBots.size > 2) {
        const firstTwo = Array.from(this.activeBots).slice(0, 2);
        this.activeBots.clear();
        firstTwo.forEach(id => this.activeBots.add(id));
      }
      this.arenaGrid.setLayoutClass('layout-1x2');
    } else if (layout === '1x1' || layout === 'tabs') {
      const first = Array.from(this.activeBots)[0] || 'claude';
      this.activeBots.clear();
      this.activeBots.add(first);
      this.arenaGrid.setLayoutClass(layout === 'tabs' ? 'layout-tabs' : 'layout-1x1');
    }

    this.botNav.updatePillState(this.activeBots);
    this.arenaGrid.updateVisibility(this.activeBots);
  }

  toggleBot(botId) {
    if (this.activeBots.has(botId)) {
      if (this.activeBots.size > 1) {
        this.activeBots.delete(botId);
      }
    } else {
      this.activeBots.add(botId);
    }
    this.botNav.updatePillState(this.activeBots);
    this.arenaGrid.updateVisibility(this.activeBots);
  }

  toggleAllBots() {
    if (this.activeBots.size === BOTS.length) {
      this.activeBots.clear();
      this.activeBots.add('claude');
      this.activeBots.add('chatgpt');
    } else {
      BOTS.forEach(b => this.activeBots.add(b.id));
    }
    this.botNav.updatePillState(this.activeBots);
    this.arenaGrid.updateVisibility(this.activeBots);
  }

  focusSingleBot(botId) {
    this.activeBots.clear();
    this.activeBots.add(botId);
    this.handleLayoutChange('1x1');
  }

  async handleBroadcast(promptText) {
    this.promptDock.setStatus('⚡ Broadcasting to models...', 'warning');

    this.broadcastService.startBenchmark((elapsed) => {
      this.promptDock.setTimer(elapsed);
    });

    const result = await this.broadcastService.broadcastToBots({
      bots: BOTS,
      targetIds: this.broadcastTargets,
      promptText
    });

    setTimeout(() => {
      this.promptDock.setStatus(`Dispatched to ${result.successful}/${result.total} models`, 'success');
      setTimeout(() => {
        this.promptDock.setStatus('Ready', 'normal');
      }, 4000);
    }, 500);
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey) {
        if (e.key === '1') this.handleLayoutChange('1x1');
        if (e.key === '2') this.handleLayoutChange('1x2');
        if (e.key === '4') this.handleLayoutChange('2x2');
        if (e.key === '6') this.handleLayoutChange('hexa');
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          this.compareModal.open(this.activeBots);
        }
      }
    });
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  new ArenaApp();
});

