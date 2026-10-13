import { MediaItem } from './types';

export const sampleMediaItems: MediaItem[] = [
  {
    id: 'smp-vid-01',
    original_name: 'ocean_4k_cinematic.mp4',
    storage_key: 'uploads/originals/ocean_4k_cinematic.mp4',
    content_type: 'video/mp4',
    file_size: 24510000,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    thumbnail_url: '/uploads/thumbnails/smp-vid-01.svg',
    metadata: {
      codec: 'H.264/AAC',
      dimensions: '1920x1080',
      estimatedDurationSeconds: 124.5,
      processingStage: 'COMPLETED',
      checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      transcodedVersions: [
        { profile: '720p', status: 'READY', format: 'mp4', downloadUrl: '#' },
        { profile: '480p', status: 'READY', format: 'mp4', downloadUrl: '#' }
      ]
    }
  },
  {
    id: 'smp-vid-02',
    original_name: 'drone_mountains_teaser.mp4',
    storage_key: 'uploads/originals/drone_mountains_teaser.mp4',
    content_type: 'video/mp4',
    file_size: 15200000,
    status: 'PROCESSING',
    created_at: new Date(Date.now() - 60000).toISOString(),
    thumbnail_url: '/uploads/thumbnails/smp-vid-02.svg',
    metadata: {
      codec: 'H.264',
      processingStage: 'TRANSCODING',
      dimensions: '1280x720'
    }
  },
  {
    id: 'smp-aud-03',
    original_name: 'podcast_episode_42.mp3',
    storage_key: 'uploads/originals/podcast_episode_42.mp3',
    content_type: 'audio/mpeg',
    file_size: 8900000,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    thumbnail_url: '/uploads/thumbnails/smp-aud-03.svg',
    metadata: {
      codec: 'AAC',
      estimatedDurationSeconds: 1420.0,
      processingStage: 'COMPLETED'
    }
  },
  {
    id: 'smp-img-04',
    original_name: 'hero_banner_raw.png',
    storage_key: 'uploads/originals/hero_banner_raw.png',
    content_type: 'image/png',
    file_size: 3200000,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    thumbnail_url: '/uploads/thumbnails/smp-img-04.svg',
    metadata: {
      codec: 'PNG',
      dimensions: '2560x1440',
      processingStage: 'COMPLETED'
    }
  },
  {
    id: 'smp-cor-05',
    original_name: 'corrupted_sample.mp4',
    storage_key: 'uploads/originals/corrupted_sample.mp4',
    content_type: 'video/mp4',
    file_size: 104000,
    status: 'FAILED',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    thumbnail_url: null,
    metadata: {
      processingStage: 'FAILED',
      error: 'Invalid container moov atom header'
    }
  }
];
