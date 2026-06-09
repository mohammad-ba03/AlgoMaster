export function initTheme() {
  const body = document.body
  const themeBtn = document.getElementById('theme-toggle')
  const navbar = document.querySelector('.navbar')

  if (!themeBtn) return

  const icon = themeBtn.querySelector('i')

  // Load saved theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    body.setAttribute('data-theme', savedTheme)
    updateIcon(savedTheme)
  }

  // Toggle theme
  themeBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

    body.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    updateIcon(newTheme)
  })

  function updateIcon(theme) {
    if (!icon) return

    if (theme === 'light') {
      icon.classList.remove('fa-sun')
      icon.classList.add('fa-moon')
    } else {
      icon.classList.remove('fa-moon')
      icon.classList.add('fa-sun')
    }
  }

  // Navbar blur on scroll
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow =
        window.scrollY > 10
          ? '0 4px 30px rgba(0,0,0,0.05)'
          : 'none'
    })
  }
}
