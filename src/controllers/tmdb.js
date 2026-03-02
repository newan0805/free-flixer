// TMDB API Configuration
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL;

// API endpoints
const endpoints = {
  trending: "/trending/all/week",
  trendingMovies: "/trending/movie/day",
  trendingTV: "/trending/tv/day",
  movies: "/discover/movie",
  tv: "/discover/tv",
  popular: "/movie/popular",
  topRated: "/movie/top_rated",
  upcoming: "/movie/upcoming",
  nowPlaying: "/movie/now_playing",
  tvAiringToday: "/tv/airing_today",
  tvOnTheAir: "/tv/on_the_air",
  tvPopular: "/tv/popular",
  tvTopRated: "/tv/top_rated",
  search: "/search/multi",
  movieDetails: "/movie",
  tvDetails: "/tv",
  credits: "/credits",
  recommendations: "/recommendations",
  similar: "/similar",
};

// Helper function to build API URL
const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  url.searchParams.append("language", "en-US");

  Object.keys(params).forEach((key) => {
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
  getTrending: async (timeWindow = "week") => {
    try {
      const response = await fetch(
        buildUrl(`${endpoints.trending}?time_window=${timeWindow}`),
      );
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching trending:", error);
      return { results: [] };
    }
  },

  // Get trending movies
  getTrendingMovies: async () => {
    try {
      const response = await fetch(buildUrl(endpoints.trendingMovies));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      return { results: [] };
    }
  },

  // Get trending TV shows
  getTrendingTV: async () => {
    try {
      const response = await fetch(buildUrl(endpoints.trendingTV));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching trending TV:", error);
      return { results: [] };
    }
  },

  // Get movies by category
  getMovies: async (category = "popular", page = 1) => {
    try {
      const endpoint =
        category === "popular"
          ? endpoints.popular
          : category === "top_rated"
            ? endpoints.topRated
            : category === "upcoming"
              ? endpoints.upcoming
              : category === "now_playing"
                ? endpoints.nowPlaying
                : endpoints.movies;

      const response = await fetch(buildUrl(endpoint, { page }));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching movies:", error);
      return { results: [] };
    }
  },

  // Get TV shows
  getTVShows: async (category = "popular", page = 1) => {
    try {
      const endpoint =
        category === "popular"
          ? endpoints.tvPopular
          : category === "top_rated"
            ? endpoints.tvTopRated
            : category === "airing_today"
              ? endpoints.tvAiringToday
              : category === "on_the_air"
                ? endpoints.tvOnTheAir
                : endpoints.tv;

      const response = await fetch(buildUrl(endpoint, { page }));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching TV shows:", error);
      return { results: [] };
    }
  },

  // Get Animes
  getAnimes: async (page = 1) => {
    try {
      // Use TV discover endpoint with anime-specific filters
      const endpoint = "/discover/tv";
      const params = {
        page,
        with_genres: "16", // Animation genre
        with_origin_country: "JP", // Japanese origin
        sort_by: "popularity.desc"
      };
      
      const response = await fetch(buildUrl(endpoint, params));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching animes:", error);
      return { results: [] };
    }
  },

  // Search content
  search: async (query, page = 1) => {
    try {
      const response = await fetch(buildUrl(endpoints.search, { query, page }));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error searching:", error);
      return { results: [] };
    }
  },

  // Get movie details
  getMovieDetails: async (id) => {
    try {
      const response = await fetch(buildUrl(`${endpoints.movieDetails}/${id}`));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      // Return a minimal object to prevent breaking the UI
      return {
        id,
        title: 'Unknown Movie',
        overview: 'Details not available',
        poster_path: null,
        backdrop_path: null,
        vote_average: 0,
        release_date: null
      };
    }
  },

  // Get TV show details
  getTVDetails: async (id) => {
    try {
      const response = await fetch(buildUrl(`${endpoints.tvDetails}/${id}`));
      return await handleResponse(response);
    } catch (error) {
      console.error("Error fetching TV details:", error);
      // Return a minimal object to prevent breaking the UI
      return {
        id,
        name: 'Unknown TV Show',
        overview: 'Details not available',
        poster_path: null,
        backdrop_path: null,
        vote_average: 0,
        first_air_date: null
      };
    }
  },

  // Get recommendations
  getRecommendations: async (id, type = "movie") => {
    try {
      const endpoint =
        type === "movie"
          ? `${endpoints.movieDetails}/${id}${endpoints.recommendations}`
          : `${endpoints.tvDetails}/${id}${endpoints.recommendations}`;
      const response = await fetch(buildUrl(endpoint));
      const data = await handleResponse(response);
      return data || { results: [] };
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return { results: [] };
    }
  },

  // Get similar content
  getSimilar: async (id, type = "movie") => {
    try {
      const endpoint =
        type === "movie"
          ? `${endpoints.movieDetails}/${id}${endpoints.similar}`
          : `${endpoints.tvDetails}/${id}${endpoints.similar}`;
      const response = await fetch(buildUrl(endpoint));
      const data = await handleResponse(response);
      return data || { results: [] };
    } catch (error) {
      console.error("Error fetching similar content:", error);
      return { results: [] };
    }
  },

  // Get credits
  getCredits: async (id, type = "movie") => {
    try {
      const endpoint =
        type === "movie"
          ? `${endpoints.movieDetails}/${id}${endpoints.credits}`
          : `${endpoints.tvDetails}/${id}${endpoints.credits}`;
      const response = await fetch(buildUrl(endpoint));
      const data = await handleResponse(response);
      return data || { cast: [], crew: [] };
    } catch (error) {
      console.error("Error fetching credits:", error);
      return { cast: [], crew: [] };
    }
  },

  // Image URL helpers
  getImageUrl: (path, size = "w500") => {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
  },

  getBackdropUrl: (path) => {
    return path ? `${IMAGE_BASE_URL}/w1280${path}` : null;
  },

  getProfileUrl: (path) => {
    return path ? `${IMAGE_BASE_URL}/w185${path}` : null;
  },
};
