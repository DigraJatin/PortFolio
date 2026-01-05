# Help Guide: How to Add New Content

This guide explains how to add new blog posts and projects to your portfolio website.

## How to Add a New Blog Post

Adding a new blog post is a two-step process:

1.  **Create the content file**: Create a new Markdown file (`.md`) inside the appropriate category folder in the `blogs` directory. For example, if you are writing a new C++ blog, you could create a file named `my-new-cpp-blog.md` inside the `blogs/cpp/` folder.

2.  **Update the blog list page**: Open the `pages/blogs.html` file and add a new list item for your new blog post. You will need to copy and paste one of the existing `<li class="blog-item">` elements and modify its content.

    Specifically, you need to update:
    *   The `href` attribute of the `<a>` tag to point to your new blog post. The URL should follow the format: `blog-post.html?category=<category-folder>&slug=<your-markdown-filename-without-md>`.
        *   For example: `href="blog-post.html?category=cpp&slug=my-new-cpp-blog"`
    *   The blog title, date, and excerpt.

    Here is a template for the list item:

    ```html
    <li class="blog-item">
        <a href="blog-post.html?category=new_category&slug=your_new_slug" class="blog-title">
            Your New Blog Post Title
        </a>
        <div class="blog-meta">January 6, 2026</div>
        <p class="blog-excerpt">
            A short summary of your new blog post.
        </p>
    </li>
    ```

    You would add this block of HTML to `pages/blogs.html` under the appropriate category section. If you are adding a post to a new category, you will also need to add a new category section.

**Note on Blog Categories**: The blog posts are loaded from markdown files based on a path constructed from the URL parameters `category` and `slug`. For example, the URL `pages/blog-post.html?category=cpp&slug=understanding-move-semantics` will load the file at `/blogs/cpp/understanding-move-semantics.md`.

## How to Add a New Project

Adding a new project is simpler as it does not involve markdown files.

1.  **Edit the projects page**: Open the `pages/projects.html` file.
2.  **Add a new project item**: Copy an existing `<article class="project-item">` block and paste it. Then, modify the content to reflect your new project's details:
    *   `project-title`: The name of your project.
    *   `skill-tag`: The technologies used.
    *   `project-description`: A brief description of the project.
    *   `project-links`: Links to the source code or a live demo.

    Here is a template for a project item:

    ```html
    <article class="project-item">
        <h3 class="project-title">My New Awesome Project</h3>
        <div class="project-tech">
            <span class="skill-tag">C++</span>
            <span class="skill-tag">New-Tool</span>
        </div>
        <p class="project-description">
            A description of my new awesome project.
        </p>
        <div class="project-links">
            <a href="https://github.com/your-username/your-project" target="_blank" class="btn">View Source</a>
        </div>
    </article>
    ```

    Add this block inside the `<main class="main-content">` section in `pages/projects.html`.