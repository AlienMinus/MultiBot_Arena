// Prompt Broadcasting Service with Latency Benchmarking

export class BroadcastService {
  constructor() {
    this.timerInterval = null;
    this.startTime = null;
  }

  startBenchmark(onTick) {
    this.startTime = Date.now();
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      onTick(elapsed);
    }, 100);
  }

  stopBenchmark() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async broadcastToBots({ bots, targetIds, promptText, onProgress }) {
    if (!promptText || !promptText.trim()) return { success: false, error: 'Empty prompt' };

    const selectedBots = bots.filter(b => targetIds.has(b.id));

    // Parallel simultaneous dispatch across all webviews
    const dispatchPromises = selectedBots.map(async (bot) => {
      const webview = document.getElementById(`webview-${bot.id}`);
      if (!webview) {
        return { id: bot.id, name: bot.name, success: false, error: 'Webview not found' };
      }

      try {
        const script = bot.injectionScript(promptText);
        const res = await webview.executeJavaScript(script);
        return { id: bot.id, name: bot.name, success: res?.success !== false, error: res?.error };
      } catch (err) {
        return { id: bot.id, name: bot.name, success: false, error: err.message };
      }
    });

    const results = await Promise.all(dispatchPromises);
    if (onProgress) onProgress(results);

    return {
      success: true,
      total: selectedBots.length,
      successful: results.filter(r => r.success).length,
      results
    };
  }
}

