import React from 'react';

interface FilterTabsProps {
  // Props for handling active tab and selection if needed later
}

const FilterTabs: React.FC<FilterTabsProps> = () => {
  const tabs = ['All', 'Text', 'Image', 'Video', 'Music', 'Analytics'];

  return (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-none border border-gray-300 geist-mono">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors 
                      ${tab === 'All' 
                        ? 'bg-white text-red-600 border border-gray-300 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-200 border border-transparent'}
                    `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs; 