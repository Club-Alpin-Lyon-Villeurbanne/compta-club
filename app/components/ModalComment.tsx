'use client';

import React from 'react';

export const ModalComment: React.FC = () => {
  return (
    <div className="w-full">
      <textarea
        id="comment"
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Entrez votre commentaire ici..."
        rows={4}
        required
      />
    </div>
  );
};

export default ModalComment;