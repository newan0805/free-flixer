// My List utility functions using localStorage

export const myList = {
  // Get all items from My List
  getItems() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('myList');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading My List:', error);
      return [];
    }
  },

  // Add item to My List
  addItem(item) {
    if (typeof window === 'undefined') return;
    
    try {
      const currentItems = this.getItems();
      const exists = currentItems.some(i => i.id === item.id && i.type === item.type);
      
      if (!exists) {
        const updatedItems = [...currentItems, item];
        localStorage.setItem('myList', JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error('Error adding to My List:', error);
    }
  },

  // Remove item from My List
  removeItem(id, type) {
    if (typeof window === 'undefined') return;
    
    try {
      const currentItems = this.getItems();
      const updatedItems = currentItems.filter(item => !(item.id === id && item.type === type));
      localStorage.setItem('myList', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error removing from My List:', error);
    }
  },

  // Check if item is in My List
  isInList(id, type) {
    if (typeof window === 'undefined') return false;
    
    try {
      const currentItems = this.getItems();
      return currentItems.some(item => item.id === id && item.type === type);
    } catch (error) {
      console.error('Error checking My List:', error);
      return false;
    }
  },

  // Clear all items from My List
  clearList() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('myList');
    } catch (error) {
      console.error('Error clearing My List:', error);
    }
  },

  // Get watched items
  getWatchedItems() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('watchedItems');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading watched items:', error);
      return [];
    }
  },

  // Add item to watched list
  addWatchedItem(item) {
    if (typeof window === 'undefined') return;
    
    try {
      const watchedItems = this.getWatchedItems();
      const exists = watchedItems.some(i => i.id === item.id && i.type === item.type);
      
      if (!exists) {
        const updatedItems = [...watchedItems, item];
        localStorage.setItem('watchedItems', JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error('Error adding to watched items:', error);
    }
  },

  // Remove item from watched list
  removeWatchedItem(id, type) {
    if (typeof window === 'undefined') return;
    
    try {
      const watchedItems = this.getWatchedItems();
      const updatedItems = watchedItems.filter(item => !(item.id === id && item.type === type));
      localStorage.setItem('watchedItems', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error removing from watched items:', error);
    }
  },

  // Check if item is watched
  isWatched(id, type) {
    if (typeof window === 'undefined') return false;
    
    try {
      const watchedItems = this.getWatchedItems();
      return watchedItems.some(item => item.id === id && item.type === type);
    } catch (error) {
      console.error('Error checking watched items:', error);
      return false;
    }
  },

  // Get to watch later items
  getToWatchLaterItems() {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('toWatchLater');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading to watch later items:', error);
      return [];
    }
  },

  // Add item to to watch later list
  addToWatchLater(item) {
    if (typeof window === 'undefined') return;
    
    try {
      const toWatchLaterItems = this.getToWatchLaterItems();
      const exists = toWatchLaterItems.some(i => i.id === item.id && i.type === item.type);
      
      if (!exists) {
        const updatedItems = [...toWatchLaterItems, item];
        localStorage.setItem('toWatchLater', JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error('Error adding to to watch later:', error);
    }
  },

  // Remove item from to watch later list
  removeFromToWatchLater(id, type) {
    if (typeof window === 'undefined') return;
    
    try {
      const toWatchLaterItems = this.getToWatchLaterItems();
      const updatedItems = toWatchLaterItems.filter(item => !(item.id === id && item.type === type));
      localStorage.setItem('toWatchLater', JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Error removing from to watch later:', error);
    }
  },

  // Check if item is in to watch later
  isInToWatchLater(id, type) {
    if (typeof window === 'undefined') return false;
    
    try {
      const toWatchLaterItems = this.getToWatchLaterItems();
      return toWatchLaterItems.some(item => item.id === id && item.type === type);
    } catch (error) {
      console.error('Error checking to watch later items:', error);
      return false;
    }
  },

  // Clear all lists
  clearAll() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('myList');
      localStorage.removeItem('watchedItems');
      localStorage.removeItem('toWatchLater');
    } catch (error) {
      console.error('Error clearing all lists:', error);
    }
  }
};
