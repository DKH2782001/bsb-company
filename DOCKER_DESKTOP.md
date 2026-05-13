# Docker Desktop

This project is configured to run as a production container with Docker Desktop.

## Files

- `Dockerfile`: multi-stage Next.js 16 production image using `output: "standalone"`.
- `docker-compose.yml`: local production runner for Docker Desktop.
- `.env.docker.example`: sample environment file.

## Quick start

1. Copy `.env.docker.example` to `.env.docker`.
2. Keep `DEMO_MODE=true` if you want to run without Supabase.
3. For live data, fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Start the app:

```bash
docker compose --env-file .env.docker up --build -d
```

5. Open `http://localhost:3000`.

## Stop

```bash
docker compose --env-file .env.docker down
```

## Rebuild when env changes

`NEXT_PUBLIC_*` values are baked into the Next.js build. If you change them, rebuild:

```bash
docker compose --env-file .env.docker up --build -d
```
