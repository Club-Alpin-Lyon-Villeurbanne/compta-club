import React from 'react';
import { useRouter } from 'next/router';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6 max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-4">
          <FaExclamationTriangle className="text-red-500 w-12 h-12" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Oups ! Une erreur est survenue
        </h2>
        <p className="text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
          >
            <FaHome className="mr-2" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;