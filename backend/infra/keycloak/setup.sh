#!/bin/bash
set -e

KCADM="/opt/keycloak/bin/kcadm.sh"

echo "[setup] Authenticating..."
$KCADM config credentials \
  --server "$KEYCLOAK_URL" \
  --realm master \
  --user "$KEYCLOAK_ADMIN" \
  --password "$KEYCLOAK_ADMIN_PASSWORD"

echo "[setup] Granting manage-users to support-api service account..."
$KCADM add-roles \
  -r "$KEYCLOAK_REALM" \
  --uusername "service-account-support-api" \
  --cclientid "realm-management" \
  --rolename "manage-users"

$KCADM add-roles \
  -r "$KEYCLOAK_REALM" \
  --uusername "service-account-support-api" \
  --cclientid "realm-management" \
  --rolename "view-users"

echo "[setup] Done."
