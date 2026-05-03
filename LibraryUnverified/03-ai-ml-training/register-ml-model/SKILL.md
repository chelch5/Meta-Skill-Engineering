---
name: register-ml-model
description: >-
  Register, version, and govern MLflow models through a full lifecycle from
  training-run artifact to production stage with validation gates, alias-based
  deployment routing, lineage tracking, and CI/CD automation. Triggers on
  "register a model", "promote model to production", "manage model versions",
  "model stage transitions", "model governance", "model rollback", "model
  lineage", and "champion/challenger A/B models".
---

# Register ML Model

Register MLflow-trained models to the Model Registry for systematic versioning, stage management, and deployment governance.

## When to use

- Promoting a trained model from experimentation to production
- Managing multiple model versions across development stages
- Implementing model approval workflows for governance
- Tracking model lineage from training to deployment
- Rolling back to previous model versions
- Comparing deployed model versions for A/B testing
- Auditing model changes for compliance requirements
- Setting up champion/challenger model patterns

## When NOT to use

- Model training is still in progress (use `track-ml-experiments` instead)
- The model has not been logged to MLflow with `mlflow.*.log_model()`
- You only need file-based artifact storage without versioning (use direct artifact logging)
- Your MLflow server runs SQLite backend (Model Registry requires PostgreSQL or MySQL)
- You need real-time model serving without registry abstraction (deploy directly from artifacts)
- The use case involves one-off inference without reproducibility requirements

## Procedure

### Step 1: Verify Model Registry Backend

Confirm the MLflow server has a database-backed Model Registry (PostgreSQL or MySQL; SQLite is not supported).

**Verify backend connectivity:**

```python
# model_registry_config.py
import mlflow
from mlflow.tracking import MlflowClient

MLFLOW_TRACKING_URI = "http://mlflow-server.company.com:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
client = MlflowClient()

# Verify registry is accessible
try:
    registered_models = client.search_registered_models()
    print(f"Model Registry available ({len(registered_models)} models)")
except Exception as e:
    raise RuntimeError(f"Model Registry not available: {e}")
```

**Server startup (PostgreSQL backend):**

```bash
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost:5432/mlflow \
  --default-artifact-root s3://mlflow-artifacts/models \
  --host 0.0.0.0 \
  --port 5000
```

**Expected:** `client.search_registered_models()` returns list (may be empty), MLflow UI shows "Models" tab, database has `registered_models` table.

**On failure:**
1. Check MLflow version: `mlflow --version` (must be ≥1.2)
2. Verify database backend is PostgreSQL/MySQL (SQLite unsupported for registry)
3. Check server logs: `journalctl -u mlflow-server` or Docker logs
4. Test connection: `curl http://mlflow-server:5000/api/2.0/mlflow/registered-models/list`
5. Verify database permissions: `psql -h localhost -U mlflow_user -c "\dt"` should show mlflow tables

## Failure Handling

| Failure Mode | Diagnosis | Resolution |
|---|---|---|
| `MlflowException: Model Registry not available` | SQLite backend in use | Switch to PostgreSQL/MySQL backend |
| `AttributeError: 'MlflowClient' has no attribute 'search_registered_models'` | MLflow version < 1.20 | Upgrade MLflow: `pip install --upgrade mlflow` |
| Model registers but artifact download fails | Artifact storage unreachable | Verify `default-artifact-root` URI and network access |
| `SearchModelVersion` returns empty on existing model | Wrong model name or case mismatch | Use exact `model_name` as registered; names are case-sensitive |
| Stage transition raises `MlflowException` | Version already in target stage or concurrent transition in progress | Check `client.get_model_version(name, version).current_stage`; retry after current transition completes |
| Alias assignment raises `AttributeError` | MLflow < 2.0 | Fall back to tag-based alias: `client.set_model_version_tag(name, version, f"alias_{alias}", "true")` |
| Tag value exceeds 5000 character limit | Lineage metadata too large | Truncate or split into multiple tags |
| Rollback finds no archived version | Previous Production was not properly archived | Ensure `archive_existing_versions=True` on every promotion; inspect `client.search_model_versions()` for orphaned versions |

## Validation

### Per-Step Verification

**Step 1:** `client.search_registered_models()` returns list (may be empty), MLflow UI shows "Models" tab, database has `registered_models` table.

**Step 2:** Model appears in Registry UI with assigned version, accessible via `models:/customer-churn-classifier/1`, tags and description populated.

**Step 3:** Model version stage updates in Registry UI, previous Staging/Production versions archived, transition timestamps in tags.

**Step 4:** Aliases appear in Registry UI, `models:/name@alias` URI resolves, alias updates immediately affect new loads.

**Step 5:** Model version tags contain lineage data, JSON-serializable values stored as strings, `get_model_lineage()` returns structured dictionary.

**Step 6:** Workflow triggers via GitHub UI or API, validation passes, model stage updates, deployment infrastructure receives event.

### Output Contract

| Artifact | Method | Format |
|---|---|---|
| Registered model | `mlflow.register_model()` | `ModelVersion` object |
| Stage transition | `client.transition_model_version_stage()` | Updates in-place, returns `None` |
| Alias assignment | `client.set_registered_model_alias()` | Updates in-place, returns `None` |
| Lineage record | `client.get_model_version()` + `client.get_run()` | `dict` with nested `dict`s |
| Promotion event | CI/CD workflow dispatch | GitHub Actions `workflow_dispatch` |

## Common Pitfalls

- **SQLite limitations**: Model Registry requires database backend (PostgreSQL/MySQL) for production - file-based registry causes concurrency issues
- **Stage conflicts**: Multiple versions in same stage cause confusion - use `archive_existing_versions=True` to auto-archive
- **Missing run linkage**: Registering models without run_id loses lineage - always register from MLflow runs, not raw files
- **Alias confusion**: Using stages as deployment targets instead of aliases - stages are for workflow, aliases for deployment references
- **Validation skipped**: Promoting to Production without checks - implement mandatory validation in CI/CD pipeline
- **No rollback plan**: Production issues without rollback capability - maintain previous Production version in Archived stage
- **Tag overload**: Too many unstructured tags - standardize tag schema and naming conventions
- **Manual processes**: Human-driven promotions are error-prone and slow - automate with CI/CD and approval workflows
- **Lost artifacts**: Model registered but artifacts deleted from storage - ensure artifact retention policies align with model lifecycle

## Related Skills

- `track-ml-experiments` - Log models to MLflow before registering them
- `deploy-ml-model-serving` - Deploy registered models to serving infrastructure
- `run-ab-test-models` - A/B test models using registry aliases
- `orchestrate-ml-pipeline` - Automate model training and registration
- `version-ml-data` - Version training data for model lineage
