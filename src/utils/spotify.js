import SpotifyWebApi from 'spotify-web-api-node';

// Spotify API configuration
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '945fe9f4f7404a249754ddc5dc07beac',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '864be858a717453b809a8d28a8c9451b',
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'https://free-flixer.vercel.app/'
});

// Get access token
export const getAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    return data.body['access_token'];
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Search for tracks
export const searchTracks = async (query, limit = 20) => {
  try {
    await getAccessToken();
    const data = await spotifyApi.searchTracks(query, { limit });
    return data.body.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

// Get track details
export const getTrack = async (trackId) => {
  try {
    await getAccessToken();
    const data = await spotifyApi.getTrack(trackId);
    return data.body;
  } catch (error) {
    console.error('Error getting track:', error);
    throw error;
  }
};

// Get artist top tracks
export const getArtistTopTracks = async (artistId) => {
  try {
    await getAccessToken();
    const data = await spotifyApi.getArtistTopTracks(artistId, 'US');
    return data.body.tracks;
  } catch (error) {
    console.error('Error getting artist top tracks:', error);
    throw error;
  }
};

// Get playlist tracks
export const getPlaylistTracks = async (playlistId) => {
  try {
    await getAccessToken();
    const data = await spotifyApi.getPlaylistTracks(playlistId);
    return data.body.items.map(item => item.track);
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    throw error;
  }
};

// Get featured playlists
export const getFeaturedPlaylists = async () => {
  try {
    await getAccessToken();
    const data = await spotifyApi.getFeaturedPlaylists({ limit: 10 });
    return data.body.playlists.items;
  } catch (error) {
    console.error('Error getting featured playlists:', error);
    throw error;
  }
};

// Get new releases
export const getNewReleases = async () => {
  try {
    await getAccessToken();
    const data = await spotifyApi.getNewReleases({ limit: 20 });
    return data.body.albums.items;
  } catch (error) {
    console.error('Error getting new releases:', error);
    throw error;
  }
};

// Get recommendations
export const getRecommendations = async (seedTracks = [], limit = 20) => {
  try {
    await getAccessToken();
    const data = await spotifyApi.getRecommendations({
      seed_tracks: seedTracks.slice(0, 5),
      limit
    });
    return data.body.tracks;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};