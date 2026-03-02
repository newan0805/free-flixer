"use client";

import { useState, useEffect } from "react";
import { tmdbService } from "@controllers/tmdb";
import { myList } from "@utils/myList";
import MovieCard from "@components/MovieCard";
// import Navigation from "@components/Navigation";
import ViewModeToggle from "@components/ViewModeToggle";

const AnimesPage = () => {
  const [animes, setAnimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAnimes();
  }, [page]);

  const fetchAnimes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await tmdbService.getAnimes(page);

      const newAnimes =
        response.results?.filter(
          (show) => show.poster_path && show.name && show.overview,
        ) || [];

      if (page === 1) {
        setAnimes(newAnimes);
      } else {
        setAnimes((prev) => {
          const combined = [...prev, ...newAnimes];
          return combined.filter(
            (item, index, arr) =>
              arr.findIndex((t) => t.id === item.id) === index,
          );
        });
      }
    } catch (error) {
      console.error("Error fetching animes:", error);
      setError("Failed to load anime content. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleCardClick = (anime) => {
    window.location.href = `/tv/${anime.id}`;
  };

  const handleAddToMyList = (anime) => {
    const animeItem = {
      id: anime.id,
      type: "tv",
      title: anime.name || anime.original_name,
      poster_path: anime.poster_path,
      backdrop_path: anime.backdrop_path,
      overview: anime.overview,
      vote_average: anime.vote_average,
      first_air_date: anime.first_air_date,
    };

    if (myList.isInList(anime.id, "tv")) {
      myList.removeItem(anime.id, "tv");
    } else {
      myList.addItem(animeItem);
    }
  };

  const handleAddToWatchLater = (anime) => {
    const animeItem = {
      id: anime.id,
      type: "tv",
      title: anime.name || anime.original_name,
      poster_path: anime.poster_path,
      backdrop_path: anime.backdrop_path,
      overview: anime.overview,
      vote_average: anime.vote_average,
      first_air_date: anime.first_air_date,
    };

    if (myList.isInToWatchLater(anime.id, "tv")) {
      myList.removeFromToWatchLater(anime.id, "tv");
    } else {
      myList.addToWatchLater(animeItem);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* <Navigation /> */}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Anime Collection
          </h1>
          <p className="text-gray-400">
            Discover the best anime series from around the world
          </p>

          {/* View Mode Toggle */}
          <div className="mt-6">
            <ViewModeToggle currentView={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">
              Error Loading Animes
            </div>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={fetchAnimes}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : animes.length > 0 ? (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1"
            }`}
          >
            {animes.map((anime) => (
              <MovieCard
                key={anime.id}
                movie={anime}
                onClick={handleCardClick}
                onAddToMyList={() => handleAddToMyList(anime)}
                onAddToWatchLater={() => handleAddToWatchLater(anime)}
                isMyList={myList.isInList(anime.id, "tv")}
                isWatchLater={myList.isInToWatchLater(anime.id, "tv")}
                className={viewMode === "collection" ? "max-w-4xl mx-auto" : ""}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No Anime Found</div>
            <p className="text-gray-400">
              We're working on curating more anime content for you.
            </p>
            <button
              onClick={fetchAnimes}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && animes.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
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

export default AnimesPage;
