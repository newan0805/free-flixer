'use client';

import { useState, useEffect } from 'react';
import { tmdbService } from '@controllers/tmdb';
import MovieCard from '@components/MovieCard';
import Navigation from '@components/Navigation';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      handleSearch(searchQuery);
    }
  }, []);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setHasSearched(true);
      const response = await tmdbService.search(searchQuery);
      setResults(response.results || []);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCardClick = (item) => {
    const type = item.media_type === 'movie' ? 'movie' : 'tv';
    window.location.href = `/${type}/${item.id}`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Search</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for movies, TV shows, and people..."
                className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-md leading-5 bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
            ) : results.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Results for "{query}"
                  </h2>
                  <p className="text-gray-400">{results.length} results found</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {results.map((item) => (
                    <MovieCard
                      key={item.id}
                      movie={item}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              </>
            ) : query.trim() && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No results found</div>
                <p className="text-gray-400">
                  Try adjusting your search terms or browse our popular content
                </p>
              </div>
            )}
          </>
        )}

        {/* Popular Searches */}
        {!hasSearched && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-6">Popular Searches</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setQuery(genre);
                    handleSearch(genre);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;