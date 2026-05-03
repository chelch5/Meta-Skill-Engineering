---
name: docker-containers
description: "Create or improve Dockerfiles, docker-compose.yml, and .dockerignore files. Use for containerizing applications, optimizing image size with multi-stage builds, adding health checks, debugging build failures, and scanning for vulnerabilities. Do not use for Kubernetes/ECS orchestration, pure application code changes, or cloud registry management."
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: docker-containers
  maturity: draft
  risk: low
  tags: [docker, dockerfile, compose, multi-stage, containers]
---

# Purpose

Author production-quality Dockerfiles with multi-stage builds, write docker-compose service definitions, optimize image size and layer caching, configure container health checks, manage build arguments and runtime secrets, and scan images for security vulnerabilities.

# When to use this skill

- Creating a new Dockerfile or editing an existing one.
- Writing or modifying a `docker-compose.yml` for local development or production.
- Optimizing a Docker image for size (reducing layers, choosing smaller base images).
- Implementing multi-stage builds to separate build-time and runtime dependencies.
- Adding `HEALTHCHECK` instructions or container health-check configurations.
- Debugging `docker build` failures, layer caching issues, or runtime container errors.
- Scanning Docker images for CVEs using `docker scout`, Trivy, or Snyk.
- Configuring `.dockerignore` to exclude unnecessary files from the build context.
- Setting up Docker BuildKit features (cache mounts, secret mounts, SSH forwarding).

# Do not use this skill when

- The task is about container orchestration (Kubernetes deployments, ECS task definitions, Nomad jobs) — prefer orchestration-specific skills.
- The change is purely application code with no Dockerfile or container configuration impact.
- The task involves cloud-provider container services (ECR, GCR, ACR) — prefer `aws` or `gcp` for registry-specific commands.
- The focus is on CI/CD pipeline design — prefer `cloud-deploy` for deployment strategy.

# Procedure

1. **Identify the target application.** Determine the runtime (Node.js, Python, Go, Rust, Java), dependency manager (npm, pip, go modules, cargo, maven), and build/start commands. Check for existing Docker-related files in the project root.

2. **Create or update .dockerignore.** Place in the same directory as the Dockerfile. Exclude:
   - Version control: `.git`, `.gitignore`
   - Dependencies: `node_modules`, `vendor/`
   - Documentation: `*.md`, `docs/`
   - Tests and local configs: `*_test.go`, `.env`, `.env.local`
   - IDE and OS files: `.vscode/`, `.DS_Store`

3. **Select the base image.** Pin to a specific version (e.g., `node:20-alpine3.19`, `python:3.11-slim-bookworm`). Priority order:
   - `alpine` variants for minimal size (static binaries, Go, Rust)
   - `slim` variants for glibc compatibility (Node.js, Python)
   - `distroless` for security-hardened production (Java, Go)
   - Never use `latest` tag

4. **Write the Dockerfile with multi-stage build.** Create in project root as `Dockerfile` (or `Dockerfile.prod` for production variant).
   - Stage 1 (builder): Install dependencies, compile/build. Include all build tools.
   - Stage 2 (runtime): Copy only artifacts from builder. Use `COPY --from=builder`.
   - Order layers: dependency manifests first, then source code.
   - Use `npm ci` (Node), `pip install --no-cache-dir` (Python), `go mod download` (Go).

5. **Configure production hardening.**
   - Add non-root user: `RUN addgroup -S app && adduser -S app -G app` then `USER app`
   - Add health check: `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD ["curl", "-f", "http://localhost:8080/healthz"]`
   - Add metadata labels: `org.opencontainers.image.source`, `org.opencontainers.image.version`

6. **Create docker-compose.yml if multiple services or local development needed.** Place in project root. Include:
   - Service definitions with `build.context: .` and `build.dockerfile: Dockerfile`
   - Port mappings: `ports: ["8080:8080"]`
   - Environment variables: `environment` or `env_file: .env`
   - Volume mounts for development: `volumes: [".:/app"]`
   - Health check ordering: `depends_on: {db: {condition: service_healthy}}`

7. **Build the image.** Run:
   ```bash
   DOCKER_BUILDKIT=1 docker build -t <image-name>:<tag> .
   ```

8. **Validate the build.** Execute these verification commands:
   ```bash
   # Check image size (target: under 200MB for most apps)
   docker images <image-name>:<tag> --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

   # Inspect layer sizes if image is large
   docker history <image-name>:<tag>

   # Run container and check health
   docker run -d --name test-container -p 8080:8080 <image-name>:<tag>
   sleep 5
   docker inspect --format='{{.State.Health.Status}}' test-container
   docker logs test-container
   docker stop test-container && docker rm test-container
   ```

9. **Scan for vulnerabilities.** Run:
   ```bash
   docker scout cves <image-name>:<tag>
   # or
   trivy image <image-name>:<tag>
   ```
   Address critical/high CVEs by updating base images or dependency versions.

10. **Test with docker-compose (if applicable).**
    ```bash
    docker-compose up --build -d
    docker-compose ps
    docker-compose logs <service-name>
    docker-compose down
    ```

# Decision rules

- Use multi-stage builds for every production image — single-stage is only acceptable for simple scripts or development images.
- Use `alpine` base images unless the application requires glibc-specific dependencies (in that case, use `slim`).
- Pin base image tags to specific versions, not `latest` or major-only tags.
- Use `COPY --from=builder` to transfer only artifacts — never install build tools in the runtime stage.
- Use `npm ci` over `npm install` for deterministic Node.js dependency installation.
- If the image exceeds 500MB, investigate — most production images should be under 200MB.
- Use BuildKit (`DOCKER_BUILDKIT=1`) for all builds — it enables cache mounts, secret mounts, and parallel stage execution.
- Run containers as non-root unless the application explicitly requires root (and document why).

# Output contract

After completing containerization work, deliver:

1. **Dockerfile** — Multi-stage build with:
   - Pinned base image tag (specific version, not `latest`)
   - Optimized layer ordering (dependencies before source)
   - Non-root `USER` instruction
   - `HEALTHCHECK` instruction
   - OCI metadata labels

2. **docker-compose.yml** (if applicable) — Service definitions with:
   - Explicit build context and Dockerfile paths
   - Port mappings and environment configuration
   - Health check definitions
   - Proper `depends_on` ordering

3. **.dockerignore** — Exclusions for build context optimization

4. **Validation report** — Results showing:
   - Image size (target: <200MB for typical applications)
   - Health check status (`healthy` or `unhealthy`)
   - Vulnerability scan summary (critical/high CVE count)
   - Build commands used for reproducibility

# References

- Dockerfile best practices: https://docs.docker.com/build/building/best-practices/
- Multi-stage builds: https://docs.docker.com/build/building/multi-stage/
- Docker Compose specification: https://docs.docker.com/compose/compose-file/
- BuildKit documentation: https://docs.docker.com/build/buildkit/
- Docker Scout: https://docs.docker.com/scout/
- `references/preflight-checklist.md`

# Related skills

- `aws` — ECR image registry, ECS task definitions, Fargate runtime.
- `vercel` — containerized deployment alternatives.
- `terraform-iac` — infrastructure-as-code for container registries and orchestration resources.
- `secret-management` — runtime secret injection into containers.

# Anti-patterns

- Using `latest` as the base image tag — breaks reproducibility and caching.
- Running `apt-get update && apt-get install` without `--no-install-recommends` and without cleaning the apt cache in the same layer.
- Copying the entire source tree before installing dependencies — invalidates the dependency cache on every code change.
- Embedding secrets in `ENV` instructions — they persist in image layers and are visible via `docker history`.
- Running as root in production containers.
- Using `ADD` when `COPY` would suffice — `ADD` has implicit tar extraction and URL download behavior that causes surprises.
- Ignoring `.dockerignore` — large build contexts slow down builds and may leak sensitive files.

# Failure handling

**Build failures:**
- **Error at `RUN` step:** Check command exit code and stderr. Common fixes:
  - Missing package: Switch to `slim` variant or add `apt-get install <package>`
  - Network issues: Retry with `--network host` or check proxy settings
  - Incorrect `WORKDIR`: Verify the directory exists (`RUN mkdir -p /app` before `WORKDIR /app`)

**Image size too large:**
- Run `docker history <image>` to identify large layers (>50MB)
- Fix: Ensure build tools are only in builder stage, not runtime
- Fix: Add cleanup in same layer: `apt-get install && rm -rf /var/lib/apt/lists/*`
- Fix: Use `.dockerignore` to reduce build context

**Health check failures:**
- Verify health endpoint exists: `curl http://localhost:<port>/healthz` from inside container
- Check application startup: `docker logs <container>` for port binding errors
- Verify `EXPOSE` matches actual listening port
- Check non-root user has permissions to run health check binary

**Vulnerability scan failures:**
- Critical CVEs in base image: Update to latest patched tag (e.g., `alpine3.19` → `alpine3.20`)
- Application CVEs: Update dependencies in manifest files
- Last resort: Switch to `distroless` base for minimal attack surface

**Permission denied errors:**
- Container running as non-root but binding to port <1024: Change to port >1024 (8080 instead of 80)
- Filesystem permission issues: Ensure `USER` instruction comes after all `COPY`/`RUN` that need root

**Redirect to other skills:**
- If task involves Kubernetes deployments, pods, or services → Use `kubernetes` skill
- If task involves AWS ECS, Fargate, or ECR → Use `aws` skill
- If task involves CI/CD pipelines → Use `cloud-deploy` skill
