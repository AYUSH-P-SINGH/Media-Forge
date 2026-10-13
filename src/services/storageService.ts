import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config';

export class StorageService {
  public storageDir: string;
  public originalsDir: string;
  public processedDir: string;
  public thumbnailsDir: string;

  constructor() {
    this.storageDir = path.resolve(config.storageDir);
    this.originalsDir = path.join(this.storageDir, 'originals');
    this.processedDir = path.join(this.storageDir, 'processed');
    this.thumbnailsDir = path.join(this.storageDir, 'thumbnails');
    this.initDirectories();
  }

  public initDirectories(): void {
    [this.storageDir, this.originalsDir, this.processedDir, this.thumbnailsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filePath)) {
          return resolve('');
        }
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  generateThumbnailSvg(fileName: string, mimeType: string): string {
    const ext = path.extname(fileName).toUpperCase().replace('.', '') || 'FILE';
    const isVideo = (mimeType || '').startsWith('video');
    const isAudio = (mimeType || '').startsWith('audio');
    const isImage = (mimeType || '').startsWith('image');

    const bgColor = isVideo ? '#7c3aed' : isAudio ? '#059669' : isImage ? '#2563eb' : '#4b5563';
    const iconSymbol = isVideo ? '&#9654;' : isAudio ? '&#9835;' : isImage ? '&#128444;' : '&#128196;';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
      <defs>
        <linearGradient id="g_${ext}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="12" fill="url(#g_${ext})"/>
      <circle cx="120" cy="65" r="28" fill="rgba(255,255,255,0.12)"/>
      <text x="120" y="75" font-family="Segoe UI, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">${iconSymbol}</text>
      <text x="120" y="122" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="14" fill="#e2e8f0" text-anchor="middle" letter-spacing="1">${ext}</text>
    </svg>`;
  }

  async saveThumbnail(id: string, fileName: string, mimeType: string, imageBuffer?: Buffer): Promise<string> {
    this.initDirectories();
    if (imageBuffer) {
      const thumbPath = path.join(this.thumbnailsDir, `${id}.jpg`);
      await fs.promises.writeFile(thumbPath, imageBuffer);
      return `/uploads/thumbnails/${id}.jpg`;
    }

    const thumbPath = path.join(this.thumbnailsDir, `${id}.svg`);
    const svgContent = this.generateThumbnailSvg(fileName, mimeType);
    await fs.promises.writeFile(thumbPath, svgContent, 'utf-8');
    return `/uploads/thumbnails/${id}.svg`;
  }

  async saveProcessedOutput(id: string, profile: string, ext: string, content: Buffer | string): Promise<string> {
    this.initDirectories();
    const destPath = path.join(this.processedDir, `${id}_${profile}.${ext}`);
    if (typeof content === 'string') {
      if (fs.existsSync(content)) {
        await fs.promises.copyFile(content, destPath);
      }
    } else {
      await fs.promises.writeFile(destPath, content);
    }
    return destPath;
  }

  getProcessedUrl(id: string, profile: string, ext: string): string {
    return `/uploads/processed/${id}_${profile}.${ext}`;
  }

  async deleteFile(filePathOrKey: string): Promise<void> {
    try {
      if (!filePathOrKey) return;
      const fullPath = path.isAbsolute(filePathOrKey)
        ? filePathOrKey
        : path.join(this.storageDir, filePathOrKey);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err: any) {
      console.error(`[Storage] Failed to delete ${filePathOrKey}:`, err.message);
    }
  }

  async cleanupMedia(id: string, originalPath: string): Promise<void> {
    await this.deleteFile(originalPath);

    // Delete thumbnails (svg and jpg)
    await this.deleteFile(path.join(this.thumbnailsDir, `${id}.svg`));
    await this.deleteFile(path.join(this.thumbnailsDir, `${id}.jpg`));

    // Delete processed versions
    const files = await fs.promises.readdir(this.processedDir).catch(() => []);
    for (const f of files) {
      if (f.startsWith(`${id}_`)) {
        await this.deleteFile(path.join(this.processedDir, f));
      }
    }
  }

  isWritable(): boolean {
    try {
      this.initDirectories();
      const testFile = path.join(this.storageDir, '.write-test');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new StorageService();
export default storage;
