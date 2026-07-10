#!/usr/bin/env bash
# =============================================================================
# ESSENCE Hub — Documents Site: build + deploy to Cloud Run, guarded by
# oauth2-proxy (Google login, per-email allow-list). Cost target ~0, no LB.
# =============================================================================
# Publishes the STATIC review site (Document Hub / architecture / mockups /
# pipeline dashboard) so Pond + team can review from anywhere. oauth2-proxy runs
# in the SAME container in front of nginx; only emails in authenticated-emails.txt
# can pass.
#
# WHY NOT IAP: this project has no Google Cloud org, so IAP's direct Cloud Run
# integration could not obtain a Google-managed OAuth client ("Empty Google
# Account OAuth client" / 502). We pivoted to oauth2-proxy. See runbook section 0.
#
# PREREQS (Pond, once):
#   1) OAuth 2.0 Client (type: Web application) exists  ->  put id+secret in
#      deploy/docs-site/oauth.env  (gitignored; template = oauth.env.example)
#   2) That client's "Authorized redirect URIs" INCLUDES:
#      https://essence-docs-238060462485.asia-southeast1.run.app/oauth2/callback
#
# Run from the REPO ROOT:   bash deploy/docs-site/deploy.sh
# =============================================================================
set -euo pipefail

# ------------------------------- settings ------------------------------------
PROJECT_ID="essence-hub-502015"                # confirmed by Pond (billing enabled)
REGION="asia-southeast1"                        # Singapore — lowest latency for TH
SERVICE="essence-docs"                          # Cloud Run service name
AR_REPO="docs"                                  # Artifact Registry repo name
SERVICE_URL="https://essence-docs-238060462485.asia-southeast1.run.app"
ENV_FILE="deploy/docs-site/oauth.env"           # gitignored — holds client id/secret
# Email allow-list lives in deploy/docs-site/authenticated-emails.txt (baked in image).
# -----------------------------------------------------------------------------

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

echo "==> Project: ${PROJECT_ID}  Region: ${REGION}  Service: ${SERVICE}"
gcloud config set project "${PROJECT_ID}"

# --- 0) Load + validate OAuth client credentials -----------------------------
echo "==> 0) Load OAuth client credentials from ${ENV_FILE}"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Copy oauth.env.example -> oauth.env and fill it." >&2
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "${ENV_FILE}"; set +a
: "${OAUTH2_PROXY_CLIENT_ID:?missing OAUTH2_PROXY_CLIENT_ID in oauth.env}"
: "${OAUTH2_PROXY_CLIENT_SECRET:?missing OAUTH2_PROXY_CLIENT_SECRET in oauth.env}"
if [[ "${OAUTH2_PROXY_CLIENT_ID}" == REPLACE_* || "${OAUTH2_PROXY_CLIENT_SECRET}" == REPLACE_* ]]; then
  echo "ERROR: ${ENV_FILE} still holds placeholder values. Fill in the real client id/secret." >&2
  exit 1
fi

# Fresh cookie secret every deploy (32 bytes, url-safe base64).
COOKIE_SECRET="$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')"

# --- 1) Enable required APIs -------------------------------------------------
echo "==> 1) Enable required APIs"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# --- 2) Ensure Artifact Registry repo exists ---------------------------------
echo "==> 2) Ensure Artifact Registry repo exists"
gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker --location="${REGION}" \
    --description="ESSENCE Hub static docs images"

# --- 3) Build + push image via Cloud Build -----------------------------------
echo "==> 3) Build + push image (deploy/docs-site/Dockerfile: nginx + oauth2-proxy)"
gcloud builds submit \
  --config deploy/docs-site/cloudbuild.yaml \
  --substitutions=_IMAGE="${IMAGE}"

# --- 4) Deploy to Cloud Run --------------------------------------------------
# --allow-unauthenticated: oauth2-proxy INSIDE the container enforces auth.
# --no-iap: make sure the old IAP integration is OFF (we pivoted away from it).
echo "==> 4) Deploy to Cloud Run (auth handled by oauth2-proxy, IAP off)"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --port=8080 \
  --ingress=all \
  --allow-unauthenticated \
  --no-iap \
  --cpu=1 --memory=256Mi \
  --min-instances=0 --max-instances=2 \
  --set-env-vars="^@^OAUTH2_PROXY_CLIENT_ID=${OAUTH2_PROXY_CLIENT_ID}@OAUTH2_PROXY_CLIENT_SECRET=${OAUTH2_PROXY_CLIENT_SECRET}@OAUTH2_PROXY_COOKIE_SECRET=${COOKIE_SECRET}"

echo "==> DONE. Service URL: ${SERVICE_URL}"
echo "    Verify:  curl -sI ${SERVICE_URL}/   -> expect 302 to accounts.google.com (oauth2-proxy working)"
echo "    Reminder: the OAuth client MUST list this redirect URI:"
echo "              ${SERVICE_URL}/oauth2/callback"
echo "    Allow-list = deploy/docs-site/authenticated-emails.txt (add/remove email -> rerun this script)."
