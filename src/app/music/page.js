"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Music, Play, Heart, Clock, ListMusic, Users, LogIn, LogOut } from "lucide-react";
import {
  searchTracks,
  getFeaturedPlaylists,
  getNewReleases,
  getRecommendations,
  isAuthenticated,
  getCurrentUserProfile,
  getUserPlaylists,
  getUserSavedTracks,
  getUserTopTracks,
  logout,
} from "@utils/spotifyAuth";
import MusicPlayer from "@components/MusicPlayer";

export default function MusicPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check authentication status
    checkAuthStatus();
    // Load initial data
    loadInitialData();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authStatus = isAuthenticated();
      setIsAuthenticated(authStatus);
      if (authStatus) {
        const userProfile = await getCurrentUserProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/spotify');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error initiating login:", error);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUser(null);
    router.refresh();
  };

  const loadInitialData = async () => {
    try {
      const [playlists, releases, recs] = await Promise.all([
        getFeaturedPlaylists(),
        getNewReleases(),
        getRecommendations(),
      ]);
      setFeaturedPlaylists(playlists);
      setNewReleases(releases);
      setRecommendations(recs);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchTracks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  const playTrack = (track) => {
    // In a real implementation, this would integrate with Spotify Web Playback SDK
    console.log("Playing track:", track);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-purple-500/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Music className="h-12 w-12 text-green-400" />
              <h1 className="text-5xl font-bold text-white">Music</h1>
            </div>
            <p className="text-xl text-gray-300 mb-8">
              Discover and play your favorite music with Spotify integration
            </p>

            {/* Guest Mode Notice */}
            {!isAuthenticated && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <Users className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                <p className="text-yellow-300 text-sm">
                  Guest Mode: You can browse and search music without connecting Spotify. 
                  Connect your account for personalized recommendations and full playback features.
                </p>
              </div>
            )}

            {/* Authentication Status */}
            <div className="flex items-center justify-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-full px-6 py-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-purple-500 rounded-full flex items-center justify-center">
                    {user?.images?.[0] ? (
                      <img
                        src={user.images[0].url}
                        alt={user.display_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.display_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{user?.display_name}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center space-x-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Connect Spotify</span>
                </button>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for songs, artists, or albums..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex space-x-1 bg-white/5 backdrop-blur-md rounded-xl p-1">
          {[
            { id: "discover", label: "Discover", icon: ListMusic },
            { id: "search", label: "Search Results", icon: Search },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-green-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === "discover" && (
          <div className="space-y-12">
            {/* Featured Playlists */}
            {featuredPlaylists.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Featured Playlists
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredPlaylists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="group bg-white/5 backdrop-blur-md rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => console.log("Open playlist:", playlist.id)}
                    >
                      <div className="aspect-square bg-gradient-to-br from-green-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                        {playlist.images[0] ? (
                          <img
                            src={playlist.images[0].url}
                            alt={playlist.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Music className="h-16 w-16 text-white/80" />
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-2 truncate">
                        {playlist.name}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {playlist.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
                        <span>{playlist.tracks.total} tracks</span>
                        <Play className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* New Releases */}
            {newReleases.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  New Releases
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {newReleases.map((album) => (
                    <div
                      key={album.id}
                      className="group bg-white/5 backdrop-blur-md rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => console.log("Open album:", album.id)}
                    >
                      <div className="aspect-square bg-gradient-to-br from-blue-400 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                        {album.images[0] ? (
                          <img
                            src={album.images[0].url}
                            alt={album.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Music className="h-16 w-16 text-white/80" />
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-2 truncate">
                        {album.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {album.artists[0]?.name}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
                        <span>{album.release_date}</span>
                        <Play className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Recommended for You
                </h2>
                <div className="bg-white/5 backdrop-blur-md rounded-xl">
                  <div className="divide-y divide-white/10">
                    {recommendations.slice(0, 10).map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => playTrack(track)}
                      >
                        <div className="flex-shrink-0">
                          <span className="text-gray-400 text-sm w-8 inline-block">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          {track.album.images[0] ? (
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-purple-500 rounded flex items-center justify-center">
                              <Music className="h-6 w-6 text-white/80" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">
                            {track.name}
                          </h4>
                          <p className="text-gray-400 text-sm truncate">
                            {track.artists[0]?.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Heart className="h-4 w-4" />
                          </button>
                          <span className="text-gray-400 text-sm">
                            {formatDuration(track.duration_ms)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div>
            {searchResults.length > 0 ? (
              <div className="bg-white/5 backdrop-blur-md rounded-xl">
                <div className="divide-y divide-white/10">
                  {searchResults.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => playTrack(track)}
                    >
                      <div className="flex-shrink-0">
                        <span className="text-gray-400 text-sm w-8 inline-block">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {track.album.images[0] ? (
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-purple-500 rounded flex items-center justify-center">
                            <Music className="h-6 w-6 text-white/80" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {track.name}
                        </h4>
                        <p className="text-gray-400 text-sm truncate">
                          {track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                          <Heart className="h-4 w-4" />
                        </button>
                        <span className="text-gray-400 text-sm">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-lg mb-2">No results found</h3>
                <p className="text-gray-400">
                  Try searching for a song, artist, or album
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
