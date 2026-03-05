import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Carregar do localStorage ou usar 'light' como padrão
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const setTheme = (newTheme: Theme | ((current: Theme) => Theme)) => {
    const resolvedTheme = typeof newTheme === 'function' ? newTheme(theme) : newTheme;
    setThemeState(resolvedTheme);
    localStorage.setItem('app-theme', resolvedTheme);
  };

  const toggleTheme = () => {
    setTheme(current => current === 'light' ? 'dark' : 'light')
  }

  return {
    theme,
    setTheme,
    toggleTheme
  }
}