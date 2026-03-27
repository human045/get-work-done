export const LOCAL_PREFERENCES_KEY = 'gwd_preferences';

export const DEFAULT_PREFERENCES = {
  notebooksEnabled: true,
  notebookSocialsEnabled: false,
};

export function getLocalPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_PREFERENCES_KEY) || '{}');
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveLocalPreferences(nextPreferences) {
  const merged = { ...DEFAULT_PREFERENCES, ...nextPreferences };
  localStorage.setItem(LOCAL_PREFERENCES_KEY, JSON.stringify(merged));
  return merged;
}

export function getUserPreferences(myPoints) {
  return {
    notebooksEnabled: myPoints?.notebooksEnabled ?? DEFAULT_PREFERENCES.notebooksEnabled,
    notebookSocialsEnabled: myPoints?.notebookSocialsEnabled ?? DEFAULT_PREFERENCES.notebookSocialsEnabled,
  };
}
