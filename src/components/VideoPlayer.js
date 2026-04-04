"use client";

import { useState, useMemo } from "react";
import {
  getAvailableServers,
  getSavedServer,
  saveServer,
  getEmbedUrl,
} from "@utils/servers";
import { myList } from "@utils/myList";

const VideoPlayer = ({
  title,
  onClose,
  type = "movie",
  tmdbId,
  season = 1,
  episode = 1,
  seasons = [], // array of {season_number, episode_count}
  enableDefense = true, // New prop to control defense toggle
}) => {
  // Initialize available servers and selected server lazily to avoid
  // calling setState synchronously inside an effect.
  const initialServers = getAvailableServers();
  const initialSaved = getSavedServer() || (initialServers[0]?.id ?? "");

  const [selectedServer, setSelectedServer] = useState(() => initialSaved);
  const [availableServers] = useState(() => initialServers);

  // TV-specific season/episode selectors
  const [tvSeason, setTvSeason] = useState(() => {
    if (type === "tv") {
      const progress = myList.getWatchProgress(tmdbId);
      return progress ? progress.season : season;
    }
    return season;
  });
  const [tvEpisode, setTvEpisode] = useState(() => {
    if (type === "tv") {
      const progress = myList.getWatchProgress(tmdbId);
      return progress ? progress.episode : episode;
    }
    return episode;
  });

  // Defense toggle state
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);

  const currentUrl = useMemo(
    () =>
      getEmbedUrl(selectedServer, {
        contentType: type,
        tmdbId,
        season: type === "tv" ? tvSeason : season,
        episode: type === "tv" ? tvEpisode : episode,
      }),
    [selectedServer, type, tmdbId, season, episode, tvSeason, tvEpisode],
  );

  const handleServerChange = (serverId) => {
    setSelectedServer(serverId);
    saveServer(serverId);
    // currentUrl is memoized from `selectedServer`, updating selectedServer
    // will recompute the URL via the `useMemo` above.
  };

  const handleSeasonChange = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setTvSeason(num);
      setTvEpisode(1); // reset episode when season changes
      // Save progress immediately when changing seasons
      if (type === "tv") {
        myList.saveWatchProgress(tmdbId, num, 1);
      }
    }
  };

  const handleEpisodeChange = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setTvEpisode(num);
      // Save progress immediately when changing episodes
      if (type === "tv") {
        myList.saveWatchProgress(tmdbId, tvSeason, num);
      }
    }
  };

  const handleNextEpisode = () => {
    setTvEpisode((prev) => prev + 1);
    // Save progress immediately when changing episodes
    if (type === "tv") {
      myList.saveWatchProgress(tmdbId, tvSeason, tvEpisode + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20 bg-black/50 p-2 rounded-full"
      >
        ✕
      </button>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-white text-xl sm:text-2xl font-bold">{title}</h2>
        <p className="text-gray-400 text-sm">
          {type === "movie"
            ? "Movie"
            : `TV Show • Season ${tvSeason} Episode ${tvEpisode}`}
        </p>
      </div>

      {/* Defense Toggle */}
      {enableDefense && (
        <div className="mb-4 glass backdrop-blur-md bg-white/10 rounded-xl px-6 py-4 w-full max-w-4xl">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col min-w-[160px]">
              <label className="text-gray-400 text-xs mb-2 tracking-wide">
                AD-BLOCK FLAG
              </label>
              <select
                value={adBlockEnabled ? 1 : 0}
                onChange={(e) => setAdBlockEnabled(e.target.value === "1")}
                className="h-10 px-3 rounded-md bg-white/5 border border-white/20 text-white text-sm focus:outline-none"
              >
                <option value="1">1 (Enabled - Defensive)</option>
                <option value="0">0 (Disabled - Direct)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                adBlockEnabled 
                  ? 'bg-green-600/30 text-green-300 border border-green-400/60' 
                  : 'bg-red-600/30 text-red-300 border border-red-400/60'
              }`}>
                AD-BLOCK: {adBlockEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {(availableServers.length > 1 ||
        (type === "tv" && seasons.length > 0)) && (
        <div className="mb-6 glass backdrop-blur-md bg-white/10 rounded-xl px-6 py-4 w-full max-w-4xl">
          <div className="flex flex-wrap items-end justify-center gap-6">
            {availableServers.length > 1 && (
              <div className="flex flex-col min-w-[140px]">
                <label className="text-gray-400 text-xs mb-2 tracking-wide">
                  Server
                </label>
                <select
                  value={selectedServer}
                  onChange={(e) => handleServerChange(e.target.value)}
                  className="h-10 px-3 rounded-md bg-white/5 border border-white/20 text-white text-sm focus:outline-none"
                >
                  {availableServers.map((server) => (
                    <option
                      key={server.id}
                      value={server.id}
                      className="bg-black"
                    >
                      {server.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === "tv" && seasons.length > 0 && (
              <>
                <div className="flex flex-col min-w-[100px]">
                  <label className="text-gray-400 text-xs mb-2 tracking-wide">
                    Season
                  </label>
                  <select
                    value={tvSeason}
                    onChange={(e) => handleSeasonChange(e.target.value)}
                    className="h-10 px-3 rounded-md bg-white/5 border border-white/20 text-white text-sm"
                  >
                    {seasons.map((s) => (
                      <option key={s.season_number} value={s.season_number}>
                        {s.season_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col min-w-[100px]">
                  <label className="text-gray-400 text-xs mb-2 tracking-wide">
                    Episode
                  </label>
                  <select
                    value={tvEpisode}
                    onChange={(e) => handleEpisodeChange(e.target.value)}
                    className="h-10 px-3 rounded-md bg-white/5 border border-white/20 text-white text-sm"
                  >
                    {Array.from(
                      {
                        length:
                          seasons.find((s) => s.season_number === tvSeason)
                            ?.episode_count || 1,
                      },
                      (_, i) => i + 1,
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleNextEpisode}
                    className="glass backdrop-blur-sm bg-blue-600/30 px-4 py-2 rounded-md text-sm font-medium text-white border border-blue-400 hover:bg-blue-600/50 transition"
                  >
                    {" "}
                    Next →{" "}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video */}
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        {currentUrl ? (
          <iframe
            src={currentUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={`${title} Video Player`}
            // sandbox={adBlockEnabled ? "allow-forms allow-scripts allow-same-origin" : ""}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
