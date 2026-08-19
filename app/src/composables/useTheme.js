import { ref } from 'vue'
import { THEME_KEY } from './useChecklist'

export const themeIcon = ref('moon')

function currentEffectiveTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark' || attr === 'light') return attr
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function updateThemeIcon() {
  themeIcon.value = currentEffectiveTheme() === 'dark' ? 'sun' : 'moon'
}

export function toggleTheme() {
  const next = currentEffectiveTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch (e) {
    /* ignore */
  }
  updateThemeIcon()
}

export function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved)
    }
  } catch (e) {
    /* ignore */
  }
  updateThemeIcon()
}
