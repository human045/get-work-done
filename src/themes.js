export const themes = {
  'github-dark': {
    name: 'GitHub Dark',
    vars: {
      '--bg': '#0d1117',
      '--bg2': '#161b22',
      '--bg3': '#21262d',
      '--border': '#30363d',
      '--text': '#e6edf3',
      '--text2': '#8b949e',
      '--text3': '#6e7681',
      '--accent': '#58a6ff',
      '--accent2': '#1f6feb',
      '--star-active': '#f0883e',
      '--star-inactive': '#30363d',
      '--danger': '#f85149',
      '--success': '#3fb950',
      '--shadow': '0 4px 24px rgba(0,0,0,0.4)',
      '--radius': '8px',
    }
  },
  'dark': {
    name: 'Dark',
    vars: {
      '--bg': '#1a1a2e',
      '--bg2': '#16213e',
      '--bg3': '#0f3460',
      '--border': '#2d3561',
      '--text': '#eaeaea',
      '--text2': '#a8a8b3',
      '--text3': '#6c6c80',
      '--accent': '#7c85ff',
      '--accent2': '#4d5aff',
      '--star-active': '#ffbb38',
      '--star-inactive': '#2d3561',
      '--danger': '#ff6b6b',
      '--success': '#51cf66',
      '--shadow': '0 4px 24px rgba(0,0,0,0.45)',
      '--radius': '10px',
    }
  },
  'light': {
    name: 'Light',
    vars: {
      '--bg': '#f5f5f0',
      '--bg2': '#ffffff',
      '--bg3': '#efefea',
      '--border': '#ddddd5',
      '--text': '#1a1a1a',
      '--text2': '#555555',
      '--text3': '#999999',
      '--accent': '#2563eb',
      '--accent2': '#1d4ed8',
      '--star-active': '#f59e0b',
      '--star-inactive': '#ddddd5',
      '--danger': '#dc2626',
      '--success': '#16a34a',
      '--shadow': '0 4px 24px rgba(0,0,0,0.08)',
      '--radius': '10px',
    }
  }
};

export function applyTheme(themeName) {
  const theme = themes[themeName];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
