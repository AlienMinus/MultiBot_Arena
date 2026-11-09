// Response Comparison Modal Component (Clean SVGs & Export Support)
import { ICONS } from './Icons.js';

export class CompareModal {
  constructor({ compareService, bots }) {
    this.compareService = compareService;
    this.bots = bots;
    this.modal = null;
    this.init();
  }

  init() {
    this.createModalDOM();
  }

  createModalDOM() {
    const modal = document.createElement('div');
    modal.className = 'compare-modal-backdrop glass-backdrop hidden';
    modal.id = 'compare-modal';

    modal.innerHTML = `
      <div class="compare-modal-content glass-card">
        <div class="compare-modal-header glass-header">
          <div class="compare-header-title">
            <span class="scarlet-flame" style="color: var(--scarlet-core);">${ICONS.compare}</span>
            <h2>Response Comparison Arena</h2>
          </div>
          <div class="compare-header-actions">
            <button class="glass-btn" id="btn-export-compare" title="Export comparison as Markdown">
              ${ICONS.download} <span>Export</span>
            </button>
            <button class="glass-btn primary" id="btn-refresh-compare" title="Refresh response extraction">
              ${ICONS.reload} <span>Refresh</span>
            </button>
            <button class="glass-btn close-btn icon-only" id="btn-close-compare" title="Close">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <div class="compare-modal-body" id="compare-modal-body">
          <div class="compare-loading-state">
            <div class="liquid-spinner"></div>
            <p>Extracting latest model responses...</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    modal.querySelector('#btn-close-compare')?.addEventListener('click', () => this.hide());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hide();
    });
  }

  async open(activeBots, promptText = '') {
    this.modal.classList.remove('hidden');
    this.activeBots = activeBots;
    this.promptText = promptText;
    await this.fetchAndRender();

    const refreshBtn = this.modal.querySelector('#btn-refresh-compare');
    if (refreshBtn) refreshBtn.onclick = () => this.fetchAndRender();

    const exportBtn = this.modal.querySelector('#btn-export-compare');
    if (exportBtn) {
      exportBtn.onclick = () => {
        if (!this.lastExtractedData || this.lastExtractedData.length === 0) return;
        const md = this.compareService.exportToMarkdown(this.promptText, this.lastExtractedData);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Arena-Comparison-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }
  }

  hide() {
    this.modal.classList.add('hidden');
  }

  async fetchAndRender() {
    const body = this.modal.querySelector('#compare-modal-body');
    body.innerHTML = `
      <div class="compare-loading-state">
        <div class="liquid-spinner"></div>
        <p>Extracting responses across models...</p>
      </div>
    `;

    const data = await this.compareService.extractResponses(this.bots, this.activeBots);
    this.lastExtractedData = data;
    
    if (!data || data.length === 0) {
      body.innerHTML = `<div class="compare-empty-state">No active bots found to compare.</div>`;
      return;
    }

    body.innerHTML = `
      <div class="compare-grid" style="grid-template-columns: repeat(${Math.min(data.length, 3)}, 1fr);">
        ${data.map(item => `
          <div class="compare-column glass-panel" style="--col-color: ${item.color};">
            <div class="compare-col-header">
              <div class="col-title-wrap">
                <span class="col-icon" style="color: ${item.color};">${item.icon}</span>
                <span class="col-name" style="color: ${item.color}; font-weight: 600;">${item.name}</span>
                <span class="col-provider">${item.provider}</span>
              </div>
              <div class="col-meta">
                <span class="meta-tag">${item.wordCount} words</span>
                <button class="copy-btn mini-glass-btn icon-only" data-text="${encodeURIComponent(item.text)}" title="Copy text">
                  ${ICONS.copy}
                </button>
              </div>
            </div>

            <div class="compare-text-box ${item.hasContent ? '' : 'empty'}">
              <pre>${this.escapeHtml(item.text)}</pre>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Attach copy buttons
    body.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text);
        navigator.clipboard.writeText(text);
        btn.innerHTML = `<span style="color:#10b981; font-weight:bold;">✓</span>`;
        setTimeout(() => { btn.innerHTML = ICONS.copy; }, 1500);
      });
    });
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
