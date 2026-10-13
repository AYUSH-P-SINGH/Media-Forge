import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem } from './types';
import { sampleMediaItems } from './sampleData';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { UploadPage } from './components/UploadPage';
import { MediaLibrary } from './components/MediaLibrary';
import { MediaModal } from './components/MediaModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'library'>('dashboard');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [systemHealth, setSystemHealth] = useState<'ok' | 'degraded'>('degraded');
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMedia(json.data);
          setSystemHealth('ok');
          return;
        }
      }
      throw new Error('API request failed');
    } catch {
      // Fallback to sample data for standalone Phase 2 verification
      setMedia(prev => (prev.length > 0 ? prev : sampleMediaItems));
      setSystemHealth('degraded');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/healthz');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok') {
          setSystemHealth('ok');
          return;
        }
      }
      setSystemHealth('degraded');
    } catch {
      setSystemHealth('degraded');
    }
  }, []);

  useEffect(() => {
    fetchMedia();
    checkHealth();

    const interval = setInterval(() => {
      fetchMedia();
      checkHealth();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchMedia, checkHealth]);

  const handleUploadSuccess = (newItem: MediaItem) => {
    setMedia(prev => [newItem, ...prev.filter(m => m.id !== newItem.id)]);
  };

  const handleReprocess = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}/process`, { method: 'POST' });
      if (res.ok) {
        fetchMedia();
      }
    } catch (err) {
      console.error('Failed to trigger reprocess:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMedia(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        itemCount={media.length}
      />

      <main className="main-content">
        {loading ? (
          <div className="loading-state">
            <div className="status-spinner-lg"></div>
            <p>Loading MediaForge Platform...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                media={media}
                onNavigate={setActiveTab}
                onSelectMedia={setSelectedMedia}
              />
            )}

            {activeTab === 'upload' && (
              <UploadPage
                onUploadSuccess={handleUploadSuccess}
                onNavigateToLibrary={() => setActiveTab('library')}
              />
            )}

            {activeTab === 'library' && (
              <MediaLibrary
                media={media}
                onSelectMedia={setSelectedMedia}
                onReprocess={handleReprocess}
                onDelete={handleDelete}
                onRefresh={fetchMedia}
              />
            )}
          </>
        )}
      </main>

      <MediaModal
        item={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onReprocess={handleReprocess}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default App;
