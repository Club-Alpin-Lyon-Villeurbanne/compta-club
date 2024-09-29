'use client';

import { signOut } from 'next-auth/react';
import { FaSignOutAlt } from 'react-icons/fa';

export default function LogoutButton() {
  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 ml-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 transition duration-300 ease-in-out flex items-center"
    >
      <FaSignOutAlt className="mr-2" />
      Déconnexion
    </button>
  );
}