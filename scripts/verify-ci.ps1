Write-Host "=== MediaForge Local CI/CD Pre-flight Verification ===" -ForegroundColor Cyan
Write-Host "[1/3] Checking TypeScript types..." -ForegroundColor Yellow
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript typecheck failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[2/3] Compiling production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build compilation failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[3/3] Executing automated smoke and integration tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Test execution failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "[OK] All MediaForge CI checks passed cleanly and ready for push!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
