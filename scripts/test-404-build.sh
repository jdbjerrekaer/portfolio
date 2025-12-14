#!/bin/bash
# Local test script that matches CI behavior for 404.html generation
# Usage: ./scripts/test-404-build.sh

set -euo pipefail

REPO_NAME="portfolio"
BASE_PATH="/$REPO_NAME"

echo "=== Testing 404.html Build Process ==="
echo "Repository name: $REPO_NAME"
echo "Base path: $BASE_PATH"
echo ""

# Step 1: Build (matching CI)
echo "Step 1: Building static site..."
BASE_PATH="$BASE_PATH" NEXT_PUBLIC_BASE_PATH="$BASE_PATH" npm run build
touch out/.nojekyll

echo "✓ Build completed"
echo ""

# Step 2: Fix 404.html (matching CI)
echo "Step 2: Fixing 404.html to use custom NotFoundContent..."
BASE_PATH="$BASE_PATH" node scripts/fix-404.js
echo ""

# Step 3: Verify (matching CI verification logic)
echo "Step 3: Verifying 404.html..."
SOURCE_FILE="out/404.html"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "✗ Error: 404.html does not exist"
  exit 1
fi

if [ ! -s "$SOURCE_FILE" ]; then
  echo "✗ Error: 404.html exists but is empty"
  exit 1
fi

echo "✓ File has content"

if grep -q "NotFoundContent" "$SOURCE_FILE" || grep -q "Page not found" "$SOURCE_FILE"; then
  echo "✓ Custom 404 content detected (NotFoundContent or 'Page not found' found)"
  echo "Sample matches:"
  grep -o "NotFoundContent\|Page not found" "$SOURCE_FILE" | head -3 || true
else
  echo "✗ ERROR: Custom content NOT found in 404.html"
  if grep -qi "this page could not be found" "$SOURCE_FILE"; then
    echo "✗ Found default Next.js 404 message"
    exit 1
  else
    echo "⚠ Warning: No custom content markers found"
    exit 1
  fi
fi

echo ""
echo "=== Test Passed ==="
echo "✓ 404.html is ready with custom NotFoundContent"
