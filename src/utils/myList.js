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
  }
};