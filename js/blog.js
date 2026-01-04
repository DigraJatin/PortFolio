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
                excerpt: 'A deep dive into move semantics, rvalue references, and how they improve performance in C++11 and beyond.'
            },
            {
                slug: 'smart-pointers-guide',
                title: 'A Practical Guide to Smart Pointers',
                date: '2024-11-20',
                excerpt: 'When to use unique_ptr, shared_ptr, and weak_ptr - with real-world examples.'
            }
        ]
    },
    'systems': {
        name: 'Systems Programming',
        posts: [
            {
                slug: 'windows-debugging-with-windbg',
                title: 'Windows Debugging with WinDBG',
                date: '2024-12-01',
                excerpt: 'Essential WinDBG commands and techniques for debugging Windows applications and crash dumps.'
            },
            {
                slug: 'understanding-windows-processes',
                title: 'Understanding Windows Process Architecture',
                date: '2024-10-15',
                excerpt: 'How processes work on Windows: from creation to termination.'
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

    // Show loading state
    container.innerHTML = '<p class="text-muted">Loading...</p>';

    try {
        // Construct the path to the markdown file
        // Note: This works when served from a web server
        // For local file:// URLs, you'll need a different approach
        const basePath = getBasePath();
        const response = await fetch(`${basePath}/blogs/${category}/${slug}.md`);

        if (!response.ok) {
            throw new Error(`Failed to load blog post: ${response.status}`);
        }

        const markdown = await response.text();
        const html = parseMarkdown(markdown);
        container.innerHTML = html;

        // Apply syntax highlighting to code blocks
        highlightCodeBlocks();

    } catch (error) {
        console.error('Error loading blog post:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Failed to load blog post.</p>
                <p class="text-muted text-sm">${error.message}</p>
            </div>
        `;
    }
}


/**
 * Simple markdown parser.
 * Converts a subset of markdown to HTML.
 * 
 * Supported syntax:
 * - # Headings (h1-h6)
 * - **bold** and *italic*
 * - `inline code`
 * - ```code blocks```
 * - [links](url)
 * - - unordered lists
 * - Paragraphs (blank line separated)
 * 
 * This is intentionally simple. For complex markdown,
 * consider using a library like marked.js
 * 
 * @param {string} markdown - Raw markdown text
 * @returns {string} - HTML string
 */
function parseMarkdown(markdown) {
    let html = markdown;

    // Normalize line endings (Windows uses \r\n, Unix uses \n)
    html = html.replace(/\r\n/g, '\n');

    // Step 1: Extract and preserve code blocks first
    // This prevents other rules from mangling code content
    const codeBlocks = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function (match, language, code) {
        const index = codeBlocks.length;
        codeBlocks.push({ language, code: escapeHtml(code.trim()) });
        return `__CODE_BLOCK_${index}__`;
    });

    // Step 2: Escape HTML in remaining content (security)
    // But we'll do this selectively to allow our own HTML

    // Step 3: Headers (must come before paragraph processing)
    // Match lines starting with 1-6 # symbols
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Step 4: Bold and italic
    // **bold** or __bold__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // *italic* or _italic_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Step 5: Inline code (backticks)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Step 6: Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Step 7: Unordered lists
    // Find consecutive lines starting with - and wrap in <ul>
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Step 8: Paragraphs
    // Split by double newlines and wrap non-special content in <p>
    const lines = html.split('\n\n');
    html = lines.map(function (block) {
        block = block.trim();
        // Don't wrap if already has block-level HTML or is a code block placeholder
        if (block.startsWith('<h') ||
            block.startsWith('<ul') ||
            block.startsWith('<p') ||
            block.startsWith('__CODE_BLOCK_')) {
            return block;
        }
        // Replace single newlines with <br> within paragraphs
        block = block.replace(/\n/g, '<br>');
        return block ? '<p>' + block + '</p>' : '';
    }).join('\n');

    // Step 9: Restore code blocks
    codeBlocks.forEach(function (block, index) {
        const languageClass = block.language ? `language-${block.language}` : '';
        const codeHtml = `<pre><code class="${languageClass}">${block.code}</code></pre>`;
        html = html.replace(`__CODE_BLOCK_${index}__`, codeHtml);
    });

    return html;
}


/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Similar to how you'd sanitize input in C++.
 * 
 * @param {string} text - Raw text
 * @returns {string} - Escaped HTML
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
 * Applies basic syntax highlighting to code blocks.
 * 
 * This is a simple regex-based highlighter.
 * For production, consider using Prism.js or highlight.js
 */
function highlightCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code');

    codeBlocks.forEach(function (block) {
        let code = block.innerHTML;

        // Detect language from class (e.g., 'language-cpp')
        const languageClass = block.className.match(/language-(\w+)/);
        const language = languageClass ? languageClass[1] : '';

        // Apply highlighting based on language
        if (language === 'cpp' || language === 'c' || language === 'csharp') {
            code = highlightCppLike(code);
        } else if (language === 'python') {
            code = highlightPython(code);
        } else if (language === 'javascript' || language === 'js') {
            code = highlightJavaScript(code);
        }

        block.innerHTML = code;
    });
}


/**
 * Highlights C-like syntax (C, C++, C#)
 */
function highlightCppLike(code) {
    // Keywords
    const keywords = [
        'auto', 'break', 'case', 'catch', 'class', 'const', 'continue',
        'default', 'delete', 'do', 'else', 'enum', 'explicit', 'extern',
        'false', 'for', 'friend', 'goto', 'if', 'inline', 'namespace',
        'new', 'nullptr', 'operator', 'private', 'protected', 'public',
        'return', 'sizeof', 'static', 'struct', 'switch', 'template',
        'this', 'throw', 'true', 'try', 'typedef', 'typename', 'union',
        'using', 'virtual', 'void', 'volatile', 'while', 'override', 'final',
        'constexpr', 'noexcept', 'static_cast', 'dynamic_cast', 'reinterpret_cast',
        'const_cast', 'std', 'move', 'forward', 'make_unique', 'make_shared'
    ];

    // Types
    const types = [
        'int', 'char', 'bool', 'float', 'double', 'long', 'short',
        'unsigned', 'signed', 'size_t', 'string', 'vector', 'map',
        'unique_ptr', 'shared_ptr', 'weak_ptr', 'optional', 'variant'
    ];

    // Comments (// and /* */)
    code = code.replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>');

    // Strings
    code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="code-string">$1</span>');

    // Numbers
    code = code.replace(/\b(\d+\.?\d*[fFL]?)\b/g, '<span class="code-number">$1</span>');

    // Keywords
    keywords.forEach(function (keyword) {
        const regex = new RegExp('\\b(' + keyword + ')\\b', 'g');
        code = code.replace(regex, '<span class="code-keyword">$1</span>');
    });

    // Types
    types.forEach(function (type) {
        const regex = new RegExp('\\b(' + type + ')\\b', 'g');
        code = code.replace(regex, '<span class="code-type">$1</span>');
    });

    return code;
}


/**
 * Highlights Python syntax
 */
function highlightPython(code) {
    const keywords = [
        'and', 'as', 'assert', 'async', 'await', 'break', 'class',
        'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
        'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
        'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
        'True', 'False', 'try', 'while', 'with', 'yield', 'self'
    ];

    // Comments
    code = code.replace(/(#.*$)/gm, '<span class="code-comment">$1</span>');

    // Strings (single and double quotes, including triple quotes)
    code = code.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="code-string">$1</span>');
    code = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="code-string">$1</span>');

    // Numbers
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>');

    // Keywords
    keywords.forEach(function (keyword) {
        const regex = new RegExp('\\b(' + keyword + ')\\b', 'g');
        code = code.replace(regex, '<span class="code-keyword">$1</span>');
    });

    // Function definitions
    code = code.replace(/\bdef\s+(\w+)/g, 'def <span class="code-function">$1</span>');

    return code;
}


/**
 * Highlights JavaScript syntax
 */
function highlightJavaScript(code) {
    const keywords = [
        'async', 'await', 'break', 'case', 'catch', 'class', 'const',
        'continue', 'debugger', 'default', 'delete', 'do', 'else',
        'export', 'extends', 'finally', 'for', 'function', 'if',
        'import', 'in', 'instanceof', 'let', 'new', 'of', 'return',
        'static', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
        'var', 'void', 'while', 'with', 'yield', 'true', 'false',
        'null', 'undefined'
    ];

    // Comments
    code = code.replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>');

    // Strings
    code = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="code-string">$1</span>');

    // Numbers
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>');

    // Keywords
    keywords.forEach(function (keyword) {
        const regex = new RegExp('\\b(' + keyword + ')\\b', 'g');
        code = code.replace(regex, '<span class="code-keyword">$1</span>');
    });

    return code;
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
