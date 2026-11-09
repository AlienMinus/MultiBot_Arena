// Root CommonJS bridge for Electron main process
const BOTS = [
  { id: 'claude', partition: 'persist:claude' },
  { id: 'deepseek', partition: 'persist:deepseek' },
  { id: 'gemini', partition: 'persist:gemini' },
  { id: 'chatgpt', partition: 'persist:chatgpt' },
  { id: 'grok', partition: 'persist:grok' },
  { id: 'perplexity', partition: 'persist:perplexity' }
];

module.exports = { BOTS };
