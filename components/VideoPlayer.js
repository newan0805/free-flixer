import React, { useState, useRef, useEffect } from 'react';

const VideoPlayer = ({ title, onClose, type = 'movie', tmdbId, season = 1, episode = 1 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const iframeRef = useRef(null);

  // Generate Vidsrc embed URL
  const getVidsrcUrl = () => {
    const baseUrl = 'https://vidsrc-embed.ru/embed';
    
    if (type === 'movie') {
      return `${baseUrl}/movie/${tmdbId}`;
    } else {
      return `${baseUrl}/tv/${tmdbId}/${season}-${episode}`;
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

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && showControls) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

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

  const handleMouseMove = () => {
    if (isPlaying) {
      setShowControls(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] overflow-hidden">
      {/* Video Area */}
      <div 
        className="relative w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={() => isPlaying && setShowControls(!showControls)}
      >
        {/* Video Player */}
        <div className="absolute inset-0">
          {/* Video Info Overlay */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black to-transparent z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-2xl font-bold">{title}</h2>
                <p className="text-gray-300">{type === 'movie' ? 'Movie' : `TV Show • S${season}E${episode}`}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors z-20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Video Content */}
          <div className="absolute inset-0 bg-black">
            {isPlaying ? (
              <iframe
                ref={iframeRef}
                src={getVidsrcUrl()}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                title={`${title} Video Player`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-2xl z-10"
                >
                  <svg className="w-12 h-12 text-white ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Volume Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
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
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20"
                    disabled={isMuted}
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
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;