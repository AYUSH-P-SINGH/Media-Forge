# MediaForge

### Cloud-Native Media Processing Platform & Kubernetes DevSecOps Project

MediaForge is a full-stack media processing platform designed to demonstrate how a web application can be **containerized, deployed, secured, scaled, monitored, and operated on Kubernetes** using modern DevOps and DevSecOps practices.

The application allows users to upload media, track processing status, and access processed outputs.

The primary focus of the project is the **production-style infrastructure and engineering practices built around the application**.

---

## Project Goals

MediaForge is being developed to explore and demonstrate:

* Containerization with Docker
* Kubernetes deployment and management
* Application scaling
* CI/CD automation
* GitOps
* Kubernetes security
* DevSecOps
* Monitoring and observability
* Failure testing
* Disaster recovery
* Infrastructure as Code
* Cloud deployment

---

## Core Features

### Media Management

* Upload media files
* View uploaded media
* Track processing status
* Access processed media
* Generate processed video versions
* Generate thumbnails
* Store media metadata

### Backend

* REST API
* PostgreSQL persistence
* Media processing
* File validation
* Error handling
* Health-check endpoints
* Structured logging

### Frontend

* Media upload interface
* Media library
* Processing status
* Media details
* Processed-media access

---

## Project Structure

```
Media-Forge/
├── src/
│   ├── config/              # Centralized environment configuration
│   ├── controllers/         # REST API route controllers
│   ├── db/                  # Database connection and initialization
│   ├── routes/              # Express route definitions
│   ├── services/            # Business logic and media processing
│   ├── types/               # TypeScript type definitions
│   ├── app.ts               # Express application setup
│   └── server.ts            # Server entry point
├── public/
│   ├── index.html           # Frontend UI
│   ├── style.css            # Frontend styles
│   └── app.js               # Frontend application logic
├── tests/
│   ├── smoke.test.ts        # Fast sanity & unit smoke tests
│   └── integration.test.ts  # End-to-end HTTP integration tests
├── k8s/                     # Kubernetes declarative manifests
│   ├── namespace.yaml       # Namespace with Pod Security Standards
│   ├── configmap.yaml       # Application configuration
│   ├── secret.yaml          # Sensitive credentials
│   ├── pvc.yaml             # Persistent storage claims
│   ├── app-deployment.yaml  # MediaForge app deployment & probes
│   ├── app-service.yaml     # ClusterIP & NodePort routing
│   ├── db-deployment.yaml   # PostgreSQL deployment
│   ├── db-service.yaml      # PostgreSQL internal service
│   ├── ingress.yaml         # Ingress rules with body size limits
│   ├── hpa.yaml             # Horizontal Pod Autoscaler (2-10 replicas)
│   ├── network-policy.yaml  # Zero-trust network segmentation
│   └── kustomization.yaml   # Kustomize manifest bundle
├── uploads/                 # Local media file storage
├── Dockerfile               # Multi-stage, non-root container definition
├── docker-compose.yml       # Local multi-container setup
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variable template
├── .dockerignore            # Docker build exclusions
└── .gitignore               # Git exclusions
```

---

## Getting Started

### Prerequisites

* **Node.js** v18+
* **npm** v9+
* **Docker** & **Docker Compose**
* **PostgreSQL** (or use the Docker Compose setup)

### Local Development

```bash
# Clone the repository
git clone https://github.com/<your-username>/Media-Forge.git
cd Media-Forge

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

### Docker Compose

```bash
# Build and start all services
docker compose up --build

# Stop all services
docker compose down
```

### Available Scripts

| Command                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start development server with HMR                |
| `npm run build`         | Compile TypeScript to JavaScript                 |
| `npm start`             | Run the production build                         |
| `npm run typecheck`     | Type-check without emitting files                |
| `npm test`              | Run full test suite (smoke + integration)        |
| `npm run test:smoke`    | Run smoke tests for config, DB fallback, & SVG   |
| `npm run test:integration` | Run end-to-end HTTP integration test suite    |

---

## DevOps & DevSecOps

The application will progressively be transformed from a local full-stack application into a production-style Kubernetes workload.

The project will implement:

* Docker containerization
* Docker Compose for local development
* Kubernetes
* Helm
* GitHub Actions
* GitOps with Argo CD
* Kubernetes security policies
* RBAC
* NetworkPolicies
* Container vulnerability scanning
* Secret scanning
* SAST
* SBOM generation
* Container image signing
* Monitoring
* Centralized logging
* Alerting
* Failure testing
* Disaster recovery
* Infrastructure as Code

---

## Kubernetes

MediaForge will be deployed on Kubernetes with production-style practices including:

* Deployments
* Services
* ConfigMaps
* Secrets
* Ingress
* Persistent Storage
* Resource Requests and Limits
* Liveness Probes
* Readiness Probes
* Horizontal Pod Autoscaling
* Rolling Updates
* Rollbacks
* RBAC
* NetworkPolicies

The project is configured for deployment on local clusters (**kind or Minikube**) or cloud managed clusters (**AWS EKS**):

```bash
# 1. Preview rendered declarative resources
kubectl kustomize k8s/

# 2. Deploy entire MediaForge stack to Kubernetes
kubectl apply -k k8s/

# 3. Verify rollout and pod status
kubectl get pods -n mediaforge -o wide
kubectl get svc,pvc,hpa,ingress -n mediaforge

# 4. Access application via NodePort (Minikube / kind)
minikube service mediaforge-app -n mediaforge --url
# Or visit http://localhost:30500 directly

# 5. Perform zero-downtime rolling update
kubectl set image deployment/mediaforge-app mediaforge-app=mediaforge:v0.2.0 -n mediaforge
kubectl rollout status deployment/mediaforge-app -n mediaforge

# 6. Verify and perform instant deployment rollback
kubectl rollout history deployment/mediaforge-app -n mediaforge
kubectl rollout undo deployment/mediaforge-app -n mediaforge
```

---

## CI/CD & DevSecOps (Phase 4)

MediaForge features a comprehensive, multi-stage DevSecOps pipeline implemented in GitHub Actions ([`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)). Every code change undergoes rigorous quality checks, static analysis, secret detection, vulnerability scanning, SBOM generation, container publishing to GHCR, and cryptographic signing with Cosign.

### Pipeline Architecture

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                    GitHub Actions CI/CD                     │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
         ┌───────────────────────┼──────────────────────┐
         ▼                       ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Automated Tests │   │ Secret Scanning  │   │     SAST Scan    │
│  TypeCheck+Build │   │  (Gitleaks v8)   │   │ (Semgrep OWASP)  │
│ Smoke+Integration│   │ Commit History   │   │  SARIF CodeScan  │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Trivy FS Scan    │
                       │ Dependencies CVE │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Docker Buildx   │
                       │ Non-root Alpine  │
                       └────────┬─────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
┌──────────────────┐                         ┌──────────────────┐
│  Trivy Container │                         │  Syft SBOM Gen   │
│ OS & Lib CVEs    │                         │ CycloneDX + SPDX │
│ SARIF CodeScan   │                         │  JSON Artifacts  │
└────────┬─────────┘                         └────────┬─────────┘
         │                                             │
         └──────────────────────┬──────────────────────┘
                                │ (On push to main / tag)
                                ▼
                       ┌──────────────────┐
                       │   GHCR Registry  │
                       │ Publish OCI Image│
                       └────────┬─────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
┌──────────────────┐                         ┌──────────────────┐
│  Cosign Signing  │                         │ Cosign SBOM      │
│  Keyless OIDC    │                         │ In-toto          │
│  Sigstore Rekor  │                         │ Attestation      │
└────────┬─────────┘                         └────────┬─────────┘
         │                                             │
         └──────────────────────┬──────────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Cryptographic    │
                       │ Verification     │
                       └──────────────────┘
```

### Security Layers & Tooling

| Stage | Technology | Focus & Standards |
|---|---|---|
| **Automated Tests** | TypeScript / `tsx` | Strict typecheck (`tsc --noEmit`), build check, smoke test & HTTP integration suite |
| **Secret Scanning** | **Gitleaks** v8 | Scans complete Git history and PR diffs against custom [`.gitleaks.toml`](.gitleaks.toml) baseline |
| **SAST** | **Semgrep** | Scans for OWASP Top 10 vulnerabilities, code smells, and unsafe patterns. Generates SARIF |
| **Vulnerability Scanning** | **Aqua Trivy** | Scans filesystem packages and multi-stage container image for HIGH and CRITICAL CVEs |
| **SBOM Generation** | **Syft** (Anchore) | Generates industry-standard CycloneDX (`cyclonedx-json`) and SPDX (`spdx-json`) bill of materials |
| **Container Registry** | **GHCR** | Publishes OCI container images with semantic version, branch, and commit SHA tags to `ghcr.io` |
| **Cryptographic Signing** | **Sigstore Cosign** | Keyless container signing using GitHub Actions OIDC; verifies provenance against Sigstore transparency log |
| **SBOM Attestation** | **Cosign Attest** | Cryptographically links the generated SPDX SBOM directly to the container image digest in GHCR |

### Pulling and Verifying MediaForge Container Images

MediaForge container images published to GHCR can be independently verified by any auditor or Kubernetes cluster admission controller:

```bash
# 1. Pull the container image from GitHub Container Registry
docker pull ghcr.io/<your-username>/media-forge:latest

# 2. Cryptographically verify the image signature using Cosign (Keyless)
cosign verify ghcr.io/<your-username>/media-forge:latest \
  --certificate-identity-regexp "(?i)^https://github.com/<your-username>/media-forge/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"

# 3. Cryptographically verify the attached SBOM attestation
cosign verify-attestation --type spdxjson ghcr.io/<your-username>/media-forge:latest \
  --certificate-identity-regexp "(?i)^https://github.com/<your-username>/media-forge/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

### Local DevSecOps Execution

You can run the same test and validation steps locally:

```bash
# Run complete test and build validation
npm run ci

# Run smoke tests
npm run test:smoke

# Run end-to-end integration tests
npm run test:integration
```

---

## GitOps

Argo CD will be used to implement GitOps-based deployment.

The desired Kubernetes state will be maintained in Git, allowing:

* Declarative deployments
* Automated synchronization
* Deployment history
* Configuration tracking
* Rollbacks
* Drift detection

---

## Kubernetes Security

Kyverno will be used to enforce Kubernetes security policies.

Planned policies include:

* Required resource limits
* Required labels
* Secure container configuration
* Approved container registries
* Image verification
* Pod security controls

Additional Kubernetes security measures will include:

* RBAC
* NetworkPolicies
* Non-root containers
* Restricted container permissions
* Secure secrets management

---

## Observability

MediaForge will include a production-style observability stack.

### Metrics

Prometheus will be used to monitor:

* HTTP request rate
* HTTP error rate
* API latency
* CPU utilization
* Memory utilization
* Pod health
* Media processing performance
* Application failures

### Dashboards

Grafana will provide dashboards for application and Kubernetes metrics.

### Logging

Loki will provide centralized application and infrastructure logs.

### Alerting

Alertmanager will be used for operational alerts such as:

* High error rates
* High CPU usage
* High memory usage
* Pod failures
* Application availability problems
* Processing failures

---

## Reliability & Failure Testing

MediaForge will intentionally be tested under failure conditions.

Planned scenarios include:

* Application crashes
* Container failures
* Worker failures
* Database connectivity problems
* Resource exhaustion
* High request load
* Invalid media files
* Failed deployments
* Kubernetes pod failures

The objective is to verify not only that the application works, but also that the infrastructure can **detect, recover from, and handle failures**.

---

## Disaster Recovery

The project will include disaster-recovery planning and testing.

Areas of focus:

* Database backups
* Persistent-data backups
* Kubernetes state recovery
* Restore procedures
* Recovery testing
* Backup validation
* Recovery documentation

Potential technologies include:

* Velero
* Kubernetes/etcd backup mechanisms
* PostgreSQL backup tools

---

## Infrastructure as Code

Terraform will be introduced to manage infrastructure as code.

The project will initially focus on local development and can later be extended to cloud infrastructure.

Potential cloud environment:

**AWS / EKS**

Cloud deployment is optional; the core project can be developed and demonstrated entirely on a local machine.

---

## Technology Stack

### Application

| Component        | Technology        |
| ---------------- | ----------------- |
| Frontend         | React             |
| Backend          | Node.js / Express |
| Database         | PostgreSQL        |
| Media Processing | FFmpeg            |
| Storage          | Object Storage    |

### DevOps

| Area               | Technology      |
| ------------------ | --------------- |
| Containerization   | Docker          |
| Orchestration      | Kubernetes      |
| Package Management | Helm            |
| Local Kubernetes   | kind / Minikube |
| CI/CD              | GitHub Actions  |
| Container Registry | GHCR            |
| GitOps             | Argo CD         |

### Security

| Area                   | Technology |
| ---------------------- | ---------- |
| Vulnerability Scanning | Trivy      |
| Secret Scanning        | Gitleaks   |
| SAST                   | Semgrep    |
| SBOM                   | Syft       |
| Image Signing          | Cosign     |
| Policy Enforcement     | Kyverno    |
| Runtime Security       | Falco      |

### Observability

| Area       | Technology   |
| ---------- | ------------ |
| Metrics    | Prometheus   |
| Dashboards | Grafana      |
| Logging    | Loki         |
| Alerting   | Alertmanager |

### Infrastructure

| Area                   | Technology           |
| ---------------------- | -------------------- |
| Infrastructure as Code | Terraform            |
| Disaster Recovery      | Velero / etcd Backup |
| Cloud                  | AWS / EKS            |

---

## Development Roadmap

### Phase 1 — Application
- [x] Application frontend & dashboard
- [x] Backend REST API (Express + TypeScript)
- [x] PostgreSQL persistence with resilient fallback
- [x] Media upload with validation & checksums
- [x] Media processing pipeline & thumbnail generation
- [x] Persistent media storage
- [x] Processing status tracking & reprocess workflow
- [x] Structured error handling & Prometheus metrics

### Phase 2 — Docker
- [x] Multi-stage, non-root Dockerfiles
- [x] Production-ready Docker Compose orchestration
- [x] Container health checks (liveness / readiness)
- [x] Automated smoke & integration test suite

### Phase 3 — Kubernetes
- [x] Deployments (Application & PostgreSQL)
- [x] Services (ClusterIP & NodePort routing)
- [x] ConfigMaps (Centralized platform configuration)
- [x] Secrets (Secure credentials & connection strings)
- [x] Persistent Storage (ReadWriteOnce PVCs for uploads and DB)
- [x] Ingress (Nginx ingress with 50MB body size)
- [x] Health Probes (Liveness & readiness probes)
- [x] Resource Limits (CPU & memory requests/limits)
- [x] Horizontal Pod Autoscaler (2-10 replicas with CPU/memory targets)
- [x] Rolling Updates (Zero-downtime rolling update strategy)
- [x] Rollbacks (Declarative revision rollback procedures)
- [x] NetworkPolicies (Zero-trust database & workload segmentation)

### Phase 4 — CI/CD

- [x] GitHub Actions (Multi-stage DevSecOps workflow)
- [x] Automated tests (TypeScript typecheck, build validation, smoke & integration suites)
- [x] SAST (Semgrep scanning OWASP Top 10, Security Audit, with SARIF upload)
- [x] Gitleaks (Git commit history secret detection with custom baseline config)
- [x] Trivy (Filesystem dependency scanning & container vulnerability scanning)
- [x] SBOM (Syft generating CycloneDX & SPDX JSON bill-of-materials)
- [x] GHCR (Automated container publishing to GitHub Container Registry)
- [x] Cosign (Sigstore keyless OIDC container signing & SBOM attestation)

### Phase 5 — GitOps

- [ ] Helm
- [ ] Argo CD
- [ ] Automated synchronization
- [ ] Deployment rollback
- [ ] Drift detection

### Phase 6 — Kubernetes Security

- [ ] RBAC
- [ ] NetworkPolicies
- [ ] Kyverno
- [ ] Pod security hardening
- [ ] Image verification

### Phase 7 — Observability

- [ ] Prometheus
- [ ] Grafana
- [ ] Loki
- [ ] Alertmanager
- [ ] Application metrics
- [ ] Centralized logging
- [ ] Alerts

### Phase 8 — Reliability

- [ ] Failure testing
- [ ] Load testing
- [ ] Pod recovery
- [ ] Deployment rollback testing
- [ ] Resource exhaustion testing

### Phase 9 — Disaster Recovery

- [ ] Database backups
- [ ] Persistent-data backup
- [ ] Kubernetes backup
- [ ] Velero
- [ ] Restore testing
- [ ] Recovery documentation

### Phase 10 — Cloud

- [ ] Terraform
- [ ] AWS infrastructure
- [ ] EKS
- [ ] Production networking
- [ ] Cloud monitoring

---

## Engineering Focus

MediaForge is designed to demonstrate practical experience with:

```text
Linux · Docker · Kubernetes · Helm · GitHub Actions · CI/CD · GitOps
DevSecOps · Kyverno · RBAC · NetworkPolicies · Observability
Autoscaling · Infrastructure as Code · Reliability Engineering
Disaster Recovery · Cloud Infrastructure
```

The project follows an iterative engineering workflow:

```text
Learn → Build → Test → Containerize → Deploy → Secure → Observe → Break → Recover → Automate → Document
```

---

## Why MediaForge?

The application is intentionally focused so that the infrastructure remains the main engineering challenge.

The project explores questions such as:

* How should a full-stack application be containerized?
* How should it be deployed on Kubernetes?
* How can applications scale automatically?
* How can deployments be made reproducible?
* How can insecure images be detected before deployment?
* How can Kubernetes policies prevent unsafe configurations?
* How can application and infrastructure failures be detected?
* How can failed deployments be rolled back?
* How can logs and metrics be centralized?
* How can application data be backed up and restored?
* How can infrastructure eventually be provisioned using code?

---

## Future Improvements

* OpenTelemetry
* Distributed tracing
* Advanced media processing
* S3-compatible object storage
* CDN integration
* Falco runtime security
* Advanced Kubernetes autoscaling
* Multi-environment GitOps
* Multi-node Kubernetes clusters
* AWS EKS deployment
* Automated disaster-recovery testing

---

## License

This project is licensed under the **MIT License**.
