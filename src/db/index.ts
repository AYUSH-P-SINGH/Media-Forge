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
          idleTimeoutMillis: 10000
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
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
        file_path TEXT NOT NULL,
        thumbnail_url TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await this.pool.query(query);
  }


  async insert(item: CreateMediaDTO): Promise<MediaItem> {
    const now = new Date().toISOString();
    const record: MediaItem = {
      id: item.id,
      original_name: item.originalName,
      file_name: item.fileName,
      mime_type: item.mimeType,
      size_bytes: item.sizeBytes,
      status: item.status || 'QUEUED',
      file_path: item.filePath,
      thumbnail_url: item.thumbnailUrl || null,
      metadata: item.metadata || {},
      created_at: now,
      updated_at: now
    };

    if (this.isPostgres && this.pool) {
      const sql = `
        INSERT INTO media_items (id, original_name, file_name, mime_type, size_bytes, status, file_path, thumbnail_url, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const res: QueryResult<MediaItem> = await this.pool.query(sql, [
        record.id, record.original_name, record.file_name, record.mime_type,
        record.size_bytes, record.status, record.file_path, record.thumbnail_url,
        JSON.stringify(record.metadata), record.created_at, record.updated_at
      ]);
      return res.rows[0];
    } else {
      this.inMemoryStore.set(record.id, record);
      return { ...record };
    }
  }


  async findAll(): Promise<MediaItem[]> {
    if (this.isPostgres && this.pool) {
      const res: QueryResult<MediaItem> = await this.pool.query('SELECT * FROM media_items ORDER BY created_at DESC');
      return res.rows;
    }
    return Array.from(this.inMemoryStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }


  async findById(id: string): Promise<MediaItem | null> {
    if (this.isPostgres && this.pool) {
      const res: QueryResult<MediaItem> = await this.pool.query('SELECT * FROM media_items WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return this.inMemoryStore.get(id) || null;
  }


  async updateStatus(id: string, status: MediaStatus, metadata: Partial<MediaMetadata> = {}): Promise<MediaItem | null> {
    const now = new Date().toISOString();
    if (this.isPostgres && this.pool) {
      const sql = `
        UPDATE media_items
        SET status = $1, metadata = metadata || $2::jsonb, updated_at = $3
        WHERE id = $4
        RETURNING *;
      `;
      const res: QueryResult<MediaItem> = await this.pool.query(sql, [status, JSON.stringify(metadata), now, id]);
      return res.rows[0] || null;
    }
    const item = this.inMemoryStore.get(id);
    if (!item) return null;
    item.status = status;
    item.metadata = { ...item.metadata, ...metadata };
    item.updated_at = now;
    return { ...item };
  }


  async delete(id: string): Promise<MediaItem | null> {
    if (this.isPostgres && this.pool) {
      const res: QueryResult<MediaItem> = await this.pool.query('DELETE FROM media_items WHERE id = $1 RETURNING *', [id]);
      return res.rows[0] || null;
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
}

export const db = new DatabaseManager();
export default db;
