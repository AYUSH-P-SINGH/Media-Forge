import assert from 'assert';
import config from '../src/config';
import storage from '../src/services/storageService';
import db from '../src/db';

async function runSmokeTests() {
  console.log('Running MediaForge TypeScript Smoke Tests...\n');

  // Test 1: Config validation
  assert.strictEqual(typeof config.port, 'number', 'Config port must be number');
  assert.strictEqual(typeof config.storageDir, 'string', 'Config storageDir must be string');
  console.log('  [PASS] Configuration module loaded correctly');

  // Test 2: Storage service SVG thumbnail generation
  const svg = storage.generateThumbnailSvg('sample_video.mp4', 'video/mp4');
  assert.ok(svg.includes('<svg'), 'Generated thumbnail must be valid SVG');
  assert.ok(svg.includes('MP4'), 'Generated thumbnail must contain extension label');
  console.log('  [PASS] SVG Thumbnail Generator passed');

  // Test 3: Database Manager in-memory operations
  await db.initialize('');
  const item = await db.insert({
    id: 'test-smoke-1',
    originalName: 'clip.mp4',
    fileName: 'clip-123.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 1048576,
    filePath: '/tmp/clip-123.mp4',
    status: 'QUEUED'
  });
  assert.strictEqual(item.id, 'test-smoke-1', 'Inserted item id must match');

  const retrieved = await db.findById('test-smoke-1');
  assert.ok(retrieved, 'Item must be retrievable from database');
  assert.strictEqual(retrieved?.status, 'QUEUED');
  console.log('  [PASS] Database resilient fallback CRUD passed');

  // Test 4: Health Check
  const health = await db.checkHealth();
  assert.strictEqual(health.status, 'healthy');
  console.log('  [PASS] Health check provider verification passed');

  // Clean up
  await db.delete('test-smoke-1');

  console.log('\nAll smoke tests passed successfully!');
}

runSmokeTests().catch(err => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
