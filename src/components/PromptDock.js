// Master Prompt Dock Component (Vector Icons & Clean Tooltips)
import { ICONS } from './Icons.js';

export class PromptDock {
  constructor({ bots, broadcastTargets, onBroadcast, onTargetChange }) {
    this.bots = bots;
    this.broadcastTargets = broadcastTargets;
    this.onBroadcast = onBroadcast;
    this.onTargetChange = onTargetChange;

    this.container = document.getElementById('bottom-dock');
    this.targetContainer = document.getElementById('target-checkboxes');
    this.masterInput = document.getElementById('master-prompt-input');
    this.btnBroadcast = document.getElementById('btn-broadcast');
    this.btnClear = document.getElementById('btn-clear');
    this.presetSelect = document.getElementById('preset-select');
    this.statStatus = document.getElementById('stat-status');
    this.statTimer = document.getElementById('stat-timer');

    this.promptHistory = JSON.parse(localStorage.getItem('arena_prompt_history') || '[]');

    this.init();
  }

  init() {
    // Populate SVGs into buttons
    if (this.btnBroadcast) {
      this.btnBroadcast.innerHTML = `${ICONS.broadcast} <span>Broadcast</span>`;
    }
    if (this.btnClear) {
      this.btnClear.innerHTML = ICONS.clear;
      this.btnClear.title = 'Clear prompt';
    }

    this.renderTargets();
    this.bindEvents();
  }

  renderTargets() {
    if (!this.targetContainer) return;
    this.targetContainer.innerHTML = '';

    this.bots.forEach(bot => {
      const label = document.createElement('label');
      label.className = 'target-check glass-check';
      label.title = `Broadcast target: ${bot.name}`;
      label.innerHTML = `
        <input type="checkbox" id="check-${bot.id}" ${this.broadcastTargets.has(bot.id) ? 'checked' : ''}>
        <span class="custom-checkbox"></span>
        <span class="target-brand-icon" style="color: ${bot.accentColor};">${bot.iconSvg}</span>
        <span class="target-name" style="color: ${bot.accentColor}; font-weight: 600;">${bot.name}</span>
      `;

      const input = label.querySelector('input');
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.broadcastTargets.add(bot.id);
        } else {
          this.broadcastTargets.delete(bot.id);
        }
        if (this.onTargetChange) this.onTargetChange(this.broadcastTargets);
      });

      this.targetContainer.appendChild(label);
    });
  }

  bindEvents() {
    this.btnBroadcast?.addEventListener('click', () => this.handleBroadcast());

    this.btnClear?.addEventListener('click', () => {
      this.masterInput.value = '';
      this.masterInput.focus();
      this.statTimer.innerHTML = `${ICONS.timer} <span>0.0s</span>`;
      this.statStatus.textContent = 'Ready';
      this.statStatus.className = 'stat-pill';
    });

    this.presetSelect?.addEventListener('change', () => {
      if (this.presetSelect.value) {
        this.masterInput.value = this.presetSelect.value;
        this.masterInput.focus();
        this.autoResizeInput();
      }
    });

    this.masterInput?.addEventListener('input', () => this.autoResizeInput());

    // Prompt history navigation via ArrowUp / ArrowDown
    this.historyIndex = -1;
    this.masterInput?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && (this.masterInput.selectionStart === 0 || !this.masterInput.value)) {
        if (this.promptHistory.length > 0 && this.historyIndex < this.promptHistory.length - 1) {
          e.preventDefault();
          this.historyIndex++;
          this.masterInput.value = this.promptHistory[this.historyIndex];
          this.autoResizeInput();
        }
      } else if (e.key === 'ArrowDown' && this.historyIndex >= 0) {
        e.preventDefault();
        this.historyIndex--;
        if (this.historyIndex >= 0) {
          this.masterInput.value = this.promptHistory[this.historyIndex];
        } else {
          this.masterInput.value = '';
        }
        this.autoResizeInput();
      }
    });

    // Shortcuts: Ctrl + Enter
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.handleBroadcast();
      }
    });
  }

  autoResizeInput() {
    if (!this.masterInput) return;
    this.masterInput.style.height = 'auto';
    this.masterInput.style.height = Math.min(140, Math.max(48, this.masterInput.scrollHeight)) + 'px';
  }

  handleBroadcast() {
    const text = this.masterInput.value.trim();
    if (!text) return;

    this.historyIndex = -1;
    this.promptHistory.unshift(text);
    if (this.promptHistory.length > 20) this.promptHistory.pop();
    localStorage.setItem('arena_prompt_history', JSON.stringify(this.promptHistory));

    if (this.onBroadcast) this.onBroadcast(text);
  }

  setStatus(message, type = 'normal') {
    if (!this.statStatus) return;
    this.statStatus.textContent = message;
    this.statStatus.className = `stat-pill status-${type}`;
  }

  setTimer(elapsed) {
    if (this.statTimer) {
      this.statTimer.innerHTML = `${ICONS.timer} <span>${elapsed}s</span>`;
    }
  }
}
