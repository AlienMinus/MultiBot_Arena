// Response Extraction, Diff Computation & Export Service

export class CompareService {
  async extractResponses(bots, activeIds) {
    const activeBots = bots.filter(b => activeIds.has(b.id));
    const extractedData = [];

    for (const bot of activeBots) {
      const webview = document.getElementById(`webview-${bot.id}`);
      if (!webview) continue;

      try {
        const result = await webview.executeJavaScript(bot.extractResponseScript);
        const text = result?.text || '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;

        extractedData.push({
          id: bot.id,
          name: bot.name,
          provider: bot.provider,
          color: bot.accentColor,
          icon: bot.iconSvg,
          text: text,
          wordCount,
          charCount,
          hasContent: Boolean(text && text !== 'No response found yet.')
        });
      } catch (err) {
        extractedData.push({
          id: bot.id,
          name: bot.name,
          provider: bot.provider,
          color: bot.accentColor,
          icon: bot.iconSvg,
          text: `Extraction error: ${err.message}`,
          wordCount: 0,
          charCount: 0,
          hasContent: false
        });
      }
    }

    return extractedData;
  }

  // Generate word-level comparison diff between model A and model B
  computeWordDiff(textA, textB) {
    const wordsA = textA.split(/\s+/);
    const wordsB = textB.split(/\s+/);

    const setB = new Set(wordsB);
    const setA = new Set(wordsA);

    const diffA = wordsA.map(w => ({
      word: w,
      type: setB.has(w) ? 'common' : 'removed'
    }));

    const diffB = wordsB.map(w => ({
      word: w,
      type: setA.has(w) ? 'common' : 'added'
    }));

    return { diffA, diffB };
  }

  // Export current comparison session to clean Markdown
  exportToMarkdown(promptText, responses) {
    let md = `# Multi-Bot Arena Comparison\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Prompt:**\n> ${promptText || 'No prompt specified'}\n\n---\n\n`;

    responses.forEach(r => {
      md += `## ${r.icon} ${r.name} (${r.provider})\n`;
      md += `*Metrics: ${r.wordCount} words | ${r.charCount} characters*\n\n`;
      md += `${r.text || 'No response captured.'}\n\n---\n\n`;
    });

    return md;
  }
}
