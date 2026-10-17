import { EventEmitter } from 'events';
import { Pool, QueryResult } from 'pg';
import { MediaItem, CreateMediaDTO, MediaStatus, MediaMetadata } from '../types/media';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  provider: 'postgresql' | 'in-memory';
  count?: number;
  error?: string;
}

export class DatabaseManager extends EventEmitter {
  private pool: Pool | null = null;
  public isPostgres = false;
  private inMemoryStore: Map<string, MediaItem> = new Map();

  async initialize(databaseUrl: string): Promise<void> {
    if (databaseUrl && databaseUrl.trim() !== '') {
      try {
        this.pool = new Pool({
          connectionString: databaseUrl,
          connectionTimeoutMillis: 3000,
          idleTimeoutMillis: 10000,
        });

        const client = await this.pool.connect();
        client.release();
        this.isPostgres = true;
        console.log('[DB] Connected successfully to PostgreSQL.');
        await this.createTables();
        return;
      } catch (err: any) {
        console.warn('[DB] PostgreSQL connection failed (' + err.message + '). Falling back to in-memory store.');
        this.isPostgres = false;
        this.pool = null;
      }
    } else {
      console.log('[DB] Operating in embedded in-memory data store mode.');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.isPostgres || !this.pool) return;
    const query = `
      CREATE TABLE IF NOT EXISTS media_items (
        id VARCHAR(64) PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        storage_key TEXT DEFAULT '',
        content_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_url TEXT,
        metadata JSONB DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE media_items ADD COLUMN IF NOT EXISTS storage_key TEXT DEFAULT '';
      ALTER TABLE media_items ADD COLUMN IF NOT EXISTS content_type VARCHAR(100) DEFAULT '';
      ALTER TABLE media_items ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
    `;
    await this.pool.query(query);
  }

  async insert(item: CreateMediaDTO): Promise<MediaItem> {
    const now = new Date().toISOString();
    const storageKey = item.storageKey || item.filePath;
    const contentType = item.mimeType;
    const fileSize = item.sizeBytes;

    const record: MediaItem = {
      id: item.id,
      original_name: item.originalName,
      storage_key: storageKey,
      content_type: contentType,
      file_size: fileSize,
      status: item.status || 'QUEUED',
      created_at: now,
      file_name: item.fileName,
      mime_type: item.mimeType,
      size_bytes: item.sizeBytes,
      file_path: item.filePath,
      thumbnail_url: item.thumbnailUrl || null,
      metadata: item.metadata || {},
      updated_at: now,
    };

    if (this.isPostgres && this.pool) {
      const sql = `
        INSERT INTO media_items (
          id, original_name, storage_key, content_type, file_size,
          status, created_at, file_name, mime_type, size_bytes,
          file_path, thumbnail_url, metadata, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      const res: QueryResult<any> = await this.pool.query(sql, [
        record.id,
        record.original_name,
        record.storage_key,
        record.content_type,
        record.file_size,
        record.status,
        record.created_at,
        record.file_name,
        record.mime_type,
        record.size_bytes,
        record.file_path,
        record.thumbnail_url,
        JSON.stringify(record.metadata),
        record.updated_at,
      ]);
      return this.normalizeRecord(res.rows[0]);
    } else {
      this.inMemoryStore.set(record.id, record);
      return { ...record };
    }
  }

  async findAll(): Promise<MediaItem[]> {
    if (this.isPostgres && this.pool) {
      const res: QueryResult<any> = await this.pool.query('SELECT * FROM media_items ORDER BY created_at DESC');
      return res.rows.map(row => this.normalizeRecord(row));
    }
    return Array.from(this.inMemoryStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async findById(id: string): Promise<MediaItem | null> {
    if (this.isPostgres && this.pool) {
      const res: QueryResult<any> = await this.pool.query('SELECT * FROM media_items WHERE id = $1', [id]);
      return res.rows[0] ? this.normalizeRecord(res.rows[0]) : null;
    }
    return this.inMemoryStore.get(id) || null;
  }

  async updateStatus(
    id: string,
    status: MediaStatus,
    metadata: Partial<MediaMetadata> = {},
    thumbnailUrl?: string
  ): Promise<MediaItem | null> {
    const now = new Date().toISOString();
    if (this.isPostgres && this.pool) {
      const sql = thumbnailUrl
        ? `
          UPDATE media_items
          SET status = $1, metadata = metadata || $2::jsonb, thumbnail_url = $3, updated_at = $4
          WHERE id = $5
          RETURNING *;
        `
        : `
          UPDATE media_items
          SET status = $1, metadata = metadata || $2::jsonb, updated_at = $3
          WHERE id = $4
          RETURNING *;
        `;
      const params = thumbnailUrl
        ? [status, JSON.stringify(metadata), thumbnailUrl, now, id]
        : [status, JSON.stringify(metadata), now, id];
      const res: QueryResult<any> = await this.pool.query(sql, params);
      return res.rows[0] ? this.normalizeRecord(res.rows[0]) : null;
    }
    const item = this.inMemoryStore.get(id);
    if (!item) return null;
    item.status = status;
    item.metadata = { ...item.metadata, ...metadata };
    if (thumbnailUrl) {
      item.thumbnail_url = thumbnailUrl;
    }
    item.updated_at = now;
    return { ...item };
  }

  async delete(id: string): Promise<MediaItem | null> {
    if (this.isPostgres && this.pool) {
      const res: QueryResult<any> = await this.pool.query('DELETE FROM media_items WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] ? this.normalizeRecord(res.rows[0]) : null;
    }
    const item = this.inMemoryStore.get(id);
    if (item) {
      this.inMemoryStore.delete(id);
      return item;
    }
    return null;
  }

  async checkHealth(): Promise<HealthCheckResult> {
    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('SELECT 1');
        return { status: 'healthy', provider: 'postgresql' };
      } catch (err: any) {
        return { status: 'degraded', provider: 'postgresql', error: err.message };
      }
    }
    return { status: 'healthy', provider: 'in-memory', count: this.inMemoryStore.size };
  }

  private normalizeRecord(row: any): MediaItem {
    return {
      id: row.id,
      original_name: row.original_name,
      storage_key: row.storage_key || row.file_path,
      content_type: row.content_type || row.mime_type,
      file_size: parseInt(String(row.file_size || row.size_bytes || 0), 10),
      status: row.status as MediaStatus,
      created_at: typeof row.created_at === 'object' ? row.created_at.toISOString() : String(row.created_at),
      file_name: row.file_name,
      mime_type: row.mime_type || row.content_type,
      size_bytes: parseInt(String(row.size_bytes || row.file_size || 0), 10),
      file_path: row.file_path,
      thumbnail_url: row.thumbnail_url || null,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
      updated_at: typeof row.updated_at === 'object' ? row.updated_at.toISOString() : String(row.updated_at),
    };
  }
}

export const db = new DatabaseManager();
export default db;
