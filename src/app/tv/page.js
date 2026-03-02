"use client";

import { useState, useEffect } from "react";
import { tmdbService } from "@controllers/tmdb";
import MovieCard from "@components/MovieCard";
import ViewModeToggle from "@components/ViewModeToggle";

const TVPage = () => {
  const [tvShows, setTVShows] = useState([]);
  const [category, setCategory] = useState("popular");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");

  const categories = [
    { key: "popular", label: "Popular" },
    { key: "top_rated", label: "Top Rated" },
    { key: "on_the_air", label: "On The Air" },
    { key: "airing_today", label: "Airing Today" },
  ];

  useEffect(() => {
    fetchTVShows();
  }, [category, page]);

  const fetchTVShows = async () => {
    try {
      setIsLoading(true);
      const response = await tmdbService.getTVShows(category, page);
      if (page === 1) {
        setTVShows(response.results || []);
      } else {
        setTVShows((prev) => [...prev, ...(response.results || [])]);
      }
    } catch (error) {
      console.error("Error fetching TV shows:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (tvShow) => {
    window.location.href = `/tv/${tvShow.id}`;
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* <Navigation /> */}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">TV Shows</h1>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setCategory(cat.key);
                    setPage(1);
                    setTVShows([]);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === cat.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <ViewModeToggle currentView={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* TV Shows Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
            : 'grid-cols-1'
        }`}>
          {tvShows.map((tvShow) => (
            <MovieCard
              key={tvShow.id}
              movie={tvShow}
              onClick={handleCardClick}
              className={viewMode === 'collection' ? 'max-w-4xl mx-auto' : ''}
            />
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
              : 'grid-cols-1'
          } mt-8`}>
            {[...Array(10)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg animate-pulse">
                <div className="w-full h-64 bg-gray-700 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && tvShows.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={loadMore}
              className="group relative flex items-center justify-center p-5 rounded-full
                 bg-white/10 backdrop-blur-md
                 border border-white/20
                 shadow-lg shadow-black/30
                 hover:bg-white/20
                 hover:shadow-white/20
                 transition-all duration-300"
            >
              {/* Subtle glass shine overlay */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-40 pointer-events-none" />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="relative w-6 h-6 text-white animate-[softBounce_1.8s_ease-in-out_infinite] 
                   group-hover:translate-y-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v14m0 0l-6-6m6 6l6-6"
                />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TVPage;
