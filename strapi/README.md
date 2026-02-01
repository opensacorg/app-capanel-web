# Strapi CMS

Self-hosted headless CMS for content management.

## Local Development

```bash
# From project root
pnpm install
pnpm dev:strapi
```

Or with Docker:

```bash
docker compose up strapi
```

The admin panel will be available at http://localhost:1337/admin

## First Time Setup

1. Copy `.env.example` to create a local `.env` file (or use the root project `.env`)
2. Generate secure keys:
   ```bash
   openssl rand -base64 32
   ```
3. Start the development server
4. Create your first admin user at http://localhost:1337/admin

## Database

- **Development**: SQLite (default) or PostgreSQL via Docker
- **Production**: PostgreSQL (shared with main app database)

## API Endpoints

- REST API: `http://localhost:1337/api`
- Admin Panel: `http://localhost:1337/admin`

## Creating Content Types

Use the Strapi admin panel Content-Type Builder to create your content types.
They will be generated in `src/api/`.

## Production

In production, Strapi runs on port 1337 and is accessible via:
- `https://cms.yourdomain.com` (via Traefik)
