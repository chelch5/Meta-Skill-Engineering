---
name: setup-compose-stack
description: Configure multi-service Docker Compose stacks for web applications with databases, caches, and background workers. Use when creating a new docker-compose.yml from scratch for applications requiring 2+ services (app + database, app + cache, or app + database + cache + worker patterns), or when adding health checks, service dependencies, and environment management to an existing Compose setup. Triggers on requests to "docker compose", "docker-compose.yml", multi-service containers, or development environment orchestration.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: containerization
  complexity: intermediate
  language: Docker
  tags: docker-compose, orchestration, postgres, redis, multi-service, health-checks
---

# Set Up Compose Stack

Configure Docker Compose for multi-service application stacks with databases, caches, and workers.

## When to Use

- Creating a docker-compose.yml for a new project with multiple services
- Running a web app with a database (Postgres, MySQL, MongoDB) and/or cache (Redis, Memcached)
- Orchestrating background workers alongside an API service
- Setting up a development environment where services depend on each other
- Adding health checks and service startup order to an existing Compose setup
- Configuring environment variable management and secrets for Compose stacks
- Needing reproducible multi-service environments across teams

## When NOT to Use

- Single-container deployments (use a simple Dockerfile and docker run instead)
- Production Kubernetes or container orchestration (use Kubernetes, Docker Swarm, or cloud-native solutions)
- Modifying an already complete and working docker-compose.yml without new requirements
- Windows-specific container setups requiring Hyper-V or WSL2 troubleshooting (use Windows-specific container guides)
- Complex production-grade high-availability setups requiring load balancers, service mesh, or auto-scaling

## Procedure

### Step 1: Define Core Stack

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://appuser:apppass@postgres:5432/appdb
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppass
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

**Expected:** `docker compose up` starts all services with the app waiting for a healthy database.

**On failure:** Check `docker compose logs <service>` for startup errors. Common issues: port conflicts (change host ports), missing environment variables, database authentication failures.

### Step 2: Extend Health Checks to All Services

Add health checks to remaining services for complete stack visibility:

```yaml
services:
  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
```

Update app service to wait for Redis health:

```yaml
services:
  app:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy  # Now waits for Redis too
```

**Verify:** Run `docker compose ps` - all services should show `healthy` status.

### Step 3: Configure Networks

```yaml
services:
  app:
    networks:
      - frontend
      - backend

  postgres:
    networks:
      - backend

  nginx:
    networks:
      - frontend
    ports:
      - "80:80"

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

This isolates the database from direct external access while the app bridges both networks.

**Verify network isolation:**

```bash
# List networks created by compose
docker network ls | grep <project_name>

# Inspect backend network (should show postgres and app, not nginx)
docker network inspect <project_name>_backend
```

### Step 4: Manage Environment Variables

Create `.env` file (git-ignored):

```
POSTGRES_PASSWORD=secure_password_here
APP_SECRET=your_secret_key
```

Reference in compose:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  app:
    env_file:
      - .env
```

Create `.env.example` (committed to git):

```
POSTGRES_PASSWORD=changeme
APP_SECRET=changeme
```

### Step 5: Add Worker Services

```yaml
services:
  worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["node", "src/worker.js"]
    environment:
      DATABASE_URL: postgres://appuser:apppass@postgres:5432/appdb
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    deploy:
      replicas: 2
```

### Step 6: Use Profiles for Optional Services

```yaml
services:
  app:
    # always starts
    build: .

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"
    profiles:
      - dev

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    profiles:
      - dev
```

```bash
# Start core services only
docker compose up

# Start with dev tools
docker compose --profile dev up
```

### Step 7: Create Override for Development

`docker-compose.override.yml` is auto-merged:

```yaml
services:
  app:
    build:
      target: dev
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      DEBUG: "app:*"
    command: ["npm", "run", "dev"]
```

### Step 8: Build and Run

Execute these commands in order:

```bash
# Build all images
docker compose build

# Start in background
docker compose up -d

# Wait for services to become healthy (check every 2 seconds)
until docker compose ps | grep -q "healthy"; do sleep 2; done

# Verify all expected services are running
docker compose ps

# Check app can reach database
docker compose exec app nc -zv postgres 5432

# Check app can reach cache
docker compose exec app nc -zv redis 6379

# View logs for any errors
docker compose logs --tail=50

# Stop services (use -v flag to also remove volumes)
docker compose down
```

**Expected:** All services show `healthy` status, network connectivity tests pass.

## Output Contract

Deliverables produced by this skill:

1. **docker-compose.yml** - Complete multi-service stack definition with:
   - Application service with build context and health checks
   - Database service (Postgres) with persistent volume and health checks
   - Cache service (Redis) with persistent volume
   - Named networks (frontend, backend) for service isolation
   - Depends_on conditions ensuring proper startup order
   - Volume definitions for data persistence

2. **.env** (created if missing) - Git-ignored environment file with placeholder values

3. **.env.example** (created if missing) - Committed template showing required variables

4. **docker-compose.override.yml** (optional) - Development-specific overrides for live reloading and debug mode

5. **Verified state** - After running Step 8 commands, you have:
   - All services passing health checks (`docker compose ps` shows `healthy`)
   - Network connectivity confirmed between services
   - Clean startup/shutdown cycle validated

## Failure Handling

### Service fails to start

**Symptoms:** `docker compose up` exits immediately or service shows `Restarting` status.

**Resolution:**
1. Check logs: `docker compose logs <service-name>`
2. Verify Dockerfile exists and builds: `docker compose build --no-cache <service>`
3. Check for port conflicts: `lsof -i :<port>` or `netstat -tlnp | grep <port>`
4. Ensure environment variables are set: `cat .env` and verify values

### Health check failures

**Symptoms:** Service starts but never reaches `healthy` status.

**Resolution:**
1. Check if health check command works inside container: `docker compose exec <service> <health-check-cmd>`
2. Extend timeout values for slower machines: increase `interval`, `timeout`, `retries`
3. Add `start_period` to allow for slow initialization
4. Verify the health endpoint exists for app services

### Database connection refused

**Symptoms:** App service restarts repeatedly, logs show connection errors.

**Resolution:**
1. Verify database service is healthy: `docker compose ps`
2. Check DATABASE_URL format: should use service name as hostname (postgres, not localhost)
3. Ensure database exists: `docker compose exec postgres psql -U <user> -l`
4. Verify credentials match between app environment and database service

### Volume data not persisting

**Symptoms:** Data lost after `docker compose down` without `-v` flag.

**Resolution:**
1. Check volume is named (not anonymous) in docker-compose.yml
2. Verify volume mount path matches container's data directory
3. Inspect volume: `docker volume ls` and `docker volume inspect <volume-name>`

### Profile services not starting

**Symptoms:** Dev tools (mailhog, adminer) missing when expected.

**Resolution:**
1. Verify profile flag: `docker compose --profile dev up`
2. Check profile name matches: `profiles: ["dev"]` in compose file
3. No profile services start by default (intentional) - must specify profile

### Common Pitfalls

- **No health checks**: `depends_on` without `condition: service_healthy` only waits for container start, not readiness.
- **Hardcoded passwords in compose**: Use `.env` files. Never commit passwords.
- **Volume mount overwrites**: Mounting `.:/app` overwrites `node_modules`. Use an anonymous volume: `/app/node_modules`.
- **Port conflicts**: Check `docker compose ps` and `lsof -i :<port>` for conflicts.
- **`version:` key**: Compose V2 ignores the `version:` key. Omit it for modern setups.
- **WSL path issues**: Use `/mnt/c/...` paths when mounting Windows directories from WSL.

## Next Steps

After setting up the Compose stack:

- **`create-dockerfile`** - If the application Dockerfile needs refinement or optimization
- **`create-multistage-dockerfile`** - To reduce image size and build optimized production images
- **`configure-nginx`** - To add a reverse proxy with SSL termination and static file serving
- **`setup-docker-compose`** - For R-specific statistical computing environments with different patterns

## References

- Docker Compose specification: https://docs.docker.com/compose/compose-file/
- Compose file version 3 reference: https://docs.docker.com/compose/compose-file/compose-file-v3/
- Docker Compose profiles: https://docs.docker.com/compose/profiles/
- Docker health checks: https://docs.docker.com/compose/compose-file/05-services/#healthcheck
