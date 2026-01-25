# How to Deploy Your Portfolio Website Using GitHub Pages

GitHub Pages is a great way to host your static website for free directly from your GitHub repository. Here’s a step-by-step guide to get your portfolio live.

## Prerequisites

1.  **A GitHub Account**: If you don’t have one, you can sign up for free at [github.com](https://github.com).
2.  **Git Installed**: You need Git installed on your computer to push your code to GitHub. You can download it from [git-scm.com](https://git-scm.com/).

## Step 1: Create a New Repository on GitHub

1.  Log in to your GitHub account.
2.  Click the **+** icon in the top-right corner and select **New repository**.
3.  Give your repository a name (e.g., `my-portfolio`).
4.  Choose **Public** for the repository visibility. GitHub Pages for private repositories is a paid feature.
5.  Click **Create repository**.

## Step 2: Push Your Local Code to the GitHub Repository

Now, you need to connect your local project folder to the new GitHub repository and push your code.

Open your terminal or command prompt and navigate to your project's root directory (`c:\Users\digra\VibeCode\Portfolio Website`). Then, run the following commands one by one.

1.  **Initialize Git** (if you haven't already):
    ```bash
    git init
    ```

2.  **Add all your files to Git**:
    ```bash
    git add .
    ```

3.  **Commit your files**:
    ```bash
    git commit -m "Initial commit"
    ```

4.  **Connect your local repository to the remote GitHub repository**. Replace `<your-username>` and `<repository-name>` with your actual GitHub username and repository name.
    ```bash
    git remote add origin https://github.com/<your-username>/<repository-name>.git
    ```

5.  **Set the main branch name**. Most new repositories use `main` as the default branch.
    ```bash
    git branch -M main
    ```

6.  **Push your code to GitHub**:
    ```bash
    git push -u origin main
    ```

## Step 3: Enable GitHub Pages

Once your code is on GitHub, you can enable GitHub Pages.

1.  On your GitHub repository's page, click on the **Settings** tab.
2.  In the left sidebar, click on **Pages**.
3.  Under the "Build and deployment" section, for the **Source**, select **Deploy from a branch**.
4.  For the **Branch**, select `main` and keep the folder as `/ (root)`.
5.  Click **Save**.

## Step 4: Access Your Live Website

After you save, GitHub will start a deployment process. It might take a minute or two for your site to go live.

You will see a message at the top of the Pages settings saying "Your site is live at `https://<your-username>.github.io/<repository-name>/`".

You can click the link to see your deployed portfolio website.

That's it! Your website is now live on the internet. Whenever you make changes to your local project, you can push them to GitHub, and GitHub Pages will automatically redeploy your site with the new changes. The commands to push updates are:

```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

## Step 5: (Optional) Using a Custom Domain

If you own a custom domain (e.g., `yourname.com`) and want to use it for your portfolio instead of the `digrajatin.github.io` address, you can configure it in the GitHub Pages settings.

### What to put in the "Custom domain" field:

In this field, you should enter the custom domain name that you own. For example, if you own `jatin.dev`, you would enter `jatin.dev` or `www.jatin.dev`.

**Important**: Simply entering your domain name here is not enough. You must also configure your domain's DNS settings to point to GitHub's servers.

### How to Configure Your Custom Domain

1.  **Buy a domain name**: If you don't already own one, you need to purchase a domain name from a domain registrar like GoDaddy, Namecheap, or Google Domains.

2.  **Enter your custom domain in GitHub Pages**:
    *   Go to your repository's **Settings** > **Pages**.
    *   In the **Custom domain** field, type your domain name (e.g., `www.yourdomain.com` or `yourdomain.com`).
    *   Click **Save**. This will create a `CNAME` file in your repository with the domain name.

3.  **Configure your DNS records**:
    *   Log in to your domain registrar's website (where you bought your domain).
    *   Go to the DNS management settings for your domain.
    *   You need to create one of the following types of records:

        *   **For a subdomain (like `www.yourdomain.com`)**: Create a `CNAME` record that points `www` to your default GitHub Pages URL (`<your-username>.github.io`).

            | Type    | Name/Host | Value/Target                  |
            |---------|-----------|-------------------------------|
            | CNAME   | www       | `<your-username>.github.io`.  |

        *   **For an apex domain (like `yourdomain.com`)**: Create `A` records that point your domain to GitHub's IP addresses.

            | Type    | Name/Host | Value/Target        |
            |---------|-----------|---------------------|
            | A       | @         | `185.199.108.153`   |
            | A       | @         | `185.199.109.153`   |
            | A       | @         | `185.199.110.153`   |
            | A       | @         | `185.199.111.153`   |

            You may also want to create `AAAA` records for IPv6 support:

            | Type    | Name/Host | Value/Target                      |
            |---------|-----------|-----------------------------------|
            | AAAA    | @         | `2606:50c0:8000::153`              |
            | AAAA    | @         | `2606:50c0:8001::153`              |
            | AAAA    | @         | `2606:50c0:8002::153`              |
            | AAAA    | @         | `2606:50c0:8003::153`              |

    **Note**: DNS changes can take some time to propagate across the internet (from a few minutes to 24-48 hours).

4.  **Enforce HTTPS**: Once your custom domain is correctly configured and pointing to GitHub, you can enforce HTTPS for your site. In the GitHub Pages settings, check the **Enforce HTTPS** box. This ensures that your site is served securely over `https://`.
