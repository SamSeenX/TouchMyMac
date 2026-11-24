// Toolbar component managing search, density layout, sorting and theme toggle

export function setupToolbar({ searchInput, densitySelect, sortSelect, themeToggleBtn, onSearch, onDensity, onSort }) {
  let debounceTimer = null

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      onSearch(searchInput.value.trim())
    }, 180)
  })

  // Density switcher
  const savedDensity = localStorage.getItem('saveit_density') || 'lg'
  densitySelect.value = savedDensity
  densitySelect.addEventListener('change', () => {
    const val = densitySelect.value
    localStorage.setItem('saveit_density', val)
    onDensity(val)
  })

  sortSelect.addEventListener('change', () => {
    onSort(sortSelect.value)
  })

  // Global keyboard shortcut: Cmd+K or Ctrl+K to focus search
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchInput.focus()
      searchInput.select()
    }
  })

  // Theme setup
  const savedTheme = localStorage.getItem('saveit_theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('saveit_theme', next)
  })

  return { currentDensity: savedDensity }
}
