// Toolbar component managing search, sorting and theme toggle

export function setupToolbar({ searchInput, sortSelect, themeToggleBtn, onSearch, onSort }) {
  let debounceTimer = null

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      onSearch(searchInput.value.trim())
    }, 180)
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
}
