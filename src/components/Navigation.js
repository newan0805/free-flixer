"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { useRouter } from "next/navigation";

const Navigation = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Debounced search (inline to avoid stale callback warnings)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
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
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    router.push(`/search?q=${encodeURIComponent(suggestion.title)}`);
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const formatType = (type) => {
    return type === "movie" ? "Movie" : "TV Show";
  };

  const navigationItems = [
    {
      name: "Home",
      href: "/",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10L12 3l9 7v9a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2v-9z"
          />
        </svg>
      ),
    },
    {
      name: "Movies",
      href: "/movies",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2} />
          <path strokeWidth={2} d="M7 5v14M17 5v14" />
        </svg>
      ),
    },
    {
      name: "TV Shows",
      href: "/tv",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <rect x="4" y="6" width="16" height="10" rx="2" strokeWidth={2} />
          <path strokeWidth={2} d="M8 20h8M12 16v4" />
        </svg>
      ),
    },
    {
      name: "Animes",
      href: "/animes",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12c1-1 2-1 3-1s2 0 3 1M10 15h4"
          />
        </svg>
      ),
    },
    {
      name: "My List",
      href: "/my-list",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4h16v16H4zM8 4v16"
          />
        </svg>
      ),
    },
    {
      name: "Music",
      href: "/music",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden  p-2 text-white hover:text-gray-300 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              {/* Logo */}
              {/* <button
                onClick={() => router.push("/")}
                className="text-white font-bold text-xl hover:text-gray-300 transition-colors flex items-center space-x-2"
              >
                <span className="text-2xl ml-4">🎬</span>
                <span>Free Flixer</span>
              </button> */}
            </div>

            {/* Search Bar (Always visible) */}
            <div className="flex-1 max-w-lg mx-4">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search movies, TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchResults.length > 0 && setShowSuggestions(true)
                    }
                    className="w-full glass text-white placeholder-gray-400 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 glass border border-gray-700 rounded-lg mt-2 shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                    <div className="p-3">
                      <p className="text-gray-400 text-sm font-medium mb-3">
                        Search Results
                      </p>
                      {searchResults.map((suggestion) => (
                        <button
                          key={`${suggestion.id}-${suggestion.type}`}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-2 py-3 hover:bg-white/10 rounded-lg transition-colors group"
                        >
                          <div className="flex items-start space-x-3">
                            {/* Thumbnail */}
                            {suggestion.poster && (
                              <div className="w-12 h-16 relative flex-shrink-0">
                                <Image src={suggestion.poster} alt={suggestion.title} fill className="object-cover rounded-md group-hover:scale-105 transition-transform" />
                              </div>
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
                                  <span>
                                    {formatDate(suggestion.release_date)}
                                  </span>
                                )}
                                {suggestion.vote_average > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <svg
                                      className="w-3 h-3 text-yellow-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span>
                                      {suggestion.vote_average.toFixed(1)}/10
                                    </span>
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
                      <span className="text-gray-400 text-sm">
                        Searching...
                      </span>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Logo */}
              {/* <button
                onClick={() => router.push("/")}
                className="text-white font-bold text-xl hover:text-gray-300 transition-colors flex items-center space-x-2"
              >
                <span className="text-2xl ml-4">🎬</span>
                <span>Free Flixer</span>
              </button> */}
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className="text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-2"
                >
                  <span className="flex items-center">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
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

      {/* Mobile Side Pane */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`fixed left-0 top-0 h-full w-64 bg-black border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <button
                onClick={() => {
                  router.push("/");
                  setIsMobileMenuOpen(false);
                }}
                className="text-white font-bold text-xl flex items-center space-x-2"
              >
                <span className="text-2xl">🎬</span>
                <span>Free Flixer</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-4">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-3"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              <p className="text-gray-500 text-sm text-center">
                © {new Date().getFullYear()} Free Flixer
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
