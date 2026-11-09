// Titlebar Component (Clean Vector Icons & Minimal Text)
import { ICONS } from './Icons.js';

export class Titlebar {
  constructor({ onLayoutChange, initialLayout = 'hexa' }) {
    this.onLayoutChange = onLayoutChange;
    this.currentLayout = initialLayout;

    this.btnMinimize = document.getElementById('btn-minimize');
    this.btnMaximize = document.getElementById('btn-maximize');
    this.btnClose = document.getElementById('btn-close');
    this.layoutGroup = document.getElementById('layout-btn-group');
    
    this.init();
  }

  init() {
    // Populate SVGs into Window controls
    if (this.btnMinimize) this.btnMinimize.innerHTML = ICONS.minimize;
    if (this.btnMaximize) this.btnMaximize.innerHTML = ICONS.maximize;
    if (this.btnClose) this.btnClose.innerHTML = ICONS.close;

    // Window control bindings
    if (window.electronAPI) {
      this.btnMinimize?.addEventListener('click', () => window.electronAPI.minimizeWindow());
      this.btnMaximize?.addEventListener('click', () => window.electronAPI.maximizeWindow());
      this.btnClose?.addEventListener('click', () => window.electronAPI.closeWindow());

      window.electronAPI.onMaximizeChange?.((isMaximized) => {
        if (this.btnMaximize) {
          this.btnMaximize.innerHTML = isMaximized ? ICONS.restore : ICONS.maximize;
        }
      });
    }

    // Render Layout Buttons with SVG icons & tooltips (Minimal text)
    if (this.layoutGroup) {
      this.layoutGroup.innerHTML = `
        <button class="layout-btn ${this.currentLayout === '1x1' ? 'active' : ''}" data-layout="1x1" title="Focus (1x1) • Alt+1">
          ${ICONS.layoutFocus}
        </button>
        <button class="layout-btn ${this.currentLayout === '1x2' ? 'active' : ''}" data-layout="1x2" title="Duel (1x2) • Alt+2">
          ${ICONS.layoutDuel}
        </button>
        <button class="layout-btn ${this.currentLayout === '2x2' ? 'active' : ''}" data-layout="2x2" title="Quad (2x2) • Alt+4">
          ${ICONS.layoutQuad}
        </button>
        <button class="layout-btn ${this.currentLayout === 'hexa' ? 'active' : ''}" data-layout="hexa" title="Hexa 6-Grid (2x3) • Alt+6">
          ${ICONS.layoutHexa}
        </button>
        <button class="layout-btn ${this.currentLayout === 'tabs' ? 'active' : ''}" data-layout="tabs" title="Tabs View">
          ${ICONS.layoutTabs}
        </button>
      `;

      this.layoutGroup.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const layout = btn.dataset.layout;
          this.setLayout(layout);
          if (this.onLayoutChange) this.onLayoutChange(layout);
        });
      });
    }
  }

  setLayout(layoutName) {
    this.currentLayout = layoutName;
    if (this.layoutGroup) {
      this.layoutGroup.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layout === layoutName);
      });
    }
  }
}
