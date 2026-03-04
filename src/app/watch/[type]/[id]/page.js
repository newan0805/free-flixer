"use client";

import { useState, useEffect, useCallback, use } from "react";
import { tmdbService } from "@controllers/tmdb";
import { getAvailableServers, getSavedServer, saveServer, getEmbedUrl } from "@utils/servers";
import { myList } from "@utils/myList";

const WatchPage = ({ params }) => {
  const unwrappedParams = use(params);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialServers = getAvailableServers();
  const initialSaved = getSavedServer() || (initialServers[0]?.id ?? '');

  const [selectedServer, setSelectedServer] = useState(() => initialSaved);
  const [availableServers] = useState(() => initialServers);
  const [currentUrl, setCurrentUrl] = useState(() => getEmbedUrl(initialSaved, {
    contentType: unwrappedParams.type,
    tmdbId: unwrappedParams.id,
    season: 1,
    episode: 1
  }));

  // Get URL parameters for season and episode
  const [urlParams, setUrlParams] = useState({ season: 1, episode: 1 });
  const [nextEpisode, setNextEpisode] = useState(null);
  const [showEpisodeEnd, setShowEpisodeEnd] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const fetchContentDetails = useCallback(async () => {
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
  }, [unwrappedParams.type, unwrappedParams.id]);

  useEffect(() => {
    // Parse URL parameters
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const season = parseInt(url.searchParams.get("season") || "1");
      const episode = parseInt(url.searchParams.get("episode") || "1");
      setUrlParams({ season, episode });
      
      // Check if in watch later
      const inList = myList.isInList(unwrappedParams.id, 'watch-later');
      setIsInWatchLater(inList);
    }

    fetchContentDetails();
  }, [fetchContentDetails, unwrappedParams.type, unwrappedParams.id]);

  useEffect(() => {
    // Update current URL when selection or params change
    const url = getEmbedUrl(selectedServer, {
      contentType: unwrappedParams.type,
      tmdbId: unwrappedParams.id,
      season: urlParams.season,
      episode: urlParams.episode
    });
    setCurrentUrl(url);
  }, [selectedServer, unwrappedParams.type, unwrappedParams.id, urlParams.season, urlParams.episode]);

  const handleServerChange = (serverId) => {
    setSelectedServer(serverId);
    saveServer(serverId);

    const url = getEmbedUrl(serverId, {
      contentType: unwrappedParams.type,
      tmdbId: unwrappedParams.id,
      season: urlParams.season,
      episode: urlParams.episode,
    });
    setCurrentUrl(url);
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
  // Calculate next episode
  useEffect(() => {
    if (unwrappedParams.type === 'tv' && content?.seasons) {
      const currentSeason = content.seasons.find(s => s.season_number === urlParams.season);
      if (currentSeason && currentSeason.episode_count > urlParams.episode) {
        setNextEpisode({
          season: urlParams.season,
          episode: urlParams.episode + 1,
          episodeCount: currentSeason.episode_count
        });
      } else if (content.seasons.some(s => s.season_number === urlParams.season + 1)) {
        setNextEpisode({
          season: urlParams.season + 1,
          episode: 1,
          episodeCount: content.seasons.find(s => s.season_number === urlParams.season + 1).episode_count
        });
      } else {
        setNextEpisode(null);
      }
    }
  }, [content, urlParams.season, urlParams.episode, unwrappedParams.type]);

  // Save watch state to myList
  const saveWatchState = useCallback(() => {
    if (unwrappedParams.type === 'tv') {
      const existingItems = myList.getItems();
      const itemIndex = existingItems.findIndex(i => i.id === unwrappedParams.id && i.type === unwrappedParams.type);
      
      const itemToSave = {
        id: unwrappedParams.id,
        type: unwrappedParams.type,
        title: content?.name || 'Unknown',
        poster: content?.poster_path || '',
        lastWatched: new Date().toISOString(),
        currentSeason: urlParams.season,
        currentEpisode: urlParams.episode,
      };

      if (itemIndex >= 0) {
        existingItems[itemIndex] = itemToSave;
      } else {
        existingItems.push(itemToSave);
      }
      
      localStorage.setItem('myList', JSON.stringify(existingItems));
    }
  }, [unwrappedParams.id, unwrappedParams.type, content, urlParams.season, urlParams.episode]);

  const handlePlayNext = useCallback(() => {
    if (nextEpisode) {
      saveWatchState();
      window.location.href = `/watch/${unwrappedParams.type}/${unwrappedParams.id}?season=${nextEpisode.season}&episode=${nextEpisode.episode}`;
    }
  }, [nextEpisode, unwrappedParams.type, unwrappedParams.id, saveWatchState]);

  const handleAddToWatchLater = useCallback(() => {
    saveWatchState();
    if (isInWatchLater) {
      myList.removeItem(unwrappedParams.id, 'watch-later');
      setIsInWatchLater(false);
    } else {
      myList.addItem({
        id: unwrappedParams.id,
        type: 'watch-later',
        title: content?.name || content?.title || 'Unknown',
        poster: content?.poster_path || '',
        currentSeason: urlParams.season,
        currentEpisode: urlParams.episode,
      });
      setIsInWatchLater(true);
    }
  }, [isInWatchLater, unwrappedParams.id, content, urlParams.season, urlParams.episode, saveWatchState]);



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

      <main className="relative pt-16 md:pt-20">
        {/* Video Player Container */}
        <div className="relative w-full max-w-6xl mx-auto px-4 pt-6">
          {/* Responsive Video Container */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
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
                  onClick={() => {
                    saveWatchState();
                    window.history.back();
                  }}
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

        {/* Server Selection - Bottom Bar with Glassmorphism */}
        {availableServers.length > 1 && (
          <div className="max-w-6xl mx-auto px-4 mt-6 mb-6">
            <div className="glass rounded-lg p-4 backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
              <label className="block text-gray-300 text-sm font-semibold mb-3">Select Server</label>
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={selectedServer}
                  onChange={(e) => handleServerChange(e.target.value)}
                  className="glass text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none bg-white/5 border border-white/20 hover:border-white/40 transition-all"
                >
                  {availableServers.map((server) => (
                    <option key={server.id} value={server.id} className="bg-black text-white">
                      {server.name}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  {availableServers.map((server) => (
                    <button
                      key={server.id}
                      onClick={() => handleServerChange(server.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all glass border ${
                        selectedServer === server.id
                          ? 'border-blue-400 text-blue-300 bg-blue-500/20'
                          : 'border-white/20 text-gray-300 hover:border-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {server.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Episode & Controls */}
        {unwrappedParams.type === 'tv' && (
          <div className="max-w-6xl mx-auto px-4 mb-6 flex flex-wrap gap-3">
            {nextEpisode && (
              <button
                onClick={handlePlayNext}
                className="glass px-6 py-3 rounded-lg font-semibold text-white bg-blue-600/40 border border-blue-400/60 hover:bg-blue-600/60 hover:border-blue-400 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Next Episode (S{nextEpisode.season}E{nextEpisode.episode})
              </button>
            )}
            
            <button
              onClick={handleAddToWatchLater}
              className={`glass px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 border ${
                isInWatchLater
                  ? 'text-green-300 bg-green-600/40 border-green-400/60 hover:bg-green-600/60 hover:border-green-400'
                  : 'text-white bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
              }`}
            >
              <svg className="w-5 h-5" fill={isInWatchLater ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"/>
              </svg>
              {isInWatchLater ? 'Saved to Watch Later' : 'Save to Watch Later'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WatchPage;
