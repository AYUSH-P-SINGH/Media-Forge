import assert from 'assert';
import http from 'http';
import { createApp } from '../src/app';

const TEST_PORT = 5099;

function request(
  method: string,
  path: string,
  body?: Buffer | string,
  headers?: Record<string, string>
): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method,
      headers: headers || {},
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode || 0, body: parsed, raw: data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function buildMultipartBody(
  fieldname: string,
  filename: string,
  mimeType: string,
  content: Buffer
): { body: Buffer; boundary: string } {
  const boundary = '----MediaForgeBoundary' + Math.random().toString(36).substring(2);
  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fieldname}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([header, content, footer]);
  return { body, boundary };
}

async function runIntegrationTests() {
  console.log('MediaForge Integration Tests\n');
  console.log('Starting test server on port', TEST_PORT, '...\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // ── Health endpoints ──────────────────────────────────
    {
      const res = await request('GET', '/healthz');
      assert.strictEqual(res.status, 200, 'GET /healthz must return 200');
      assert.strictEqual(res.body.status, 'ok', '/healthz status must be "ok"');
      assert.ok(res.body.uptimeSeconds >= 0, '/healthz must include uptime');
      assert.ok(res.body.timestamp, '/healthz must include timestamp');
      console.log('  [PASS] GET /healthz — liveness probe');
    }

    {
      const res = await request('GET', '/readyz');
      assert.strictEqual(res.status, 200, 'GET /readyz must return 200');
      assert.ok(
        res.body.status === 'ready' || res.body.status === 'not_ready',
        '/readyz status must be "ready" or "not_ready"'
      );
      assert.ok(res.body.database, '/readyz must report database health');
      assert.ok(res.body.storage, '/readyz must report storage health');
      console.log('  [PASS] GET /readyz — readiness probe');
    }

    // ── Prometheus metrics ────────────────────────────────
    {
      const res = await request('GET', '/metrics');
      assert.strictEqual(res.status, 200, 'GET /metrics must return 200');
      assert.ok(
        res.raw.includes('mediaforge_http_requests_total'),
        '/metrics must expose request counter'
      );
      assert.ok(
        res.raw.includes('mediaforge_uptime_seconds'),
        '/metrics must expose uptime gauge'
      );
      console.log('  [PASS] GET /metrics — Prometheus-format metrics');
    }

    // ── Media API: list initial media ─────────────────────
    {
      const res = await request('GET', '/api/v1/media');
      assert.strictEqual(res.status, 200, 'GET /api/v1/media must return 200');
      assert.strictEqual(res.body.success, true, 'success must be true');
      assert.ok(Array.isArray(res.body.data), 'data must be an array');
      assert.ok(res.body.stats, 'response must include stats');
      console.log('  [PASS] GET /api/v1/media — media list');
    }

    // ── Media API: upload without file ─────────────────────
    {
      const res = await request('POST', '/api/v1/media/upload', '', {
        'Content-Type': 'application/json',
      });
      assert.strictEqual(res.status, 400, 'Upload without file must return 400');
      assert.strictEqual(res.body.success, false, 'success must be false');
      console.log('  [PASS] POST /api/v1/media/upload (no file) — 400 error');
    }

    // ── Media API: upload unsupported file type ───────────
    {
      const fileContent = Buffer.from('console.log("malicious or unsupported script");');
      const { body, boundary } = buildMultipartBody('file', 'test.js', 'text/javascript', fileContent);
      const res = await request('POST', '/api/v1/media/upload', body, {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      });
      assert.strictEqual(res.status, 400, 'Unsupported file type must return 400');
      assert.strictEqual(res.body.success, false, 'success must be false');
      console.log('  [PASS] POST /api/v1/media/upload (unsupported MIME) — 400 error');
    }

    // ── Media API: upload valid media file ─────────────────
    let createdMediaId = '';
    {
      const fakeVideo = Buffer.from('FAKE-VIDEO-HEADER-CONTENT-MEDIAFORGE-TEST');
      const { body, boundary } = buildMultipartBody('file', 'sample_test.mp4', 'video/mp4', fakeVideo);
      const res = await request('POST', '/api/v1/media/upload', body, {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      });
      assert.strictEqual(res.status, 201, 'Valid upload must return 201 Created');
      assert.strictEqual(res.body.success, true, 'success must be true');
      assert.ok(res.body.data.id, 'Uploaded item must have an id');
      assert.strictEqual(res.body.data.original_name, 'sample_test.mp4');
      assert.strictEqual(res.body.data.mime_type, 'video/mp4');
      assert.ok(res.body.data.thumbnail_url, 'Thumbnail URL must be generated');
      createdMediaId = res.body.data.id;
      console.log(`  [PASS] POST /api/v1/media/upload (valid file: ${createdMediaId}) — 201 Created`);
    }

    // ── Media API: get by id ───────────────────────────────
    {
      const res = await request('GET', `/api/v1/media/${createdMediaId}`);
      assert.strictEqual(res.status, 200, 'GET /api/v1/media/:id must return 200');
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, createdMediaId);
      console.log('  [PASS] GET /api/v1/media/:id (existing item) — 200 OK');
    }

    // ── Media API: get processing status (Phase 3 & 5 endpoint) ────────
    {
      const res = await request('GET', `/api/media/${createdMediaId}/status`);
      assert.strictEqual(res.status, 200, 'GET /api/media/:id/status must return 200');
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, createdMediaId);
      assert.ok(typeof res.body.data.progressPercent === 'number', 'progressPercent must be a number');
      assert.ok(res.body.data.status, 'status must be returned');
      console.log('  [PASS] GET /api/media/:id/status (processing status check) — 200 OK');
    }

    // ── Media API: download media endpoint ─────────────────
    {
      const res = await request('GET', `/api/media/${createdMediaId}/download`);
      assert.strictEqual(res.status, 200, 'GET /api/media/:id/download must return 200');
      assert.ok(res.raw.length > 0, 'Downloaded file must contain content');
      console.log('  [PASS] GET /api/media/:id/download (download media) — 200 OK');
    }

    // ── Media API: check /api/media compatibility route ───
    {
      const res = await request('GET', '/api/media');
      assert.strictEqual(res.status, 200, 'GET /api/media must return 200');
      assert.strictEqual(res.body.success, true);
      console.log('  [PASS] GET /api/media (roadmap route alias) — 200 OK');
    }

    // ── Media API: reprocess media ─────────────────────────
    {
      const res = await request('POST', `/api/v1/media/${createdMediaId}/process`);
      assert.strictEqual(res.status, 200, 'POST /api/v1/media/:id/process must return 200');
      assert.strictEqual(res.body.success, true);
      console.log('  [PASS] POST /api/v1/media/:id/process (existing item) — 200 OK');
    }

    // ── Media API: reprocess non-existent item ─────────────
    {
      const res = await request('POST', '/api/v1/media/non-existent-id/process');
      assert.strictEqual(res.status, 404, 'Reprocess non-existent must return 404');
      assert.strictEqual(res.body.success, false);
      console.log('  [PASS] POST /api/v1/media/:id/process (not found) — 404 error');
    }

    // ── Media API: get non-existent item ───────────────────
    {
      const res = await request('GET', '/api/v1/media/non-existent-id');
      assert.strictEqual(res.status, 404, 'Non-existent media must return 404');
      assert.strictEqual(res.body.success, false, 'success must be false');
      console.log('  [PASS] GET /api/v1/media/:id (not found) — 404 error');
    }

    // ── Media API: delete item ─────────────────────────────
    {
      const res = await request('DELETE', `/api/v1/media/${createdMediaId}`);
      assert.strictEqual(res.status, 200, 'DELETE /api/v1/media/:id must return 200');
      assert.strictEqual(res.body.success, true);
      console.log('  [PASS] DELETE /api/v1/media/:id (existing item) — 200 OK');
    }

    // ── Media API: verify deletion ─────────────────────────
    {
      const res = await request('GET', `/api/v1/media/${createdMediaId}`);
      assert.strictEqual(res.status, 404, 'Deleted media must return 404');
      console.log('  [PASS] GET /api/v1/media/:id (after deletion) — verified removed (404)');
    }

    // ── Media API: delete non-existent item ────────────────
    {
      const res = await request('DELETE', '/api/v1/media/non-existent-id');
      assert.strictEqual(res.status, 404, 'Delete non-existent must return 404');
      console.log('  [PASS] DELETE /api/v1/media/:id (not found) — 404 error');
    }

    // ── 404 handler ────────────────────────────────────────
    {
      const res = await request('GET', '/api/v1/nonexistent');
      assert.strictEqual(res.status, 404, 'Unknown route must return 404');
      assert.strictEqual(res.body.success, false, 'success must be false');
      console.log('  [PASS] GET /unknown-route — 404 handler');
    }

    // ── Static file serving ────────────────────────────────
    {
      const res = await request('GET', '/');
      assert.strictEqual(res.status, 200, 'GET / must return 200');
      assert.ok(
        res.raw.includes('MediaForge'),
        'Root must serve the frontend HTML'
      );
      console.log('  [PASS] GET / — static frontend served');
    }

    console.log('\n========================================');
    console.log('✓ All integration tests passed cleanly!');
    console.log('========================================\n');
  } catch (err: any) {
    console.error('\n✗ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runIntegrationTests();
