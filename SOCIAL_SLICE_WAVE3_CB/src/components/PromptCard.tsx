import React from 'react';

interface PromptCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode; // Optional icon element
}

const PromptCard: React.FC<PromptCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white p-4 rounded-none border border-gray-300 flex flex-col items-start hover:shadow-lg transition-shadow duration-200 cursor-pointer geist-mono">
      {icon && <div className="mb-2 text-red-600">{icon}</div>}
      <h3 className="font-semibold text-gray-700 mb-1 text-sm">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

export default PromptCard; 