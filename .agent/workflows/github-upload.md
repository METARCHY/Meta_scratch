---
description: how to connect and upload the project to GitHub
---

# Uploading Metarchy to GitHub

**IMPORTANT:** Only push to GitHub when explicitly requested by the user. Do not push automatically after commits.

Follow these steps to connect and upload your local project to a GitHub repository.

## 1. Initialize Git locally
If you haven't initialized git in the project root yet:

```bash
git init
```

## 2. Add files and Commit
Add all files (the `.gitignore` will ensure temporary files are skipped) and create your first commit:

```bash
git add .
git commit -m "Initial commit: Metarchy project with Docker support and Admin Dashboard"
```

## 3. Create a repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `metarchy`).
3. Keep it Public or Private as you prefer.
4. **Do NOT** initialize with a README, license, or gitignore (we already have them).
5. Click **Create repository**.

## 4. Link local to remote
Copy the remote URL from GitHub (it looks like `https://github.com/username/metarchy.git`) and run:

```bash
git remote add origin PASTE_YOUR_URL_HERE
git branch -M main
```

## 5. Push to GitHub (Only When Requested)
**Wait for user to explicitly request a push.** When the user asks to push/upload to GitHub:

```bash
git push -u origin main
```

For subsequent updates, when the user requests to push:
1. `git add .`
2. `git commit -m "your message"`
3. `git push`

---
**Rule:** Never push to GitHub without explicit user request. Commits to local repository are fine, but pushing to remote requires user approval.
