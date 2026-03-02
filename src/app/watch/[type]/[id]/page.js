"use client";

import { useState, useEffect, use } from "react";
import { tmdbService } from "@controllers/tmdb";
import { getAvailableServers, getSavedServer, saveServer, getEmbedUrl } from "@utils/servers";
import Navigation from "@components/Navigation";

const WatchPage = ({ params }) => {
  const unwrappedParams = use(params);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedServer, setSelectedServer] = useState('');
  const [availableServers, setAvailableServers] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');

  // Get URL parameters for season and episode
  const [urlParams, setUrlParams] = useState({ season: 1, episode: 1 });

  useEffect(() => {
    // Parse URL parameters
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const season = parseInt(url.searchParams.get("season") || "1");
      const episode = parseInt(url.searchParams.get("episode") || "1");
      setUrlParams({ season, episode });
    }

    fetchContentDetails();
  }, [unwrappedParams.type, unwrappedParams.id]);

  useEffect(() => {
    // Initialize servers and selected server
    const servers = getAvailableServers();
    const savedServer = getSavedServer();
    
    setAvailableServers(servers);
    setSelectedServer(savedServer);
    
    // Generate initial URL
    const url = getEmbedUrl(savedServer, {
      contentType: unwrappedParams.type,
      tmdbId: unwrappedParams.id,
      season: urlParams.season,
      episode: urlParams.episode
    });
    setCurrentUrl(url);
  }, [unwrappedParams.type, unwrappedParams.id, urlParams.season, urlParams.episode]);

  const fetchContentDetails = async () => {
    try {
      setIsLoading(true);
      let data;

      if (unwrappedParams.type === "movie") {
        data = await tmdbService.getMovieDetails(unwrappedParams.id);
      } else {
        data = await tmdbService.getTVDetails(unwrappedParams.id);
      }

      setContent(data);
    } catch (error) {
      console.error("Error fetching content details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Vidsrc embed URL
  const getVidsrcUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_VIDSRC_BASE_URL;

    if (unwrappedParams.type === "movie") {
      return `${baseUrl}/movie/${unwrappedParams.id}`;
    } else {
      // Use season and episode from URL parameters
      return `${baseUrl}/tv/${unwrappedParams.id}/${urlParams.season}/${urlParams.episode}`;
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Fullscreen not supported or permission denied");
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.log("Fullscreen exit failed");
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
      <div className="min-h-screen">
        {/* <Navigation /> */}
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const title = unwrappedParams.type === "movie" ? content.title : content.name;
  const subtitle =
    unwrappedParams.type === "movie"
      ? `${content.release_date ? content.release_date.split("-")[0] : ""} • ${content.genres ? content.genres.map((g) => g.name).join(", ") : ""}`
      : `${content.first_air_date ? content.first_air_date.split("-")[0] : ""} • ${content.genres ? content.genres.map((g) => g.name).join(", ") : ""}`;

  return (
    <div className="min-h-screen">
      {/* <Navigation /> */}

      <main className="relative pt-16 md:pt-20 glass">
        {/* Server Selection */}
        {availableServers.length > 1 && (
          <div className="max-w-6xl mx-auto px-4 mb-4">
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

        {/* Player Wrapper */}
        <div className="relative w-full max-w-6xl mx-auto px-4 pt-6">
          {/* Responsive Video Container */}
          <div className="relative w-full max-w-6xl mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src={currentUrl || getVidsrcUrl()}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${title} Video Player`}
            />

            {/* Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-white text-lg md:text-2xl font-bold">
                    {title}
                  </h1>
                  <p className="text-gray-300 text-sm md:text-base">
                    {subtitle}
                  </p>
                </div>

                <button
                  onClick={() => window.history.back()}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg
                    className="w-6 h-6 md:w-7 md:h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchPage;
