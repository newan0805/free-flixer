// Server configuration utility
export const servers = [
  {
    id: 'vidsrc-icu',
    name: 'VidSrc',
    baseUrl: process.env.NEXT_PUBLIC_VIDSRC_BASE_URL,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/movie/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/tv/${context.tmdbId}/${context.season}/${context.episode}`;
      }
      return null;
    }
  },
  {
    id: 'vidsrc-cc',
    name: 'VidSrc-cc',
    baseUrl: process.env.NEXT_PUBLIC_VIDSRC_CC_BASE_URL,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/movie/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/tv/${context.tmdbId}/${context.season}/${context.episode}`;
      }
      return null;
    }
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    baseUrl: process.env.NEXT_PUBLIC_VIDFAST_BASE_URL,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/movie/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/tv/${context.tmdbId}/${context.season}/${context.episode}`;
      }
      return null;
    }
  },
  {
    id: 'vidsrc-embed-ru',
    name: 'VidSrc Embed (ru)',
    baseUrl: process.env.NEXT_PUBLIC_VIDSRC_EMBED_RU,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/embed/movie/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`;
      }
      return null;
    }
  },
  {
    id: 'vidsrc-embed-su',
    name: 'VidSrc Embed (su)',
    baseUrl: process.env.NEXT_PUBLIC_VIDSRC_EMBED_SU,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/embed/movie/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/embed/tv/${context.tmdbId}/${context.season}/${context.episode}`;
      }
      return null;
    }
  },
  {
    id: '111movies',
    name: '111Movies',
    baseUrl: process.env.NEXT_PUBLIC_111MOVIES_BASE_URL,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/movie/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/tv/${context.tmdbId}/${context.season}/${context.episode}`;
      }
      return null;
    }
  },
  {
    id: '2embed',
    name: '2Embed',
    baseUrl: process.env.NEXT_PUBLIC_2EMBED_BASE_URL,
    buildUrl: (context) => {
      if (context.contentType === 'movie') {
        return `${context.baseUrl}/embed/${context.tmdbId}`;
      } else if (context.contentType === 'tv') {
        return `${context.baseUrl}/embedtv/${context.tmdbId}?s=${context.season}&e=${context.episode}`;
      }
      return null;
    }
  }
];

// Get available servers (filter out undefined URLs)
export const getAvailableServers = () => {
  return servers.filter(server => server.baseUrl);
};

// Get default server
export const getDefaultServer = () => {
  const availableServers = getAvailableServers();
  return availableServers[0] || servers[0];
};

// Get server by ID
export const getServerById = (id) => {
  return servers.find(server => server.id === id);
};

// Generate embed URL for a server
export const getEmbedUrl = (serverId, context) => {
  const server = getServerById(serverId);
  if (!server) return null;
  
  return server.buildUrl({
    ...context,
    baseUrl: server.baseUrl
  });
};

// Server storage key
export const SERVER_STORAGE_KEY = 'free-flixer-server';

// Get saved server from localStorage
export const getSavedServer = () => {
  if (typeof window === 'undefined') return getDefaultServer().id;
  
  try {
    const saved = localStorage.getItem(SERVER_STORAGE_KEY);
    const availableServers = getAvailableServers();
    const availableIds = availableServers.map(s => s.id);
    
    if (saved && availableIds.includes(saved)) {
      return saved;
    }
    
    // Fallback to default if saved server is not available
    return getDefaultServer().id;
  } catch (error) {
    console.error('Error getting saved server:', error);
    return getDefaultServer().id;
  }
};

// Save server to localStorage
export const saveServer = (serverId) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SERVER_STORAGE_KEY, serverId);
  } catch (error) {
    console.error('Error saving server:', error);
  }
};