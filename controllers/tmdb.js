// TMDB API Configuration
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '5ac3e70910bcee6a1fba39a0dcc547e1';
const API_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// API endpoints
const endpoints = {
  trending: '/trending/all/week',
  movies: '/discover/movie',
  tv: '/discover/tv',
  popular: '/movie/popular',
  topRated: '/movie/top_rated',
  upcoming: '/movie/upcoming',
  search: '/search/multi',
  movieDetails: '/movie',
  tvDetails: '/tv',
  credits: '/credits',
  recommendations: '/recommendations',
  similar: '/similar'
};

// Helper function to build API URL
const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  url.searchParams.append('language', 'en-US');
  
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return url.toString();
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }
  return await response.json();
};

// API Service
export const tmdbService = {
  // Get trending content
  getTrending: async (timeWindow = 'week') => {
    try {
      const response = await fetch(buildUrl(`${endpoints.trending}?time_window=${timeWindow}`));
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching trending:', error);
      return { results: [] };
    }
  },

  // Get movies by category
  getMovies: async (category = 'popular', page = 1) => {
    try {
      const endpoint = category === 'popular' ? endpoints.popular : 
                      category === 'top_rated' ? endpoints.topRated :
                      category === 'upcoming' ? endpoints.upcoming : endpoints.movies;
      
      const response = await fetch(buildUrl(endpoint, { page }));
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching movies:', error);
      return { results: [] };
    }
  },

  // Get TV shows
  getTVShows: async (category = 'popular', page = 1) => {
    try {
      const endpoint = category === 'popular' ? '/tv/popular' : 
                      category === 'top_rated' ? '/tv/top_rated' : endpoints.tv;
      
      const response = await fetch(buildUrl(endpoint, { page }));
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching TV shows:', error);
      return { results: [] };
    }
  },

  // Search content
  search: async (query, page = 1) => {
    try {
      const response = await fetch(buildUrl(endpoints.search, { query, page }));
      return await handleResponse(response);
    } catch (error) {
      console.error('Error searching:', error);
      return { results: [] };
    }
  },

  // Get movie details
  getMovieDetails: async (id) => {
    try {
      const response = await fetch(buildUrl(`${endpoints.movieDetails}/${id}`));
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  },

  // Get TV show details
  getTVDetails: async (id) => {
    try {
      const response = await fetch(buildUrl(`${endpoints.tvDetails}/${id}`));
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching TV details:', error);
      return null;
    }
  },

  // Get recommendations
  getRecommendations: async (id, type = 'movie') => {
    try {
      const endpoint = type === 'movie' ? `${endpoints.movieDetails}/${id}${endpoints.recommendations}` 
                                        : `${endpoints.tvDetails}/${id}${endpoints.recommendations}`;
      const response = await fetch(buildUrl(endpoint));
      const data = await handleResponse(response);
      return data || { results: [] };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return { results: [] };
    }
  },

  // Get similar content
  getSimilar: async (id, type = 'movie') => {
    try {
      const endpoint = type === 'movie' ? `${endpoints.movieDetails}/${id}${endpoints.similar}` 
                                        : `${endpoints.tvDetails}/${id}${endpoints.similar}`;
      const response = await fetch(buildUrl(endpoint));
      const data = await handleResponse(response);
      return data || { results: [] };
    } catch (error) {
      console.error('Error fetching similar content:', error);
      return { results: [] };
    }
  },

  // Get credits
  getCredits: async (id, type = 'movie') => {
    try {
      const endpoint = type === 'movie' ? `${endpoints.movieDetails}/${id}${endpoints.credits}` 
                                        : `${endpoints.tvDetails}/${id}${endpoints.credits}`;
      const response = await fetch(buildUrl(endpoint));
      const data = await handleResponse(response);
      return data || { cast: [], crew: [] };
    } catch (error) {
      console.error('Error fetching credits:', error);
      return { cast: [], crew: [] };
    }
  },

  // Image URL helpers
  getImageUrl: (path, size = 'w500') => {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
  },

  getBackdropUrl: (path) => {
    return path ? `${IMAGE_BASE_URL}/w1280${path}` : null;
  },

  getProfileUrl: (path) => {
    return path ? `${IMAGE_BASE_URL}/w185${path}` : null;
  }
};