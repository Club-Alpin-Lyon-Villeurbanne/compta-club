import React from 'react';
import Link from 'next/link';

/** Une adresse qui ne mène à rien : le dire, et ramener à la liste, sans « Actualiser » qui n'y changerait rien. */
export default function AdresseIntrouvable({ children }: { children: React.ReactNode }) {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-lg p-6 mx-auto text-center bg-white rounded-lg shadow-sm">
        <p className="mb-4 text-gray-700">{children}</p>
        <Link href="/note-de-frais" className="text-blue-700 hover:underline">
          Retour à la liste des notes
        </Link>
      </div>
    </div>
  );
}
