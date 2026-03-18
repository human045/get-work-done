export const themes = {
  'purple-night': {
    name: 'Purple Night',
    dark: true,
    primary: '#d0bcff',
    surface: '#1c1b1f',
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    dark: true,
    primary: '#9ecaff',
    surface: '#1a1c1e',
  },
  'forest-green': {
    name: 'Forest Green',
    dark: true,
    primary: '#80db80',
    surface: '#191c19',
  },
  'sunset-red': {
    name: 'Sunset Red',
    dark: true,
    primary: '#ffb680',
    surface: '#1f1b16',
  },
  'github-dark': {
    name: 'GitHub Dark',
    dark: true,
    primary: '#58a6ff',
    surface: '#0d1117',
  },
  'daylight': {
    name: 'Daylight',
    dark: false,
    primary: '#6750a4',
    surface: '#fffbfe',
  },
  'mint-fresh': {
    name: 'Mint Fresh',
    dark: false,
    primary: '#1b6e35',
    surface: '#f4fbf4',
  },
};

export function applyTheme(themeName) {
  const theme = themes[themeName];
  if (!theme) return;
  // Set data-theme on html element — CSS handles the rest
  document.documentElement.setAttribute('data-theme', themeName);
  // Sync meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.surface);
}
