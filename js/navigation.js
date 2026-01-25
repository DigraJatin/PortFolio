/**
 * =============================================================================
 * NAVIGATION.JS - Sidebar and Navigation Logic
 * =============================================================================
 * Handles:
 * - Active page highlighting based on current URL
 * - Collapsible folder tree for blog navigation
 * - Mobile menu toggle
 * 
 * This is vanilla JavaScript - no frameworks, no magic.
 * Think of it like C++ without templates: straightforward and readable.
 * =============================================================================
 */

// Wait for DOM to be fully loaded before running scripts
// Similar to main() in C++ - this is our entry point
document.addEventListener('DOMContentLoaded', function () {
    initActiveNavigation();
    initFolderTree();
    initMobileMenu();
});


/**
 * Highlights the current page in the sidebar navigation.
 * 
 * How it works:
 * 1. Get the current page filename from the URL
 * 2. Find all nav links
 * 3. Compare each link's href with current page
 * 4. Add 'active' class to matching link
 */
function initActiveNavigation() {
    // Get current page path (e.g., "/pages/blogs.html" or "/index.html")
    const currentPath = window.location.pathname;

    // Extract just the filename (e.g., "blogs.html" or "index.html")
    // Split by '/' and get the last part
    let currentPage = pathParts[pathParts.length - 1] || 'index.html';

    // Normalize empty or root path to index.html for matching logic
    if (currentPage === '' || currentPage === '/') {
        currentPage = 'index.html';
    }

    // Find all navigation links
    const navLinks = document.querySelectorAll('.nav-link');

    // Iterate through links and mark the active one
    navLinks.forEach(function (link) {
        const href = link.getAttribute('href');

        // Extract filename from href
        const hrefParts = href.split('/');
        let linkPage = hrefParts[hrefParts.length - 1];

        // Normalize linkPage (e.g., if href is "../" or "./")
        if (linkPage === '' || linkPage === '.') {
            linkPage = 'index.html';
        }

        // Check if this link matches current page
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}


/**
 * Initializes the collapsible folder tree for blog categories.
 * 
 * Behavior:
 * - Click on folder header → toggles folder open/closed
 * - Uses CSS classes to control visibility (no inline styles)
 * 
 * This is similar to a simple state machine:
 * State 0 (closed) ←→ State 1 (open)
 */
function initFolderTree() {
    // Find all folder headers (clickable parts)
    const folderHeaders = document.querySelectorAll('.folder-header');

    folderHeaders.forEach(function (header) {
        header.addEventListener('click', function () {
            // Find the parent folder-item element
            // 'this' refers to the header that was clicked
            const folderItem = this.parentElement;

            // Toggle the 'open' class
            // classList.toggle returns true if class was added, false if removed
            folderItem.classList.toggle('open');

            // Optional: Update aria-expanded for accessibility
            const isOpen = folderItem.classList.contains('open');
            this.setAttribute('aria-expanded', isOpen);
        });
    });
}


/**
 * Handles mobile menu toggle.
 * 
 * On mobile screens:
 * - Sidebar is hidden by default (off-screen)
 * - Menu button toggles sidebar visibility
 * - Clicking outside closes the sidebar
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    // Safety check - elements might not exist on all pages
    if (!menuToggle || !sidebar) {
        return;
    }

    // Toggle sidebar when menu button is clicked
    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');

        // Update button text/icon based on state
        const isOpen = sidebar.classList.contains('open');
        this.textContent = isOpen ? '✕' : '☰';
        this.setAttribute('aria-expanded', isOpen);
    });

    // Close sidebar when clicking on main content (mobile only)
    if (mainContent) {
        mainContent.addEventListener('click', function () {
            // Only close if sidebar is open and we're on mobile
            if (sidebar.classList.contains('open') && window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                menuToggle.textContent = '☰';
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Close sidebar when window is resized to desktop size
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            menuToggle.textContent = '☰';
        }
    });
}


/**
 * Utility: Smooth scroll to element by ID.
 * Can be called from onclick handlers if needed.
 * 
 * @param {string} elementId - The ID of the element to scroll to
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}


// Export functions for potential use in other scripts
// This pattern is similar to header files in C++ - declaring what's public
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initActiveNavigation,
        initFolderTree,
        initMobileMenu,
        scrollToElement
    };
}
