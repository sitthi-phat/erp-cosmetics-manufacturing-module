#!/usr/bin/env bash
# =============================================================================
# ESSENCE Hub — Documents Site: build + deploy to Cloud Run + lock with IAP
# =============================================================================
# Phase-3-preview: publishes the STATIC review site (Document Hub / architecture
# / mockups / pipeline dashboard) so Pond + team can review from anywhere.
# Access is restricted to explicitly allow-listed Google accounts via IAP.
#
# !!! DO NOT RUN until Pond confirms PROJECT_ID, billing, and the email list. !!!
# Run from the REPO ROOT:   bash deploy/docs-site/deploy.sh
#
# Prereqs: gcloud SDK authenticated (`gcloud auth login`), billing enabled on
# the project, and the OAuth consent screen configured once (see runbook §4).
# =============================================================================
set -euo pipefail

# ------------------------- EDIT THESE (placeholders) -------------------------
PROJECT_ID="REPLACE_WITH_GCP_PROJECT_ID"     # e.g. essence-hub-docs
REGION="asia-southeast1"                       # Singapore — lowest latency for TH
SERVICE="essence-docs"                         # Cloud Run service name
AR_REPO="docs"                                 # Artifact Registry repo name

# Google accounts allowed to view the site (one per line). Personal gmail is OK.
ALLOWED_EMAILS=(
  "pond@example.com"
  # "someone.else@gmail.com"
)
# -----------------------------------------------------------------------------

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

echo "==> Project: ${PROJECT_ID}  Region: ${REGION}  Service: ${SERVICE}"
gcloud config set project "${PROJECT_ID}"

echo "==> 1) Enable required APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iap.googleapis.com

echo "==> 2) Ensure Artifact Registry repo exists"
gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker --location="${REGION}" \
    --description="ESSENCE Hub static docs images"

echo "==> 3) Build + push image via Cloud Build (uses deploy/docs-site/Dockerfile)"
gcloud builds submit \
  --config deploy/docs-site/cloudbuild.yaml \
  --substitutions=_IMAGE="${IMAGE}"

echo "==> 4) Deploy to Cloud Run (private: no unauthenticated access)"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --ingress=all \
  --no-allow-unauthenticated \
  --cpu=1 --memory=256Mi \
  --min-instances=0 --max-instances=2

echo "==> 5) Enable IAP on the Cloud Run service"
# Create the IAP service agent (idempotent) and let IAP invoke the service.
gcloud beta services identity create --service=iap.googleapis.com --project="${PROJECT_ID}"
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
gcloud run services add-iam-policy-binding "${SERVICE}" \
  --region="${REGION}" \
  --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# Turn IAP on for this Cloud Run resource.
gcloud beta iap web enable --resource-type=cloud-run --service="${SERVICE}" --region="${REGION}"

echo "==> 6) Grant per-user access (roles/iap.httpsResourceAccessor)"
for EMAIL in "${ALLOWED_EMAILS[@]}"; do
  echo "    + ${EMAIL}"
  gcloud beta iap web add-iam-policy-binding \
    --resource-type=cloud-run --service="${SERVICE}" --region="${REGION}" \
    --member="user:${EMAIL}" \
    --role="roles/iap.httpsResourceAccessor"
done

echo "==> DONE. Service URL:"
gcloud run services describe "${SERVICE}" --region="${REGION}" --format='value(status.url)'
echo "    (First open may show IAP Google sign-in; only allow-listed emails pass.)"
