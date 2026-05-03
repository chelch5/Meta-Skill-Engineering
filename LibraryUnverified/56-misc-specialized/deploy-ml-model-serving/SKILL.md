---
name: deploy-ml-model-serving
description: Deploy ML models to production serving infrastructure (MLflow, BentoML, Seldon Core) with REST/gRPC endpoints, autoscaling, monitoring, and A/B testing. Use when deploying trained models for real-time inference, setting up prediction APIs, or implementing model versioning in production.
---

# Deploy ML Model Serving

Deploy trained machine learning models to production serving infrastructure with scalable endpoints, monitoring, and deployment strategies.

## Purpose

This skill provides procedures for deploying ML models to production serving systems, configuring prediction endpoints, implementing autoscaling, monitoring model performance, and managing model versions through A/B testing and canary deployments.

## When to use

- Deploying a trained model to production for real-time inference
- Setting up REST or gRPC API endpoints for model predictions
- Implementing autoscaling to handle variable request loads
- Running A/B tests between model versions
- Migrating from batch inference to real-time serving
- Building low-latency prediction services
- Managing multiple model versions simultaneously
- Implementing canary or blue-green deployment strategies

## When NOT to use

- Training or fine-tuning models (use training-specific skills)
- Batch inference on large datasets without real-time requirements
- Deploying non-ML applications or generic microservices
- Prototyping or experimenting with models locally (use notebook/development skills)
- Deploying models to edge devices or mobile (use edge deployment skills)
- Model registry operations without serving intent (use model registration skills)
- Setting up ML experimentation or tracking infrastructure (use MLflow setup skills)

## Procedure

### Step 1: Deploy with MLflow Model Serving

MLflow's built-in serving provides quick deployment for scikit-learn, PyTorch, and TensorFlow models.

**Prerequisites:** Model registered in MLflow Model Registry or accessible artifact URI.

Local testing:

```bash
# Serve model locally
mlflow models serve \
  --model-uri models:/customer-churn-classifier/Production \
  --port 5001 \
  --host 0.0.0.0

# Test endpoint
curl -X POST http://localhost:5001/invocations \
  -H 'Content-Type: application/json' \
  -d '{
    "dataframe_records": [
      {"feature1": 1.0, "feature2": 2.0, "feature3": 3.0}
    ]
  }'
```

Docker deployment:

```dockerfile
# Dockerfile.mlflow-serving
FROM python:3.9-slim
RUN pip install mlflow boto3 scikit-learn
ENV MLFLOW_TRACKING_URI=http://mlflow-server:5000
ENV MODEL_URI=models:/customer-churn-classifier/Production
EXPOSE 8080
CMD mlflow models serve \
    --model-uri $MODEL_URI \
    --host 0.0.0.0 \
    --port 8080 \
    --no-conda
```

Docker Compose for local testing:

```yaml
version: '3.8'
services:
  model-server:
    build:
      context: .
      dockerfile: Dockerfile.mlflow-serving
    ports:
      - "8080:8080"
    environment:
      MLFLOW_TRACKING_URI: http://mlflow-server:5000
      MODEL_URI: models:/customer-churn-classifier/Production
  mlflow-server:
    image: python:3.9-slim
    command: >
      bash -c "pip install mlflow boto3 &&
               mlflow server
               --backend-store-uri sqlite:///mlflow.db
               --default-artifact-root s3://mlflow-artifacts
               --host 0.0.0.0
               --port 5000"
    ports:
      - "5000:5000"
```

Test the deployment:

```python
import requests
import json

def test_prediction():
    url = "http://localhost:8080/invocations"
    data = {
        "dataframe_records": [
            {"tenure": 12, "monthly_charges": 70.35}
        ]
    }
    response = requests.post(url, json=data)
    return response.json() if response.status_code == 200 else None
```

**On failure:**
- Verify model URI: `mlflow models list`
- Check MLflow tracking server accessibility
- Ensure dependencies installed: review pip install in Dockerfile
- Check port availability: `netstat -tulpn | grep 8080` or `lsof -i :8080`
- Inspect container logs: `docker logs <container-id>`
- Verify model flavor compatibility with MLflow serving

### Step 2: Deploy with BentoML for Production Scale

BentoML provides advanced serving with better performance and deployment flexibility.

**Prerequisites:** Python model object or MLflow model URI.

Service definition:

```python
import bentoml
from bentoml.io import JSON, NumpyNdarray
import mlflow
import pandas as pd

# Load model from MLflow
mlflow.set_tracking_uri("http://mlflow-server:5000")
model = mlflow.sklearn.load_model("models:/customer-churn-classifier/Production")

# Save to BentoML store
bentoml.sklearn.save_model("customer_churn_classifier", model)

# Define service
@bentoml.service(resources={"cpu": "2"}, traffic={"timeout": 10})
class ChurnPredictionService:
    def __init__(self):
        self.model = bentoml.sklearn.get("customer_churn_classifier:latest").to_runner()

    @bentoml.api
    def predict(self, input_data: JSON) -> JSON:
        df = pd.DataFrame(input_data["instances"])
        predictions = self.model.predict_proba(df)
        return {"predictions": predictions.tolist()}
```

Build and containerize:

```bash
# Build Bento
bentoml build

# Containerize
bentoml containerize customer_churn_classifier:latest \
  --image-tag customer-churn:v1.0

# Run container
docker run -p 3000:3000 customer-churn:v1.0
```

Configuration (`bentofile.yaml`):

```yaml
service: "bentoml_service:ChurnPredictionService"
include:
  - "bentoml_service.py"
  - "preprocessing.py"
python:
  packages:
    - scikit-learn==1.0.2
    - pandas==1.4.0
    - mlflow==2.0.1
docker:
  distro: debian
  python_version: "3.9"
  cuda_version: null  # Set to "11.6" for GPU support
```

Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: churn-prediction
  labels:
    app: churn-prediction
spec:
  replicas: 3
  selector:
    matchLabels:
      app: churn-prediction
  template:
    metadata:
      labels:
        app: churn-prediction
    spec:
      containers:
      - name: model-server
        image: customer-churn:v1.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /livez
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readyz
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: churn-prediction-service
spec:
  type: LoadBalancer
  selector:
    app: churn-prediction
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

Deploy and test:

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get deployments
kubectl get pods
kubectl get services

# Test endpoint
EXTERNAL_IP=$(kubectl get svc churn-prediction-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -X POST http://$EXTERNAL_IP/predict \
  -H 'Content-Type: application/json' \
  -d '{"instances": [{"tenure": 12, "monthly_charges": 70.35}]}'
```

**On failure:**
- Verify BentoML installation: `bentoml --version`
- Check model in BentoML store: `bentoml models list`
- Ensure Docker daemon running: `docker ps`
- Verify Kubernetes cluster access: `kubectl cluster-info`
- Check resource limits: `kubectl describe nodes`
- Inspect pod logs: `kubectl logs <pod-name>`
- Verify service selector matches pod labels: `kubectl get pods --show-labels`

### Step 3: Implement Seldon Core for Advanced Features

Seldon Core enables multi-model serving, A/B testing, and explainability.

**Prerequisites:** Kubernetes cluster with Seldon Core operator installed.

Model wrapper:

```python
import logging
from typing import Dict, List
import numpy as np
import mlflow

logger = logging.getLogger(__name__)

class ChurnClassifier:
    def __init__(self):
        mlflow.set_tracking_uri("http://mlflow-server:5000")
        self.model = mlflow.sklearn.load_model(
            "models:/customer-churn-classifier/Production"
        )
        logger.info("Model loaded successfully")

    def predict(self, X: np.ndarray, features_names: List[str] = None) -> np.ndarray:
        logger.info(f"Received prediction request with shape {X.shape}")
        predictions = self.model.predict_proba(X)
        return predictions

    def predict_raw(self, request: Dict) -> Dict:
        instances = request.get("instances", [])
        X = np.array(instances)
        predictions = self.predict(X)
        return {"predictions": predictions.tolist()}
```

Deployment configuration:

```yaml
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: churn-classifier
  namespace: seldon
spec:
  name: churn-classifier
  predictors:
  - name: default
    replicas: 3
    componentSpecs:
    - spec:
        containers:
        - name: classifier
          image: your-registry/churn-classifier:v1.0
          env:
          - name: MLFLOW_TRACKING_URI
            value: "http://mlflow-server:5000"
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2"
              memory: "2Gi"
    graph:
      name: classifier
      type: MODEL
      endpoint:
        type: REST
```

A/B testing configuration:

```yaml
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: churn-classifier-ab
spec:
  name: churn-classifier-ab
  predictors:
  - name: champion
    replicas: 2
    traffic: 90
    componentSpecs:
    - spec:
        containers:
        - name: champion-model
          image: your-registry/churn-classifier:v1.0
    graph:
      name: champion-model
      type: MODEL
      parameters:
      - name: model_uri
        value: "models:/customer-churn-classifier@champion"
        type: STRING
  - name: challenger
    replicas: 1
    traffic: 10
    componentSpecs:
    - spec:
        containers:
        - name: challenger-model
          image: your-registry/churn-classifier:v2.0
    graph:
      name: challenger-model
      type: MODEL
      parameters:
      - name: model_uri
        value: "models:/customer-churn-classifier@challenger"
        type: STRING
```

Install and deploy:

```bash
# Install Seldon Core operator
kubectl create namespace seldon-system
helm install seldon-core seldon-core-operator \
  --repo https://storage.googleapis.com/seldon-charts \
  --namespace seldon-system \
  --set usageMetrics.enabled=true

# Create namespace for models
kubectl create namespace seldon

# Deploy model
kubectl apply -f seldon-deployment.yaml -n seldon

# Check status
kubectl get seldondeployments -n seldon
kubectl get pods -n seldon

# Test prediction
kubectl port-forward -n seldon svc/churn-classifier-default 8080:8000
curl -X POST http://localhost:8080/api/v1.0/predictions \
  -H 'Content-Type: application/json' \
  -d '{"data": {"ndarray": [[12, 70.35, 844.20]]}}'
```

**On failure:**
- Verify Seldon operator: `kubectl get pods -n seldon-system`
- Check deployment status: `kubectl describe seldondeployment -n seldon`
- Ensure image registry accessible from cluster
- Verify model URI resolution from within cluster
- Check RBAC permissions: `kubectl auth can-i list seldondeployments`
- Inspect model container logs: `kubectl logs <pod-name> -n seldon`

### Step 4: Implement Monitoring and Observability

Add Prometheus metrics and Grafana dashboards for model serving.

**Prerequisites:** Prometheus and Grafana installed in cluster.

Metrics instrumentation:

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time
import logging

logger = logging.getLogger(__name__)

PREDICTION_COUNTER = Counter(
    'model_predictions_total',
    'Total predictions',
    ['model_name', 'model_version']
)

PREDICTION_LATENCY = Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency',
    ['model_name', 'model_version'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

PREDICTION_ERRORS = Counter(
    'model_prediction_errors_total',
    'Prediction errors',
    ['model_name', 'model_version', 'error_type']
)

ACTIVE_REQUESTS = Gauge(
    'model_active_requests',
    'Active requests',
    ['model_name', 'model_version']
)

class MonitoredModel:
    def __init__(self, model, model_name, model_version):
        self.model = model
        self.model_name = model_name
        self.model_version = model_version
        start_http_server(8000)
        logger.info("Metrics server started on port 8000")

    def predict(self, X):
        ACTIVE_REQUESTS.labels(
            model_name=self.model_name,
            model_version=self.model_version
        ).inc()
        start_time = time.time()

        try:
            predictions = self.model.predict(X)
            PREDICTION_COUNTER.labels(
                model_name=self.model_name,
                model_version=self.model_version
            ).inc()
            PREDICTION_LATENCY.labels(
                model_name=self.model_name,
                model_version=self.model_version
            ).observe(time.time() - start_time)
            return predictions
        except Exception as e:
            PREDICTION_ERRORS.labels(
                model_name=self.model_name,
                model_version=self.model_version,
                error_type=type(e).__name__
            ).inc()
            logger.error(f"Prediction error: {e}")
            raise
        finally:
            ACTIVE_REQUESTS.labels(
                model_name=self.model_name,
                model_version=self.model_version
            ).dec()
```

Prometheus configuration:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'model-serving'
    kubernetes_sd_configs:
    - role: pod
      namespaces:
        names:
        - seldon
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_label_app]
      action: keep
      regex: churn-prediction
```

**On failure:**
- Verify Prometheus targets: `curl http://prometheus:9090/targets`
- Check metrics endpoint: `curl http://model-pod:8000/metrics`
- Ensure Kubernetes service discovery configured
- Verify Grafana data source connection
- Check firewall rules for metrics port

### Step 5: Implement Autoscaling

Configure horizontal pod autoscaling based on resource and custom metrics.

**Prerequisites:** Kubernetes metrics-server installed.

HPA configuration:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: churn-prediction-hpa
  namespace: seldon
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: churn-prediction
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

Deploy and test:

```bash
# Install metrics-server if needed
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Apply HPA
kubectl apply -f hpa.yaml

# Check status
kubectl get hpa -n seldon
kubectl describe hpa churn-prediction-hpa -n seldon

# Load test
kubectl run -it --rm load-generator --image=busybox --restart=Never -- \
  /bin/sh -c "while sleep 0.01; do wget -q -O- http://churn-prediction-service/predict; done"

# Watch scaling
kubectl get hpa -n seldon --watch
```

**On failure:**
- Verify metrics-server: `kubectl get deployment metrics-server -n kube-system`
- Check pod resource requests (HPA requires requests, not just limits)
- Verify custom metrics availability if configured
- Check RBAC permissions for HPA controller
- Review stabilization windows if scaling too slow

### Step 6: Implement Canary Deployment Strategy

Gradually roll out new model versions with automated traffic shifting and rollback.

**Prerequisites:** Seldon Core with multi-predictor support or service mesh.

Canary configuration:

```yaml
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: churn-classifier-canary
spec:
  name: churn-classifier-canary
  predictors:
  - name: stable
    replicas: 3
    traffic: 100
    componentSpecs:
    - spec:
        containers:
        - name: stable-model
          image: your-registry/churn-classifier:v1.0
    graph:
      name: stable-model
      type: MODEL
  - name: canary
    replicas: 1
    traffic: 0
    componentSpecs:
    - spec:
        containers:
        - name: canary-model
          image: your-registry/churn-classifier:v2.0
    graph:
      name: canary-model
      type: MODEL
```

Rollout automation:

```python
import time
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_traffic_split(stable_percent, canary_percent):
    cmd = f"""kubectl patch seldondeployment churn-classifier-canary -n seldon --type=json -p='[
        {{"op": "replace", "path": "/spec/predictors/0/traffic", "value": {stable_percent}}},
        {{"op": "replace", "path": "/spec/predictors/1/traffic", "value": {canary_percent}}}
    ]'"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        logger.info(f"Traffic updated: Stable={stable_percent}%, Canary={canary_percent}%")
    else:
        raise Exception(f"Traffic update failed: {result.stderr}")

def check_canary_health():
    # Query error rate and latency from Prometheus
    # Simplified - implement actual query
    error_rate = 0.01
    latency_p95 = 0.15

    if error_rate > 0.05 or latency_p95 > 1.0:
        logger.error(f"Canary unhealthy: error={error_rate}, p95={latency_p95}s")
        return False
    return True

def gradual_rollout():
    stages = [(95, 5), (90, 10), (75, 25), (50, 50), (0, 100)]

    for stable, canary in stages:
        logger.info(f"Rolling out stage: {canary}% to canary")
        update_traffic_split(stable, canary)
        time.sleep(300)  # 5 minutes stabilization

        if not check_canary_health():
            logger.error("Canary unhealthy, rolling back!")
            update_traffic_split(100, 0)
            return False

    logger.info("Canary rollout completed successfully")
    return True
```

**On failure:**
- Verify Seldon deployment has multiple predictors: `kubectl get seldondeployment -o yaml`
- Check traffic percentages sum to 100
- Ensure canary image exists and is pullable: `docker pull your-registry/churn-classifier:v2.0`
- Verify Prometheus metrics available for health checks
- Inspect logs for both versions: `kubectl logs -l seldon-deployment-id=churn-classifier-canary`

## Output Contract

### Successful Deployment
- Model server responds to HTTP POST requests at configured endpoint
- Response contains predictions in JSON format with confidence scores or class labels
- REST endpoint returns 200 status for valid inputs, 400/500 for errors
- Health check endpoints (/health, /livez, /readyz) return 200 when ready
- Prometheus metrics endpoint (/metrics) exposes request counts, latency histograms, error rates
- Kubernetes deployment shows READY pods equal to replica count
- Load balancer service has assigned external IP or hostname

### Artifacts Produced
- Container image(s) in registry with version tag
- Kubernetes deployment manifests applied to cluster
- Service endpoints configured and accessible
- Prometheus metrics configured and scraped
- Grafana dashboard JSON (optional)

### Validation Criteria
All items must pass:
- [ ] Model server responds to prediction requests with correct output format
- [ ] REST/gRPC endpoints functional and documented
- [ ] Docker containers build without errors and start successfully
- [ ] Kubernetes deployment creates expected number of replicas
- [ ] Load balancer exposes external endpoint with IP/hostname
- [ ] Liveness and readiness probes pass consistently
- [ ] Prometheus metrics exported and visible in Prometheus UI
- [ ] Grafana dashboards display real-time prediction metrics
- [ ] Autoscaling triggers and scales replicas under load test
- [ ] A/B test splits traffic according to configured percentages
- [ ] Canary deployment progresses through stages without manual intervention
- [ ] Rollback successfully routes 100% traffic to stable version when triggered

## Failure Handling

### Cold Start Latency
- **Symptom:** First request takes significantly longer than subsequent requests
- **Cause:** Model loading into memory on container startup
- **Resolution:** Configure readiness probe with adequate `initialDelaySeconds` (30-60s), implement model caching between requests, use pre-warming with warmup requests

### Memory Leaks
- **Symptom:** Memory usage grows steadily over time, eventual OOMKill
- **Cause:** Unreleased resources, accumulated request data, model caching without bounds
- **Resolution:** Monitor memory usage in Grafana, implement periodic container restarts, profile code for unclosed connections or data structures

### Dependency Conflicts
- **Symptom:** Container crashes on startup with import errors or version mismatches
- **Cause:** Model dependencies incompatible with serving framework base image
- **Resolution:** Pin exact dependency versions in requirements, test in Docker locally before deployment, use same Python version for training and serving

### Resource Limits Too Low
- **Symptom:** Pods OOMKilled or show CPU throttling
- **Cause:** Kubernetes limits set below actual usage
- **Resolution:** Profile resource usage under load, set limits at 150% of peak observed, configure appropriate requests for scheduling

### Missing Health Checks
- **Symptom:** Kubernetes routes traffic to pods that aren't ready, causing 503 errors
- **Cause:** No liveness/readiness probes configured
- **Resolution:** Implement `/health` or `/readyz` endpoints, configure probes in deployment spec, ensure probes return appropriate status codes

### No Rollback Strategy
- **Symptom:** Bad deployment requires manual intervention to recover
- **Cause:** Previous version not kept available
- **Resolution:** Use canary deployments with automated rollback, keep previous container image tagged and ready, maintain deployment history in version control

## Common Pitfalls

- **Ignoring Latency:** Focusing only on accuracy, not inference speed. Benchmark latency under load, optimize model/code, use request batching where appropriate.
- **Single Replica:** Running only one pod causes downtime during deployments and failures. Always use minimum 2 replicas, configure pod anti-affinity for availability.
- **No Monitoring:** Issues detected only after customer complaints. Implement comprehensive metrics from day one including prediction latency, error rates, and throughput.
- **GPU Not Utilized:** GPU nodes allocated but CUDA not visible to model. Set `NVIDIA_VISIBLE_DEVICES` environment variable, verify GPU allocation with `nvidia-smi` in container.

## Next Steps

- **monitor-ml-model-performance** - Set up model drift detection and performance degradation alerts
- **register-ml-model** - Register new model versions before deploying them
- **deploy-to-kubernetes** - Apply general Kubernetes deployment patterns and best practices
- **run-ab-test-models** - Implement statistical A/B testing between model versions
- **orchestrate-ml-pipeline** - Automate model retraining and deployment workflows

## References

- [Extended Examples](references/EXAMPLES.md) - Complete configuration files and templates for all deployment patterns
- MLflow Model Serving documentation: https://mlflow.org/docs/latest/models.html
- BentoML Documentation: https://docs.bentoml.com/
- Seldon Core Documentation: https://docs.seldon.io/
- Kubernetes HPA Documentation: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
- Prometheus Query Language: https://prometheus.io/docs/prometheus/latest/querying/basics/
