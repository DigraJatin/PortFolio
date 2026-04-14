/**
 * =============================================================================
 * BLOG.JS - Blog Rendering and Markdown Parsing
 * =============================================================================
 * Handles:
 * - Simple markdown to HTML conversion
 * - Loading blog posts from .md files
 * - Basic syntax highlighting for code blocks
 * 
 * This is a simple, hand-rolled markdown parser.
 * For a production site, you might use a library like marked.js,
 * but this gives you full control and understanding of what's happening.
 * =============================================================================
 */

/**
 * Blog data structure.
 * In a real app, this might come from a database or CMS.
 * For simplicity, we define the blog index here.
 * 
 * Structure is similar to a C++ struct - just key-value pairs
 */
const blogIndex = {
    'cpp': {
        name: 'C++',
        posts: [
            {
                slug: 'understanding-move-semantics',
                title: 'Understanding Move Semantics in Modern C++',
                date: '2024-12-15',
                excerpt: 'A deep dive into lvalues, rvalues, move semantics, rvalue references, and std::move in C++11 and beyond.'
            }
        ]
    }
};


/**
 * Fetches and renders a blog post from a markdown file.
 * 
 * @param {string} category - Blog category folder (e.g., 'cpp', 'systems')
 * @param {string} slug - Post filename without extension
 * @param {string} containerId - ID of the container element to render into
 */
async function loadBlogPost(category, slug, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container element not found:', containerId);
        return;
    }

    container.innerHTML = '<p class="text-muted">Loading...</p>';

    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}/blogs/${category}/${slug}.md`);

        if (!response.ok) {
            throw new Error(`Failed to load blog post: ${response.status}`);
        }

        const markdown = await response.text();

        // Use marked.js for reliable markdown rendering
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                gfm: true,
                breaks: false
            });
            container.innerHTML = marked.parse(markdown);
        } else {
            // Fallback: render raw markdown in a <pre> block
            container.innerHTML = '<pre style="white-space: pre-wrap;">' + markdown.replace(/</g, '&lt;') + '</pre>';
        }

    } catch (error) {
        console.error('Error loading blog post:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Failed to load blog post.</p>
                <p class="text-muted text-sm">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}


/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(text) {
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, function (char) {
        return escapeMap[char];
    });
}


/**
 * Gets the base path for loading resources.
 * Handles both root-level pages and pages in subdirectories.
 */
function getBasePath() {
    const path = window.location.pathname;
    // If we're in a subdirectory (pages/), go up one level
    if (path.includes('/pages/')) {
        return '..';
    }
    return '.';
}


/**
 * Renders the blog listing from the blogIndex.
 * Call this on the blogs.html page.
 * 
 * @param {string} containerId - ID of the container element
 */
function renderBlogList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    // Iterate over categories
    Object.keys(blogIndex).forEach(function (categorySlug) {
        const category = blogIndex[categorySlug];

        html += `
            <div class="blog-category">
                <h3>${category.name}</h3>
                <ul class="blog-list">
        `;

        // Iterate over posts in this category
        category.posts.forEach(function (post) {
            html += `
                <li class="blog-item">
                    <a href="blog-post.html?category=${categorySlug}&slug=${post.slug}" class="blog-title">
                        ${post.title}
                    </a>
                    <div class="blog-meta">${formatDate(post.date)}</div>
                    <p class="blog-excerpt">${post.excerpt}</p>
                </li>
            `;
        });

        html += '</ul></div>';
    });

    container.innerHTML = html;
}


/**
 * Formats a date string to a readable format.
 * 
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date (e.g., "December 15, 2024")
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}


/**
 * Initializes the blog post page.
 * Reads category and slug from URL parameters and loads the post.
 */
function initBlogPost() {
    // Parse URL query parameters
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const slug = params.get('slug');

    if (!category || !slug) {
        document.getElementById('blog-content').innerHTML = `
            <p class="text-muted">No blog post specified.</p>
            <p><a href="blogs.html">← Back to all posts</a></p>
        `;
        return;
    }

    // Find post info from index
    const categoryData = blogIndex[category];
    const post = categoryData ? categoryData.posts.find(p => p.slug === slug) : null;

    if (post) {
        // Update page title
        document.title = post.title + ' | Jatin';
        document.getElementById('blog-title').textContent = post.title;
        document.getElementById('blog-date').textContent = formatDate(post.date);
    }

    // Load the markdown content
    loadBlogPost(category, slug, 'blog-content');
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadBlogPost,
        parseMarkdown,
        renderBlogList,
        initBlogPost
    };
}
