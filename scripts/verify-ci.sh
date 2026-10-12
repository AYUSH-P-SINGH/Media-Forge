#!/usr/bin/env bash
set -euo pipefail

echo "=== MediaForge Local CI/CD Pre-flight Verification ==="
echo "[1/3] Checking TypeScript types..."
npm run typecheck

echo "[2/3] Compiling production bundle..."
npm run build

echo "[3/3] Executing automated smoke and integration tests..."
npm test

echo "====================================================="
echo "✓ All MediaForge CI checks passed cleanly and ready for push!"
echo "====================================================="
