// Voice command parser
window.VoiceCommands = {
  parse(transcript) {
    const text = transcript.toLowerCase().trim();
    console.log('Voice command:', text);

    // Timer commands
    const timerMatch = text.match(/(?:set\s+(?:a\s+)?timer\s+(?:for\s+)?|timer\s+)(\d+)\s*(minute|min|hour|hr|second|sec)s?/);
    if (timerMatch) {
      let minutes = parseInt(timerMatch[1]);
      const unit = timerMatch[2];
      if (unit.startsWith('hour') || unit.startsWith('hr')) minutes *= 60;
      if (unit.startsWith('second') || unit.startsWith('sec')) minutes = Math.max(1, Math.round(minutes / 60));
      return { type: 'timer', minutes, label: `${timerMatch[1]} ${unit} timer` };
    }

    // Recipe search
    const recipeMatch = text.match(/(?:search|find|look up|show me)\s+(?:a\s+)?(?:recipe\s+(?:for\s+)?)?(.+?)(?:\s+recipe)?$/);
    if (recipeMatch || text.includes('recipe')) {
      const query = recipeMatch
        ? recipeMatch[1].replace(/\s+recipe$/, '')
        : text.replace(/recipe/g, '').trim();
      if (query) return { type: 'recipe', query };
    }

    // Light controls
    const lightOnMatch = text.match(/turn\s+on\s+(?:the\s+)?(.+?)(?:\s+light)?s?$/);
    if (lightOnMatch) {
      const name = lightOnMatch[1].replace(/\s+lights?$/, '');
      if (name === 'all' || name === 'everything') return { type: 'lights_all', action: 'on' };
      return { type: 'light', name, action: 'on' };
    }

    const lightOffMatch = text.match(/turn\s+off\s+(?:the\s+)?(.+?)(?:\s+light)?s?$/);
    if (lightOffMatch) {
      const name = lightOffMatch[1].replace(/\s+lights?$/, '');
      if (name === 'all' || name === 'everything') return { type: 'lights_all', action: 'off' };
      return { type: 'light', name, action: 'off' };
    }

    // Navigation
    if (text.includes('show') || text.includes('go to') || text.includes('open')) {
      if (text.includes('calendar') || text.includes('schedule')) return { type: 'navigate', panel: 1 };
      if (text.includes('camera')) return { type: 'navigate', panel: 2 };
      if (text.includes('control') || text.includes('light') || text.includes('music')) return { type: 'navigate', panel: 3 };
      if (text.includes('stock') || text.includes('market')) return { type: 'navigate', panel: 4 };
      if (text.includes('recipe') || text.includes('cook')) return { type: 'navigate', panel: 5 };
      if (text.includes('timer')) return { type: 'navigate', panel: 6 };
      if (text.includes('home')) return { type: 'navigate', panel: 0 };
    }

    // Calendar query
    if (text.includes('what\'s on my calendar') || text.includes('what do i have') || text.includes('my schedule')) {
      return { type: 'navigate', panel: 1 };
    }

    return { type: 'unknown', text };
  },

  async execute(command) {
    switch (command.type) {
      case 'timer':
        window.TimersWidget.addTimer(command.minutes, command.label);
        window.App.showFeedback(`Timer set for ${command.minutes} minute${command.minutes !== 1 ? 's' : ''}`);
        break;

      case 'recipe':
        window.App.goToPanel(5);
        window.RecipesWidget.search(command.query);
        break;

      case 'light':
        const found = await window.LightsWidget.controlByName(command.name, command.action);
        if (found) {
          window.App.showFeedback(`${command.name} turned ${command.action}`);
        } else {
          window.App.showFeedback(`Couldn't find light: ${command.name}`);
        }
        break;

      case 'lights_all':
        if (command.action === 'on') await window.LightsWidget.turnOnAll();
        else await window.LightsWidget.turnOffAll();
        window.App.showFeedback(`All lights turned ${command.action}`);
        break;

      case 'navigate':
        window.App.goToPanel(command.panel);
        break;

      case 'unknown':
        window.App.showFeedback("Sorry, I didn't understand that");
        break;
    }
  },
};
