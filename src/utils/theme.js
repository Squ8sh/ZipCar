const THEME_KEY = "zipcar-theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

function resolveTheme(theme) {
  return theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function readTheme() {
  if (typeof window === "undefined") return LIGHT_THEME;
  return resolveTheme(window.localStorage.getItem(THEME_KEY));
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return resolveTheme(theme);

  const nextTheme = resolveTheme(theme);
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(`${nextTheme}-mode`);
  document.body.setAttribute("data-theme", nextTheme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return nextTheme;
}

export const THEMES = {
  LIGHT: LIGHT_THEME,
  DARK: DARK_THEME,
};
