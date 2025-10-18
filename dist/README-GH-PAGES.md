# Deploying this project to GitHub Pages

This repository contains a static frontend (HTML/CSS/JS) and Firebase helper scripts. The workflow `deploy-gh-pages.yml` will publish the repository root to the `gh-pages` branch when you push to `main`.

Steps to publish:

1. Create a GitHub repository and push this project to it (from your project root):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-org-or-username>/<repo-name>.git
git push -u origin main
```

2. Wait for Actions to run. The workflow will create/update the `gh-pages` branch.

3. In your repository on GitHub go to Settings → Pages and set the source to `gh-pages` branch (if it isn't automatically set). The site will be available at `https://<your-org-or-username>.github.io/<repo-name>/`.

Notes
- The action publishes the repository root (the static files). If your site uses server-side functions you still need to deploy those separately (Cloud Functions via `firebase deploy --only functions`).
- Keep secrets out of the repo (don’t commit service-account.json). For Firebase hosting you can use `firebase deploy` from your local machine or CI.

If you want, I can also add a minimal `index.html` health-check or adjust the workflow to build from a `dist/` folder. Tell me which branch name you’ll push if not `main` and I’ll adapt the workflow.
