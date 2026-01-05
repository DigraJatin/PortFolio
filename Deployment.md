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
