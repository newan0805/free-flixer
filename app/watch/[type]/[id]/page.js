'use client';

import { useState, useEffect, use } from 'react';
import { tmdbService } from '../../../../controllers/tmdb';
import Navigation from '../../../../components/Navigation';

const WatchPage = ({ params }) => {
  const unwrappedParams = use(params);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchContentDetails();
  }, [unwrappedParams.type, unwrappedParams.id]);

  const fetchContentDetails = async () => {
    try {
      setIsLoading(true);
      let data;
      
      if (unwrappedParams.type === 'movie') {
        data = await tmdbService.getMovieDetails(unwrappedParams.id);
      } else {
        data = await tmdbService.getTVDetails(unwrappedParams.id);
      }
      
      setContent(data);
    } catch (error) {
      console.error('Error fetching content details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Vidsrc embed URL
  const getVidsrcUrl = () => {
    const baseUrl = 'https://vidsrc.icu/embed';
    
    if (unwrappedParams.type === 'movie') {
      return `${baseUrl}/movie/${unwrappedParams.id}`;
    } else {
      // For TV shows, we'll use the first season, first episode as default
      return `${baseUrl}/tv/${unwrappedParams.id}/1/1`;
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen not supported or permission denied');
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.log('Fullscreen exit failed');
      });
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      setVolume(0);
    } else {
      setVolume(1);
    }
  };

  if (isLoading || !content) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const title = unwrappedParams.type === 'movie' ? content.title : content.name;
  const subtitle = unwrappedParams.type === 'movie' 
    ? `${content.release_date ? content.release_date.split('-')[0] : ''} • ${content.genres ? content.genres.map(g => g.name).join(', ') : ''}`
    : `${content.first_air_date ? content.first_air_date.split('-')[0] : ''} • ${content.genres ? content.genres.map(g => g.name).join(', ') : ''}`;

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <main className="relative">
        {/* Video Player */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={getVidsrcUrl()}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={`${title} Video Player`}
          />
        </div>

        {/* Video Controls Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black to-transparent z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold">{title}</h1>
              <p className="text-gray-300">{subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Volume Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchPage;