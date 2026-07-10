# ESSENCE Hub — Documents Site (static HTML review site) for Cloud Run
# AUTH MODEL: oauth2-proxy (Google) sits IN FRONT of nginx, in ONE container.
#   - oauth2-proxy listens on :8080  (the Cloud Run port)  -> does Google login
#   - nginx listens on :8081 (loopback only) -> serves the static files
#   - only emails in authenticated-emails.txt are allowed through
# (We pivoted away from IAP: this project has no Google Cloud org, so IAP's
#  direct Cloud Run integration could not get a Google-managed OAuth client
#  — "Empty Google Account OAuth client" / 502. See runbook section 0.)
#
# Build context MUST be the REPO ROOT, e.g.:
#   docker build -f deploy/docs-site/Dockerfile -t docs-site .
#
# The image mirrors the repo layout under nginx's web root so all the existing
# RELATIVE links keep working unchanged (/docs/design/..., /dashboard/, /pipeline).

# --- stage 1: grab the official oauth2-proxy binary -------------------------
FROM quay.io/oauth2-proxy/oauth2-proxy:v7.7.1 AS proxy

# --- stage 2: nginx + oauth2-proxy in one image -----------------------------
FROM nginx:1.27-alpine

# oauth2-proxy binary
COPY --from=proxy /bin/oauth2-proxy /usr/local/bin/oauth2-proxy

# nginx now serves internally on :8081 (see nginx.conf)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/docs-site/nginx.conf /etc/nginx/conf.d/default.conf

# Static content — keep the repo path structure intact.
COPY docs/design/erp-v2-ui-first/ /usr/share/nginx/html/docs/design/erp-v2-ui-first/

# Pipeline dashboard (fetches ../pipeline/status.json -> /pipeline/status.json).
COPY dashboard/       /usr/share/nginx/html/dashboard/
COPY dashboard.html   /usr/share/nginx/html/dashboard.html

# status.json is a BUILD-TIME SNAPSHOT. It is refreshed on every redeploy.
COPY pipeline/status.json /usr/share/nginx/html/pipeline/status.json

# oauth2-proxy static config + the email allow-list.
# NOTE: the allow-list is NOT a secret (just addresses) — it is baked in.
#       CLIENT_ID / CLIENT_SECRET / COOKIE_SECRET come from Cloud Run env vars,
#       they are NEVER baked into the image.
COPY deploy/docs-site/oauth2-proxy.cfg         /etc/oauth2-proxy/oauth2-proxy.cfg
COPY deploy/docs-site/authenticated-emails.txt /etc/oauth2-proxy/authenticated-emails.txt

# Start both processes (nginx daemonized, oauth2-proxy in foreground).
COPY deploy/docs-site/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/start.sh"]
