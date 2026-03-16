# Deployment Guide: Metarchy on Your Own Server

My Biological Friend, since you have your own server and a domain, we will ignore GitHub Pages. Using your server allows you to keep the **Multiplayer** and **Persistent Storage** features that GitHub Pages would break.

## Phase 1: Point your Domain (Namecheap)

1.  Log in to your **Namecheap Dashboard**.
2.  Go to **Domain List** -> **Manage** (next to `metarchy.space`).
3.  Click the **Advanced DNS** tab.
4.  Add a new record:
    *   **Type**: `A Record`
    *   **Host**: `play`
    *   **Value**: `[YOUR SERVER IP ADDRESS]`
    *   **TTL**: `Automatic`

## Phase 2: Server Preparation

1.  SSH into your server.
2.  Ensure **Docker** and **Docker Compose** are installed:
    ```bash
    docker --version
    docker-compose --version
    ```
3.  Clone the repository:
    ```bash
    git clone https://github.com/METARCHY/Meta_scratch.git
    cd Meta_scratch
    ```

## Phase 3: Launch Metarchy

1.  Start the application in the background:
    ```bash
    docker-compose up -d --build
    ```
2.  The game is now running internally on port `3000`.

## Phase 4: Web Access (Reverse Proxy)

To make it accessible at `https://play.metarchy.space`, you need a reverse proxy (like Nginx).

1.  **Install Nginx**: `sudo apt update && sudo apt install nginx`
2.  **Create a config**: `sudo nano /etc/nginx/sites-available/metarchy`
3.  Paste this:
    ```nginx
    server {
        server_name play.metarchy.space;
        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```
4.  **Enable & Restart**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/metarchy /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
    ```
5.  **SSL (HTTPS)**:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d play.metarchy.space
    ```

## Phase 5: Security (Firewall)

Ensure your server only allows necessary traffic:
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## Phase 6: Updating Metarchy

When you make changes locally and push to GitHub, update your server like this:
1.  Navigate to the folder: `cd Meta_scratch`
2.  Pull the latest code: `git pull origin main`
3.  Rebuild and restart: `docker-compose up -d --build`

**Metarchy is now live!** Visit `play.metarchy.space` to start the game. <!-- id: 564 -->
