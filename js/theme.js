/**
 * =============================================================================
 * THEME.JS - Dark/Light Mode Toggle
 * =============================================================================
 * Handles theme switching and persists preference in localStorage.
 * =============================================================================
 */

/**
 * Initialize theme on page load
 * Checks localStorage for saved preference, defaults to dark
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Create theme toggle button if not exists
    createThemeToggle();
}


/**
 * Set the theme and update UI
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update toggle button icon
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('.theme-toggle-icon');

        if (theme === 'dark') {
            icon.textContent = '☀️';
            toggleBtn.title = 'Switch to Light Mode';
        } else {
            icon.textContent = '🌙';
            toggleBtn.title = 'Switch to Dark Mode';
        }
    }
}


/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}


/**
 * Create theme toggle button in sidebar footer
 */
function createThemeToggle() {
    // Remove existing toggle if present
    const existing = document.getElementById('theme-toggle');
    if (existing) existing.remove();

    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.className = 'theme-toggle floating-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');

    const currentTheme = localStorage.getItem('theme') || 'dark';
    toggle.title = currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    toggle.innerHTML = `
        <span class="theme-toggle-icon">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
    `;

    toggle.addEventListener('click', toggleTheme);
    document.body.appendChild(toggle);
}


// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initTheme);


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initTheme, setTheme, toggleTheme };
}
