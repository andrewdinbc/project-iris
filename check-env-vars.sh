#!/bin/bash

echo "🔐 PROJECT-IRIS ENVIRONMENT VARIABLES CHECK"
echo "==========================================="
echo ""

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "BLOB_READ_WRITE_TOKEN"
  "BREVO_API_KEY"
)

echo "Checking required environment variables:"
echo ""

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ $var: NOT SET"
    ((MISSING++))
  else
    # Show first 10 chars and last 4 chars (masked)
    value="${!var}"
    masked="${value:0:10}...${value: -4}"
    echo "✅ $var: $masked"
  fi
done

echo ""
echo "==========================================="
if [ $MISSING -eq 0 ]; then
  echo "✅ All required variables are configured"
else
  echo "❌ Missing $MISSING environment variable(s)"
  exit 1
fi
