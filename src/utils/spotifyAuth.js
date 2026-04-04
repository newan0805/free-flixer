import SpotifyWebApi from "spotify-web-api-node";

// Spotify API configuration
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || "945fe9f4f7404a249754ddc5dc07beac",
  clientSecret:
    process.env.SPOTIFY_CLIENT_SECRET || "864be858a717453b809a8d28a8c9451b",
  redirectUri:
    process.env.SPOTIFY_REDIRECT_URI ||
    "https://free-flixer-dev.vercel.app/api/auth/callback",
});

// Generate a random string for state parameter
const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Generate code challenge for PKCE
const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

// Get authorization URL
export const getAuthUrl = async () => {
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(128);

  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const scope =
    "user-read-private user-read-email playlist-read-private user-library-read user-top-read";

  const authUrl = spotifyApi.createAuthorizeURL(scope.split(" "), state, {
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return authUrl;
};

// Handle callback and get access token
export const handleAuthCallback = async (code, state) => {
  const storedState = sessionStorage.getItem("state");
  const codeVerifier = sessionStorage.getItem("code_verifier");

  if (!code || !state || state !== storedState || !codeVerifier) {
    throw new Error("Invalid authorization callback");
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant({
      code: code,
      redirectUri:
        process.env.SPOTIFY_REDIRECT_URI ||
        "https://free-flixer-dev.vercel.app/api/auth/callback",
      codeVerifier: codeVerifier,
    });

    const { access_token, refresh_token, expires_in } = data.body;

    // Store tokens
    sessionStorage.setItem("access_token", access_token);
    sessionStorage.setItem("refresh_token", refresh_token);
    sessionStorage.setItem("token_expires_at", Date.now() + expires_in * 1000);

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    return { access_token, refresh_token };
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
};

// Refresh access token
export const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;

    sessionStorage.setItem("access_token", access_token);
    sessionStorage.setItem("token_expires_at", Date.now() + expires_in * 1000);

    spotifyApi.setAccessToken(access_token);
    return access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const accessToken = sessionStorage.getItem("access_token");
  const expiresAt = sessionStorage.getItem("token_expires_at");

  if (!accessToken || !expiresAt) {
    return false;
  }

  return Date.now() < parseInt(expiresAt);
};

// Get current user profile
export const getCurrentUserProfile = async () => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getMe();
    return data.body;
  } catch (error) {
    if (error.status === 401) {
      // Try to refresh token
      await refreshAccessToken();
      const data = await spotifyApi.getMe();
      return data.body;
    }
    throw error;
  }
};

// Get user's playlists
export const getUserPlaylists = async (limit = 50) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getUserPlaylists({ limit });
    return data.body.items;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getUserPlaylists({ limit });
      return data.body.items;
    }
    throw error;
  }
};

// Get user's saved tracks
export const getUserSavedTracks = async (limit = 50) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getMySavedTracks({ limit });
    return data.body.items.map((item) => item.track);
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getMySavedTracks({ limit });
      return data.body.items.map((item) => item.track);
    }
    throw error;
  }
};

// Get user's top tracks
export const getUserTopTracks = async (
  timeRange = "medium_term",
  limit = 20,
) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getMyTopTracks({
      time_range: timeRange,
      limit,
    });
    return data.body.items;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getMyTopTracks({
        time_range: timeRange,
        limit,
      });
      return data.body.items;
    }
    throw error;
  }
};

// Get user's top artists
export const getUserTopArtists = async (
  timeRange = "medium_term",
  limit = 20,
) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getMyTopArtists({
      time_range: timeRange,
      limit,
    });
    return data.body.items;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getMyTopArtists({
        time_range: timeRange,
        limit,
      });
      return data.body.items;
    }
    throw error;
  }
};

// Search for tracks (with user authentication)
export const searchTracks = async (query, limit = 20) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.searchTracks(query, { limit });
    return data.body.tracks.items;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.searchTracks(query, { limit });
      return data.body.tracks.items;
    }
    throw error;
  }
};

// Get track details
export const getTrack = async (trackId) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getTrack(trackId);
    return data.body;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getTrack(trackId);
      return data.body;
    }
    throw error;
  }
};

// Get artist top tracks
export const getArtistTopTracks = async (artistId) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getArtistTopTracks(artistId, "US");
    return data.body.tracks;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getArtistTopTracks(artistId, "US");
      return data.body.tracks;
    }
    throw error;
  }
};

// Get playlist tracks
export const getPlaylistTracks = async (playlistId) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getPlaylistTracks(playlistId);
    return data.body.items.map((item) => item.track);
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getPlaylistTracks(playlistId);
      return data.body.items.map((item) => item.track);
    }
    throw error;
  }
};

// Get featured playlists (can use client credentials)
export const getFeaturedPlaylists = async () => {
  try {
    // Try with user auth first, fall back to client credentials
    if (isAuthenticated()) {
      const data = await spotifyApi.getFeaturedPlaylists({ limit: 10 });
      return data.body.playlists.items;
    } else {
      // Use client credentials for public data
      const clientCredentialsData = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(clientCredentialsData.body["access_token"]);
      const data = await spotifyApi.getFeaturedPlaylists({ limit: 10 });
      return data.body.playlists.items;
    }
  } catch (error) {
    console.error("Error getting featured playlists:", error);
    throw error;
  }
};

// Get new releases (can use client credentials)
export const getNewReleases = async () => {
  try {
    // Try with user auth first, fall back to client credentials
    if (isAuthenticated()) {
      const data = await spotifyApi.getNewReleases({ limit: 20 });
      return data.body.albums.items;
    } else {
      // Use client credentials for public data
      const clientCredentialsData = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(clientCredentialsData.body["access_token"]);
      const data = await spotifyApi.getNewReleases({ limit: 20 });
      return data.body.albums.items;
    }
  } catch (error) {
    console.error("Error getting new releases:", error);
    throw error;
  }
};

// Get recommendations (requires user auth)
export const getRecommendations = async (seedTracks = [], limit = 20) => {
  if (!isAuthenticated()) {
    throw new Error("User not authenticated");
  }

  try {
    const data = await spotifyApi.getRecommendations({
      seed_tracks: seedTracks.slice(0, 5),
      limit,
    });
    return data.body.tracks;
  } catch (error) {
    if (error.status === 401) {
      await refreshAccessToken();
      const data = await spotifyApi.getRecommendations({
        seed_tracks: seedTracks.slice(0, 5),
        limit,
      });
      return data.body.tracks;
    }
    throw error;
  }
};

// Logout user
export const logout = () => {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("token_expires_at");
  sessionStorage.removeItem("code_verifier");
  sessionStorage.removeItem("state");
  spotifyApi.setAccessToken(null);
  spotifyApi.setRefreshToken(null);
};
