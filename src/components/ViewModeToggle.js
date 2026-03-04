'use client';


const ViewModeToggle = ({ currentView, onViewChange }) => {
  

  return (
    <div className="flex items-center space-x-3">
      <span className="text-gray-400 text-sm font-medium">View:</span>
      <div className="flex glass rounded-lg p-1">
        {/* Grid View Button */}
        <button
          onClick={() => onViewChange('grid')}
          
          className={`relative p-2 rounded-md transition-all duration-200 ${
            currentView === 'grid'
              ? 'border border-blue-600 text-blue-600 shadow-lg shadow-blue-500/25'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
          title="Grid View"
        >
          {/* Grid Icon */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          
          {/* Active indicator */}
          {currentView === 'grid' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
          )}
        </button>

        {/* Collection View Button */}
        <button
          onClick={() => onViewChange('collection')}
          
          className={`relative p-2 rounded-md transition-all duration-200 ${
            currentView === 'collection'
              ? 'border border-purple-600 text-purple-600 shadow-lg shadow-purple-500/25'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
          title="Collection View"
        >
          {/* Collection Icon */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          
          {/* Active indicator */}
          {currentView === 'collection' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewModeToggle;