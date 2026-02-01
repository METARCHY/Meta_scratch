---
description: how to connect and upload the project to GitHub
---

# Uploading Metarchy to GitHub

Follow these steps to connect your local project to a GitHub repository.

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

## 5. Push to GitHub
Finally, upload your code:

```bash
git push -u origin main
```

---
**Tip**: If you ever need to update the project later, just run:
1. `git add .`
2. `git commit -m "your message"`
3. `git push`
