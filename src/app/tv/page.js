'use client';

import { useState, useEffect } from 'react';
import { tmdbService } from '@controllers/tmdb';
import MovieCard from '@components/MovieCard';

const TVPage = () => {
  const [tvShows, setTVShows] = useState([]);
  const [category, setCategory] = useState('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const categories = [
    { key: 'popular', label: 'Popular' },
    { key: 'top_rated', label: 'Top Rated' },
    { key: 'on_the_air', label: 'On TV' },
    { key: 'airing_today', label: 'Airing Today' }
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
        setTVShows(prev => [...prev, ...(response.results || [])]);
      }
    } catch (error) {
      console.error('Error fetching TV shows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (tvShow) => {
    window.location.href = `/tv/${tvShow.id}`;
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">TV Shows</h1>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* TV Shows Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tvShows.map((tvShow) => (
            <MovieCard
              key={tvShow.id}
              movie={tvShow}
              onClick={handleCardClick}
            />
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
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
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TVPage;