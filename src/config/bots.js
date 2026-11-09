// Bot Configuration Registry with Brand SVG Logos and Universal Framework Adapters
import { ICONS } from '../components/Icons.js';

// Universal Input Injector supporting React 16-19 (_valueTracker), Vue 3, Quill, ProseMirror & Vanilla DOM
function createUniversalInjector(botName, inputSelectors, sendSelectors) {
  return (promptText) => `
    (function() {
      try {
        // 1. Locate the active input element
        let input = null;
        const selectors = ${JSON.stringify(inputSelectors)};
        for (const sel of selectors) {
          try {
            const el = document.querySelector(sel);
            if (el && (el.offsetWidth > 0 || el.offsetHeight > 0)) {
              input = el;
              break;
            }
          } catch (_) {}
        }

        // Fallback: search all visible textareas, inputs, or contenteditables
        if (!input) {
          const allCandidates = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"]'));
          input = allCandidates.find(el => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled);
        }

        if (!input) {
          return { success: false, error: '${botName} input element not found' };
        }

        input.focus();

        // 2. Insert text via browser-native execCommand (simulates genuine user keystrokes)
        try {
          if (input.select) {
            input.select();
          } else {
            document.execCommand('selectAll', false, null);
          }
          document.execCommand('insertText', false, ${JSON.stringify(promptText)});
        } catch (_) {}

        // 3. Guarantee value assignment for React / Vue state trackers
        const isTextarea = input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input';
        if (isTextarea) {
          const prototype = Object.getPrototypeOf(input);
          const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set ||
                               Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (nativeSetter) {
            nativeSetter.call(input, ${JSON.stringify(promptText)});
          } else {
            input.value = ${JSON.stringify(promptText)};
          }

          // Reset React internal valueTracker so synthetic events are recognized
          if (input._valueTracker) {
            input._valueTracker.setValue('');
          }
        } else {
          // Contenteditable / Quill editors
          if (!input.textContent.trim()) {
            input.innerHTML = '<p>' + ${JSON.stringify(promptText)} + '</p>';
          }
        }

        // 4. Dispatch full event cascade required by modern frontend frameworks
        try {
          input.dispatchEvent(new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            composed: true,
            inputType: 'insertText',
            data: ${JSON.stringify(promptText)}
          }));
        } catch (_) {}

        try {
          input.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
            inputType: 'insertText',
            data: ${JSON.stringify(promptText)}
          }));
        } catch (_) {}

        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

        // Full pointer/mouse trigger helper (for React onPointerDown / onMouseDown listeners)
        function triggerClick(el) {
          if (!el) return;
          try {
            el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }));
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true }));
            el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, composed: true }));
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }));
            el.click();
          } catch (_) {
            try { el.click(); } catch (_) {}
          }
        }

        // 5. Multi-tick submission attempts to catch React state reconciliation transitions
        const form = input.closest('form');
        const buttonSelectors = ${JSON.stringify(sendSelectors)};

        const executeSubmitAttempt = () => {
          let submitted = false;

          // Attempt A: Match specific button selectors
          for (const sel of buttonSelectors) {
            try {
              const btn = document.querySelector(sel);
              if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
                triggerClick(btn);
                submitted = true;
                break;
              }
            } catch (_) {}
          }

          // Attempt B: Search for submit/arrow buttons inside container
          if (!submitted) {
            const container = form || input.closest('div[class*="border"]') || input.parentElement?.parentElement || document;
            const candidateBtns = Array.from(container.querySelectorAll('button, div[role="button"]'))
              .filter(b => !b.disabled && b.getAttribute('aria-disabled') !== 'true');

            // Find the button with an SVG or primary/blue background
            const sendBtn = candidateBtns.reverse().find(b => {
              const style = window.getComputedStyle(b);
              const bg = style.backgroundColor || '';
              const isBlue = bg.includes('rgb(59') || bg.includes('rgb(37') || bg.includes('rgb(29') || bg.includes('rgb(0');
              return isBlue || b.querySelector('svg') || b.type === 'submit';
            });

            if (sendBtn) {
              triggerClick(sendBtn);
              submitted = true;
            }
          }

          // Attempt C: HTML5 form.requestSubmit
          if (form && typeof form.requestSubmit === 'function') {
            try {
              form.requestSubmit();
              submitted = true;
            } catch (_) {}
          }

          // Attempt D: Enter keyboard event cascade (keydown, keypress, keyup)
          const keyOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true, composed: true };
          input.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
          input.dispatchEvent(new KeyboardEvent('keypress', keyOpts));
          input.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
        };

        // Multi-stage submission triggers at 120ms, 280ms, and 500ms
        setTimeout(executeSubmitAttempt, 120);
        setTimeout(executeSubmitAttempt, 280);
        setTimeout(executeSubmitAttempt, 550);

        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    })();
  `;
}

export const BOTS = [
  {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    url: 'https://claude.ai/new',
    homeUrl: 'https://claude.ai/new',
    partition: 'persist:claude',
    accentColor: '#e06847',
    glowColor: 'rgba(224, 104, 71, 0.35)',
    iconSvg: ICONS.claude,
    injectionScript: createUniversalInjector('Claude', [
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"]',
      'textarea'
    ], [
      'button[aria-label="Send Message"]',
      'button[aria-label*="Send"]',
      'button:has(svg)'
    ]),
    extractResponseScript: `
      (function() {
        try {
          const messages = document.querySelectorAll('.font-claude-message, [data-is-streaming], div.prose');
          if (!messages || messages.length === 0) return { success: false, text: 'No response captured.' };
          const last = messages[messages.length - 1];
          return { success: true, text: last.innerText || last.textContent || '' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })();
    `
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    homeUrl: 'https://chat.deepseek.com/',
    partition: 'persist:deepseek',
    accentColor: '#3d68ff',
    glowColor: 'rgba(61, 104, 255, 0.35)',
    iconSvg: ICONS.deepseek,
    injectionScript: createUniversalInjector('DeepSeek', [
      '#chat-input',
      'textarea[placeholder*="DeepSeek"]',
      'textarea[placeholder*="Message"]',
      'textarea'
    ], [
      'div[role="button"]:has(svg)',
      'div[class*="send"]:has(svg)',
      '.send-btn',
      'button[aria-label*="Send"]',
      'div[role="button"][aria-disabled="false"]'
    ]),
    extractResponseScript: `
      (function() {
        try {
          const messages = document.querySelectorAll('.ds-markdown, [class*="chat-message"]');
          if (!messages || messages.length === 0) return { success: false, text: 'No response captured.' };
          const last = messages[messages.length - 1];
          return { success: true, text: last.innerText || last.textContent || '' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })();
    `
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    url: 'https://gemini.google.com/app',
    homeUrl: 'https://gemini.google.com/app',
    partition: 'persist:gemini',
    accentColor: '#9366ff',
    glowColor: 'rgba(147, 102, 255, 0.35)',
    iconSvg: ICONS.gemini,
    injectionScript: createUniversalInjector('Gemini', [
      'rich-textarea div[contenteditable="true"]',
      '.ql-editor',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[aria-label*="prompt"]',
      'div[contenteditable="true"]',
      'textarea'
    ], [
      'button[aria-label*="Send message"]',
      'button[aria-label*="Send prompt"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
      '.send-button',
      'button.send-button-container',
      'button:has(mat-icon)',
      'rich-textarea + * button:has(svg)'
    ]),
    extractResponseScript: `
      (function() {
        try {
          const messages = document.querySelectorAll('message-content, .model-response-text');
          if (!messages || messages.length === 0) return { success: false, text: 'No response captured.' };
          const last = messages[messages.length - 1];
          return { success: true, text: last.innerText || last.textContent || '' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })();
    `
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'OpenAI',
    url: 'https://chatgpt.com/',
    homeUrl: 'https://chatgpt.com/',
    partition: 'persist:chatgpt',
    accentColor: '#10a37f',
    glowColor: 'rgba(16, 163, 127, 0.35)',
    iconSvg: ICONS.chatgpt,
    injectionScript: createUniversalInjector('ChatGPT', [
      '#prompt-textarea',
      'div[contenteditable="true"]',
      'textarea'
    ], [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label*="Send"]'
    ]),
    extractResponseScript: `
      (function() {
        try {
          const messages = document.querySelectorAll('div[data-message-author-role="assistant"]');
          if (!messages || messages.length === 0) return { success: false, text: 'No response captured.' };
          const last = messages[messages.length - 1];
          return { success: true, text: last.innerText || last.textContent || '' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })();
    `
  },
  {
    id: 'grok',
    name: 'Grok',
    provider: 'xAI',
    url: 'https://grok.com/',
    homeUrl: 'https://grok.com/',
    partition: 'persist:grok',
    accentColor: '#ff2d55',
    glowColor: 'rgba(255, 45, 85, 0.35)',
    iconSvg: ICONS.grok,
    injectionScript: createUniversalInjector('Grok', [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="anything"]',
      'textarea[placeholder*="Grok"]',
      'textarea',
      'div[contenteditable="true"]'
    ], [
      'button[aria-label*="Grok"]',
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'form button:has(svg)',
      'div[class*="border"] button:has(svg)',
      'button:has(svg:last-child)'
    ]),
    extractResponseScript: `
      (function() {
        try {
          const messages = document.querySelectorAll('[data-testid="tweetText"], .message-bubble, div[dir="auto"]');
          if (!messages || messages.length === 0) return { success: false, text: 'No response captured.' };
          const last = messages[messages.length - 1];
          return { success: true, text: last.innerText || last.textContent || '' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })();
    `
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    provider: 'Perplexity AI',
    url: 'https://www.perplexity.ai/',
    homeUrl: 'https://www.perplexity.ai/',
    partition: 'persist:perplexity',
    accentColor: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.35)',
    iconSvg: ICONS.perplexity,
    injectionScript: createUniversalInjector('Perplexity', [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="search"]',
      'textarea[placeholder*="Type"]',
      'textarea',
      'input[type="text"]',
      'div[contenteditable="true"]'
    ], [
      'button[aria-label="Submit"]',
      'button[aria-label*="Submit"]',
      'button[aria-label*="Search"]',
      'button[type="submit"]',
      'div[class*="submit"] button',
      'button:has(svg[data-icon="arrow-right"])',
      'button:has(svg path[d*="M"])'
    ]),
    extractResponseScript: `
      (function() {
        try {
          const messages = document.querySelectorAll('.prose, div[class*="answer"]');
          if (!messages || messages.length === 0) return { success: false, text: 'No response captured.' };
          const last = messages[messages.length - 1];
          return { success: true, text: last.innerText || last.textContent || '' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })();
    `
  }
];
