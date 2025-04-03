import React from 'react';
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const router = useRouter();

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-lg p-6 mx-auto bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center mb-4">
          <FaExclamationTriangle className="w-12 h-12 text-red-500" aria-hidden="true" />
        </div>
        <h2 className="mb-4 text-xl font-semibold text-center text-gray-800">
          Oups ! Une erreur est survenue
        </h2>
        <p className="mb-6 text-center text-gray-600">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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