'use client';

import { useState, useEffect } from 'react';
import { getAvailableServers, getSavedServer, saveServer, getEmbedUrl } from '@utils/servers';

const VideoPlayer = ({ title, onClose, type = 'movie', tmdbId, season = 1, episode = 1 }) => {
  const [selectedServer, setSelectedServer] = useState('');
  const [availableServers, setAvailableServers] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Initialize servers and selected server
    const servers = getAvailableServers();
    const savedServer = getSavedServer();
    
    setAvailableServers(servers);
    setSelectedServer(savedServer);
    
    // Generate initial URL
    const url = getEmbedUrl(savedServer, {
      contentType: type,
      tmdbId,
      season,
      episode
    });
    setCurrentUrl(url);
  }, [type, tmdbId, season, episode]);

  const handleServerChange = (serverId) => {
    setSelectedServer(serverId);
    saveServer(serverId);
    
    const url = getEmbedUrl(serverId, {
      contentType: type,
      tmdbId,
      season,
      episode
    });
    setCurrentUrl(url);
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Video Title */}
      <div className="absolute top-4 left-4 right-4 text-center z-10">
        <h2 className="text-white text-xl sm:text-2xl font-bold">{title}</h2>
        <p className="text-gray-300 text-sm">{type === 'movie' ? 'Movie' : `TV Show • Season ${season} Episode ${episode}`}</p>
      </div>

      {/* Server Selection */}
      {availableServers.length > 1 && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="glass rounded-lg p-3">
            <label className="block text-gray-300 text-xs mb-2">Server</label>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={selectedServer}
                onChange={(e) => handleServerChange(e.target.value)}
                className="glass text-white px-3 py-1 rounded-md text-xs font-medium focus:outline-none"
              >
                {availableServers.map((server) => (
                  <option key={server.id} value={server.id} className="bg-black">
                    {server.name}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2">
                {availableServers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => handleServerChange(server.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors glass border ${
                      selectedServer === server.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                    } hover:bg-white/10`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Container - Responsive iframe */}
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        {currentUrl ? (
          <iframe
            src={currentUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={`${title} Video Player`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Loading video...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;