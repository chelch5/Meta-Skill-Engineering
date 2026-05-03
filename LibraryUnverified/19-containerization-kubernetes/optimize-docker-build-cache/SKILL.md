---
name: optimize-docker-build-cache
description: >
  Optimize an existing Dockerfile for faster build times and smaller images
  by reordering layers by change frequency, separating dependency installation
  from code copies, implementing multi-stage builds, and enabling BuildKit
  features. Use when Docker builds reinstall packages on every code change,
  when image sizes exceed 500MB without clear need, or when CI builds take
  more than 2 minutes due to repeated dependency installation.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: containerization
  complexity: intermediate
  language: Docker
  tags: docker, cache, optimization, multi-stage, buildkit
---

# Optimize Docker Build Cache

Reduce Docker build times and image sizes by restructuring Dockerfile layer order
and using caching features effectively.

## Purpose

Make Docker builds faster for iterative development by ensuring dependency layers
are cached independently of code changes, and reduce production image sizes by
separating build-time dependencies from runtime.

## When to use

Use this skill when:

- Docker builds reinstall all dependencies when only source code (not dependency
  files) has changed
- Production Docker images exceed 500MB and include build tools (compilers,
  dev headers) not needed at runtime
- CI pipeline builds take longer than 2 minutes and spend most time in
  `apt-get install`, `npm ci`, `pip install`, or `renv::restore()`
- The same Dockerfile is used for both development and production without
  optimization

## When NOT to use

Do not use this skill when:

- The project has no Dockerfile yet (use `create-dockerfile` instead)
- The project uses a language runtime without explicit dependency lockfiles
  (Python without requirements.txt/poetry.lock, R without renv.lock)
- Build times are under 30 seconds and already acceptable
- The image is a one-off build not intended for iterative development

## Procedure

### Step 1: Audit and Reorder Layers by Change Frequency

**Action:** Read the existing Dockerfile and verify the layer order follows this sequence:

1. Base image (`FROM`) - rarely changes
2. System dependencies (`RUN apt-get`) - change occasionally
3. Application dependencies (`COPY lockfile`, then `RUN install`) - change when deps update
4. Source code (`COPY . .`) - changes frequently

**Example - R Project:**

```dockerfile
# 1. Base image (rarely changes)
FROM rocker/r-ver:4.5.0

# 2. System dependencies (change occasionally)
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Dependency files only (change when deps change)
COPY renv.lock renv.lock
COPY renv/activate.R renv/activate.R
RUN R -e "renv::restore()"

# 4. Source code (changes frequently)
COPY . .
```

**Example - Python Project:**

```dockerfile
FROM python:3.11-slim

# System deps first
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy ONLY requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source code last
COPY . .
```

**Expected outcome:** After reordering, modifying a single source file and rebuilding should complete in under 10 seconds (cache hit on dependency layers) rather than reinstalling all packages.

**On failure - dependencies still reinstalling:**
1. Run `docker build --no-cache -t debug .` to verify the build works without cache
2. Run `docker build -t test .` immediately after
3. Check output for `#6 [3/5] RUN ...` - the layer numbers should match between builds
4. If layer hashes differ, identify which `COPY` or `RUN` instruction triggers the change
5. Move that instruction later in the Dockerfile, after dependency installation

### Step 2: Isolate Dependency Installation in Dedicated Layer

**Action:** Modify Dockerfile to copy ONLY dependency lockfiles before running install commands, then copy remaining source files afterward.

**Before (rebuilds packages on every code change):**

```dockerfile
# BAD - Any file change invalidates this layer
COPY . .
RUN R -e "renv::restore()"  # Re-runs on every build
```

**After (only rebuilds when lockfile changes):**

```dockerfile
# GOOD - Copy only lockfile first
COPY renv.lock renv.lock
RUN R -e "renv::restore()"  # Cached unless renv.lock changes
COPY . .  # Source changes don't affect layer above
```

**Node.js pattern:**

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

**Python pattern:**

```dockerfile
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

**Verification:** After implementing, run two builds:
1. `docker build -t test1 .` (initial build)
2. Modify any source file (not lockfile)
3. `docker build -t test2 .` (should show `CACHED` for dependency layer)

**Expected outcome:** The `RUN install` instruction should display as `CACHED` in build output when only source files changed. Build time should drop from minutes to seconds for code-only changes.

**On failure - lockfile not found:**
1. Verify lockfile exists: `ls -la renv.lock` (or `package-lock.json`, `requirements.txt`)
2. Check `.dockerignore` does not exclude the lockfile
3. Verify lockfile path in COPY matches actual location
4. Run `docker build --progress=plain .` to see exact error
5. If using monorepo, ensure COPY path accounts for subdirectory (e.g., `COPY backend/requirements.txt ./`)

### Step 3: Implement Multi-Stage Build for Smaller Production Images

**Action:** Split the Dockerfile into a `builder` stage (with compile tools) and a `runtime` stage (minimal runtime only).

**Use when:** Production images exceed 500MB or include compilers, dev headers, or build tools not needed at runtime.

**R Multi-Stage Example:**

```dockerfile
# Build stage - includes dev tools
FROM rocker/r-ver:4.5.0 AS builder
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev libssl-dev build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY renv.lock .
RUN R -e "install.packages('renv'); renv::restore()"

# Runtime stage - minimal image
FROM rocker/r-ver:4.5.0
RUN apt-get update && apt-get install -y \
    libcurl4 libssl3 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/lib/R/site-library /usr/local/lib/R/site-library
COPY . /app
WORKDIR /app
CMD ["Rscript", "main.R"]
```

**Python Multi-Stage Example:**

```dockerfile
# Build stage
FROM python:3.11 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

**Verification:** Compare sizes before and after:
```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

**Expected outcome:** Multi-stage images should be 50-80% smaller than single-stage builds. A Python app with numpy/pandas should drop from ~1GB to ~200MB.

**On failure - COPY --from=builder cannot find files:**
1. Debug the builder stage independently: `docker build --target builder -t debug-builder .`
2. Inspect the builder: `docker run --rm debug-builder ls -la /usr/local/lib/R/site-library`
3. Verify the exact path in builder matches COPY source path
4. For Python, check pip install location with `docker run debug-builder pip show pandas | grep Location`
5. Adjust COPY path accordingly (common paths: `/root/.local`, `/usr/local/lib/python3.11/site-packages`, `/usr/local/lib/R/site-library`)

### Step 4: Combine Related RUN Commands and Clean Package Caches

**Action:** Merge consecutive `RUN` commands that perform related operations into single chained commands, and clean package manager caches within the same layer.

**Principle:** Each `RUN` creates a layer that persists in the image. Package caches (`/var/lib/apt/lists/*`, `/var/cache/apt`, pip cache) consume space without benefit in the final image.

**Before (3 layers, apt cache persists in image):**

```dockerfile
RUN apt-get update
RUN apt-get install -y curl git
RUN rm -rf /var/lib/apt/lists/*
```

**After (1 layer, no cache residue):**

```dockerfile
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

**Python cache cleanup pattern:**

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

**Verification:** Check layer count and cache presence:
```bash
# Count layers
docker history myimage:latest | wc -l

# Check for apt cache in image
docker run --rm myimage:latest ls -la /var/lib/apt/lists/
# Should be empty or minimal
```

**Expected outcome:** Image size should decrease by 20-50MB per combined apt operation. Layer count in `docker history` should decrease.

**On failure - combined RUN command fails:**
1. Read the error output to identify failing subcommand
2. Temporarily split to debug: replace `&&` with separate `RUN` lines
3. Fix the underlying issue
4. Recombine into single RUN after successful builds
5. For apt failures, try `apt-get update --fix-missing` or check package names with `apt-cache search <name>`

### Step 5: Create or Update .dockerignore

**Action:** Create a `.dockerignore` file in the project root (same directory as Dockerfile) to exclude files that should not be copied into the build context.

**Why:** The build context includes all files in the Dockerfile's directory, sent to the Docker daemon before building. Large contexts slow down every build, even with caching.

**Common patterns to exclude:**

```
# Version control
.git
.gitignore
.gitattributes

# IDE/editor files
.idea/
.vscode/
*.swp
*.swo
*~

# Language-specific
.Rproj.user
.Rhistory
.RData
renv/library
renv/cache
node_modules/
__pycache__/
*.pyc
.pytest_cache/
.mypy_cache/

# Build artifacts
dist/
build/
*.tar.gz
*.zip
*.egg-info/

# Documentation
docs/
*.md
!README.md

# Environment and secrets
.env
.env.local
.env.*.local
*.pem
*.key
```

**Verification:** Check context size before and after:
```bash
# See context being sent to daemon
docker build --progress=plain . 2>&1 | head -20
# Look for "Sending build context to Docker daemon"

# For large contexts, you may see size in MB
```

**Expected outcome:** Build context size should be under 10MB for most projects. `docker build` should show "Sending build context" under 50MB.

**On failure - needed files not in container:**
1. Check if file is listed in `.dockerignore`: `grep filename .dockerignore`
2. Check for overly broad patterns like `*.txt` or `docs/` that might match needed files
3. Use exception syntax `!needed-file.txt` to include specific files
4. Verify file is in correct location relative to Dockerfile
5. Use `docker run --rm myimage ls -la /app/` to inspect what actually got copied

### Step 6: Enable BuildKit for Advanced Features

**Action:** Enable Docker BuildKit to unlock parallel builds, better caching, and cache mount features.

**Enable for single build:**

```bash
DOCKER_BUILDKIT=1 docker build -t myimage .
```

**Enable persistently (recommended):**

Add to `~/.bashrc`, `~/.zshrc`, or shell profile:
```bash
export DOCKER_BUILDKIT=1
```

**For docker-compose:**

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
```

With environment variables:
```bash
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1
docker-compose build
```

**BuildKit features gained:**
- Parallel stage execution in multi-stage builds
- Persistent cache mounts across builds (`--mount=type=cache`)
- Better layer caching algorithms
- Concurrent layer building

**Verification - BuildKit is active:**
```bash
DOCKER_BUILDKIT=1 docker build -t test . 2>&1 | head -5
```

Look for BuildKit-style output:
```
#1 [internal] load build definition from Dockerfile
#2 [internal] load .dockerignore
#3 [internal] load metadata for docker.io/library/python:3.11
```

Non-BuildKit output shows "Step 1/5 : FROM..." format instead.

**Expected outcome:** Build output shows `#N [stage]` format. Multi-stage builds show concurrent progress bars for independent stages.

**On failure - BuildKit not available:**
1. Check Docker version: `docker --version` (needs 18.09+)
2. Verify environment variable is exported: `echo $DOCKER_BUILDKIT`
3. For older Docker, upgrade or skip steps requiring `--mount=type=cache`
4. Some Docker Desktop versions have BuildKit enabled by default; check Settings > Build engine
5. If using Docker in CI (GitHub Actions, GitLab CI), verify the runner's Docker version in job logs

### Step 7: Use BuildKit Cache Mounts for Package Managers

**Action:** Add `--mount=type=cache` to RUN instructions that install packages, enabling persistent package caches that survive layer invalidation.

**Use when:** Package installation takes longer than 30 seconds and packages change infrequently. Most valuable for R, Python, and Node.js projects with many dependencies.

**R packages with persistent cache:**

```dockerfile
RUN --mount=type=cache,target=/usr/local/lib/R/site-library \
    R -e "renv::restore()"
```

**npm with persistent cache:**

```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

**Python with pip cache:**

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

**How it works:** The cache mount creates a persistent volume that stores packages between builds. Even if the Dockerfile layer is invalidated (e.g., lockfile changed), the package cache remains and speeds up re-installation.

**Verification:** Compare build times with and without cache mount:
```bash
# First build - establishes cache
DOCKER_BUILDKIT=1 docker build -t test1 .

# Second build - should reuse cache
DOCKER_BUILDKIT=1 docker build -t test2 .
# Look for cache mount reuse in output
```

**Expected outcome:** Package installation reuses downloaded packages from cache mount, reducing install time by 60-90% on subsequent builds. Full `npm ci` can drop from 2 minutes to 15 seconds.

**On failure - mount syntax not recognized:**
1. Verify BuildKit is enabled: `DOCKER_BUILDKIT=1` (see Step 6)
2. Check Docker version: `docker version` (requires 18.09+ for basic BuildKit, 20.10+ for all mount features)
3. Syntax must be exactly: `RUN --mount=type=cache,target=/path` (note the comma, not space)
4. Common target paths:
   - npm: `/root/.npm`
   - pip: `/root/.cache/pip`
   - R: `/usr/local/lib/R/site-library`
   - apt: `/var/cache/apt`
5. If still failing, remove `--mount` and proceed with basic layer caching (Step 1-2)

## Validation

Validate each optimization with specific measurements:

### Cache Performance Validation

**Test 1: Code-only change caching**
1. Run initial build: `docker build -t baseline .`
2. Modify any source file (not lockfile): `echo "# comment" >> main.py`
3. Rebuild and measure: `time docker build -t test .`
4. **Pass if:** Build completes in under 15 seconds and `docker history` shows dependency layer as `CACHED`

**Test 2: Dependency layer caching**
1. Run full build: `docker build -t pre .`
2. Touch lockfile without changing content: `touch renv.lock`
3. Rebuild: `docker build -t post .`
4. **Pass if:** Dependency installation re-runs (not cached), but completes faster with cache mounts if enabled

### Size Validation

**Measure image size reduction:**
```bash
# Before optimization
docker images myapp:unoptimized --format "{{.Size}}"

# After optimization
docker images myapp:optimized --format "{{.Size}}"
```

**Pass if:** Multi-stage builds show 40%+ size reduction. Single-stage optimized builds show 10-20% reduction from cache cleanup.

### Context Size Validation

```bash
docker build --progress=plain . 2>&1 | grep "Sending build context"
```

**Pass if:** Context is under 50MB. Large projects with data files should be under 100MB.

### Multi-Stage Validation

```bash
docker build --target builder -t builder-stage .
docker run --rm builder-stage which gcc  # Should find compiler
docker run --rm myapp:latest which gcc   # Should NOT find compiler
```

**Pass if:** Runtime image lacks build tools but application runs successfully.

## Failure handling

### Scenario: Dependencies reinstall on every build

**Symptoms:** Code changes trigger full package reinstall (2+ minute builds).

**Diagnosis:**
1. Check layer order: `docker history myimage:latest | head -10`
2. Verify dependency COPY comes before source COPY in Dockerfile
3. Verify lockfile exists: `ls renv.lock package-lock.json requirements.txt`

**Resolution:**
- Reorder Dockerfile (Step 1)
- Ensure `COPY . .` comes after dependency installation
- Add lockfile to version control if missing

### Scenario: Multi-stage COPY fails

**Symptoms:** `COPY --from=builder` errors with "file not found".

**Diagnosis:**
```bash
docker build --target builder -t debug .
docker run --rm debug ls -la /path/to/expected/files
```

**Resolution:**
- Verify paths match between builder install location and COPY source
- Common R path: `/usr/local/lib/R/site-library`
- Common Python path: `/root/.local` or `/usr/local/lib/python*/site-packages`

### Scenario: Image size not reduced

**Symptoms:** Multi-stage image is nearly same size as single-stage.

**Diagnosis:**
```bash
docker history myimage:latest | grep -E "(apt-get|install)"
```

**Resolution:**
- Ensure `rm -rf /var/lib/apt/lists/*` is in same RUN as apt-get install
- Remove dev packages (build-essential, gcc, -dev headers) from runtime stage
- Verify COPY --from=builder doesn't copy build artifacts unintentionally

### Scenario: Cache mounts not working

**Symptoms:** Package installation takes same time on every build.

**Diagnosis:**
1. Verify BuildKit: `docker build --progress=plain . 2>&1 | head -3`
2. Check for `#1 [internal]` style output (BuildKit) vs "Step 1" (legacy)

**Resolution:**
- Export `DOCKER_BUILDKIT=1` before build
- Verify Docker version 18.09+
- Check mount syntax has comma not space: `--mount=type=cache,target=/path`

### Platform-specific cache notes

Cache layers are platform-specific (Linux vs macOS vs Windows). CI runners may not
benefit from locally-built caches. For CI optimization, consider:
- Registry-based cache: `--cache-from` flag
- Dedicated CI cache mounts in GitHub Actions/GitLab CI
- BuildKit inline cache: `--build-arg BUILDKIT_INLINE_CACHE=1`

## Next steps

After optimizing the Dockerfile:

1. **Implement CI/CD caching** - Use `skill: setup-ci-cache` for GitHub Actions or GitLab CI registry caching
2. **Add health checks** - Use `skill: container-health-check` to verify containers start correctly
3. **Security scanning** - Use `skill: scan-container-image` to check for vulnerabilities in optimized images
4. **Docker Compose setup** - Use `skill: setup-docker-compose` for multi-service local development with optimized builds
