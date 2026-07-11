#!/bin/sh
# Container entrypoint: run nginx (upstream, :8081) + oauth2-proxy (front, :8080).
set -e

# Build the email allow-list at runtime so it is VISIBLE in the Cloud Run console
# (Revisions -> Variables & Secrets). If ALLOWED_EMAILS env var is set
# (comma-separated), it overrides the file baked into the image; otherwise the
# baked-in /etc/oauth2-proxy/authenticated-emails.txt is kept as a fallback.
if [ -n "${ALLOWED_EMAILS:-}" ]; then
  echo "${ALLOWED_EMAILS}" | tr ',' '\n' | sed '/^[[:space:]]*$/d' \
    > /etc/oauth2-proxy/authenticated-emails.txt
fi

# Start nginx in the background (default alpine CMD runs it in foreground with
# 'daemon off;'; calling `nginx` plainly makes it daemonize).
nginx

# Hand the foreground to oauth2-proxy. Secrets arrive via OAUTH2_PROXY_* env vars
# (CLIENT_ID / CLIENT_SECRET / COOKIE_SECRET) set by Cloud Run — never baked in.
exec oauth2-proxy --config=/etc/oauth2-proxy/oauth2-proxy.cfg
