'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Navigation = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    if (searchQuery.length < 2) return;

    try {
      setIsSearching(true);
      const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    router.push(`/search?q=${encodeURIComponent(suggestion.title)}`);
    setShowSuggestions(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const formatType = (type) => {
    return type === 'movie' ? 'Movie' : 'TV Show';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black bg-opacity-95 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="text-white font-bold text-xl hover:text-gray-300 transition-colors"
            >
              Free Flixer
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search movies, TV shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                  className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-black border border-gray-700 rounded-lg mt-2 shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="p-3">
                    <p className="text-gray-400 text-sm font-medium mb-3">Search Results</p>
                    {searchResults.map((suggestion) => (
                      <button
                        key={`${suggestion.id}-${suggestion.type}`}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-2 py-3 hover:bg-gray-800 rounded-lg transition-colors group"
                      >
                        <div className="flex items-start space-x-3">
                          {/* Thumbnail */}
                          {suggestion.poster && (
                            <img
                              src={suggestion.poster}
                              alt={suggestion.title}
                              className="w-12 h-16 object-cover rounded-md flex-shrink-0 group-hover:scale-105 transition-transform"
                            />
                          )}
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                                {suggestion.title}
                              </h3>
                              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                                {formatType(suggestion.type)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-300 mb-2">
                              {formatDate(suggestion.release_date) && (
                                <span>{formatDate(suggestion.release_date)}</span>
                              )}
                              {suggestion.vote_average > 0 && (
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span>{suggestion.vote_average.toFixed(1)}/10</span>
                                </div>
                              )}
                            </div>
                            
                            {suggestion.overview && (
                              <p className="text-gray-400 text-xs line-clamp-2">
                                {suggestion.overview}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isSearching && (
                <div className="absolute top-full left-0 right-0 bg-black border border-gray-700 rounded-lg mt-2 p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-gray-400 text-sm">Searching...</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push('/movies')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Movies
            </button>
            <button
              onClick={() => router.push('/tv')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              TV Shows
            </button>
            <button
              onClick={() => router.push('/search')}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Search
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;