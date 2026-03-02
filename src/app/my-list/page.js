'use client';

import { useState, useEffect } from 'react';
import { tmdbService } from '@controllers/tmdb';
import { myList } from '@utils/myList';
import MovieCard from '@components/MovieCard';
import Navigation from '@components/Navigation';
import ViewModeToggle from '@components/ViewModeToggle';

const MyListPage = () => {
  const [myListItems, setMyListItems] = useState([]);
  const [watchedItems, setWatchedItems] = useState([]);
  const [toWatchLaterItems, setToWatchLaterItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-list');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchListItems();
  }, []);

  const fetchListItems = async () => {
    try {
      setIsLoading(true);
      
      // Get all list items
      const allMyListItems = myList.getItems();
      const allWatchedItems = myList.getWatchedItems();
      const allToWatchLaterItems = myList.getToWatchLaterItems();

      // Fetch detailed information for each item
      const fetchDetails = async (items) => {
        const detailedItems = await Promise.all(
          items.map(async (item) => {
            try {
              if (item.type === 'movie') {
                const details = await tmdbService.getMovieDetails(item.id);
                return { ...item, ...details };
              } else {
                const details = await tmdbService.getTVDetails(item.id);
                return { ...item, ...details };
              }
            } catch (error) {
              console.error(`Error fetching details for ${item.id}:`, error);
              // Return the original item if API call fails
              return item;
            }
          })
        );
        return detailedItems.filter(item => item.poster_path || item.backdrop_path);
      };

      const [detailedMyList, detailedWatched, detailedToWatchLater] = await Promise.all([
        fetchDetails(allMyListItems),
        fetchDetails(allWatchedItems),
        fetchDetails(allToWatchLaterItems)
      ]);

      setMyListItems(detailedMyList);
      setWatchedItems(detailedWatched);
      setToWatchLaterItems(detailedToWatchLater);
    } catch (error) {
      console.error('Error fetching list items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromList = (id, type, listType) => {
    if (listType === 'my-list') {
      myList.removeItem(id, type);
      setMyListItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
    } else if (listType === 'watched') {
      myList.removeWatchedItem(id, type);
      setWatchedItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
    } else if (listType === 'to-watch-later') {
      myList.removeFromToWatchLater(id, type);
      setToWatchLaterItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
    }
  };

  const handleAddToWatched = (item) => {
    myList.addWatchedItem(item);
    myList.removeItem(item.id, item.type);
    setMyListItems(prev => prev.filter(listItem => !(listItem.id === item.id && listItem.type === item.type)));
    setWatchedItems(prev => [...prev, item]);
  };

  const handleAddToToWatchLater = (item) => {
    myList.addToWatchLater(item);
    myList.removeItem(item.id, item.type);
    setMyListItems(prev => prev.filter(listItem => !(listItem.id === item.id && listItem.type === item.type)));
    setToWatchLaterItems(prev => [...prev, item]);
  };

  const handleCardClick = (item) => {
    const type = item.type === 'movie' ? 'movie' : 'tv';
    window.location.href = `/${type}/${item.id}`;
  };

  const getTabContent = () => {
    let items = [];
    let emptyMessage = '';
    let emptyDescription = '';

    switch (activeTab) {
      case 'my-list':
        items = myListItems;
        emptyMessage = "Your My List is empty";
        emptyDescription = "Add movies and TV shows to your list to watch them later";
        break;
      case 'watched':
        items = watchedItems;
        emptyMessage = "No watched items yet";
        emptyDescription = "Start watching content to see your watched history here";
        break;
      case 'to-watch-later':
        items = toWatchLaterItems;
        emptyMessage = "Your watch later list is empty";
        emptyDescription = "Add content to your watch later list to save it for future viewing";
        break;
      default:
        items = myListItems;
        emptyMessage = "Your My List is empty";
        emptyDescription = "Add movies and TV shows to your list to watch them later";
    }

    if (isLoading) {
      return (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-1'
        }`}>
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg animate-pulse">
              <div className="w-full h-64 bg-gray-700 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">{emptyMessage}</div>
          <p className="text-gray-400">{emptyDescription}</p>
        </div>
      );
    }

    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-1'
      }`}>
        {items.map((item) => (
          <div key={`${item.id}-${item.type}`} className="relative group">
            <MovieCard
              movie={item}
              onClick={handleCardClick}
              className={viewMode === 'collection' ? 'max-w-4xl mx-auto' : ''}
            />
            
            {/* Action buttons overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {activeTab === 'my-list' && (
                <>
                  <button
                    onClick={() => handleAddToWatched(item)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    title="Mark as Watched"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAddToToWatchLater(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    title="Move to Watch Later"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={() => handleRemoveFromList(item.id, item.type, activeTab)}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                title={`Remove from ${activeTab.replace('-', ' ')}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* <Navigation /> */}
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">My List</h1>
          
          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab('my-list')}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  activeTab === 'my-list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                My List ({myListItems.length})
              </button>
              <button
                onClick={() => setActiveTab('watched')}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  activeTab === 'watched'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Watched ({watchedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('to-watch-later')}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  activeTab === 'to-watch-later'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                To Watch Later ({toWatchLaterItems.length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <ViewModeToggle currentView={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Content */}
        {getTabContent()}
      </main>
    </div>
  );
};

export default MyListPage;