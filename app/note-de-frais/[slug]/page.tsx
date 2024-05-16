'use client';
import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const [ndf, setNdf] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://127.0.0.1:8000/api/expense-report/1');
      const data = await response.json();
      if (data.success) {
        setNdf(data.expenseReport);
      }
    };

    fetchData();
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect('/');
    return null;
  }

  if (!ndf) {
    return <div>Loading expense report...</div>;
  }
  return (
    <main>
      <div className="container px-4 mx-auto sm:px-8">
        <div className="flex">
          <Image
            src={`https://www.clubalpinlyon.fr/ftp/commission/${ndf.commission}/picto-dark.png`}
            alt=""
            className="float-left x-left-10"
            width={35}
            height={35} />
          <h2 className="pl-5 text-2xl font-semibold leading-tight"> {ndf.titre}</h2>
          <Link href={`https://www.clubalpinlyon.fr/sortie/-${ndf.id}.html`} className="inline-flex items-center px-3 py-2 ml-10 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Voir la sortie sur le site</Link>
        </div>
        <div className="flex flex-col my-2 sm:flex-row">
          <div className="flex flex-row mb-1 sm:mb-0">
            Date de début: {ndf.dateDebut}<br />
            Date de fin: {ndf.dateFin}<br />
            Statut: {ndf.statut}<br />
            Lieu: {ndf.lieu}
            Nombre de participants: {ndf.nbreParticipants}
          </div>
        </div>
        <div className="grid grid-flow-row-dense grid-cols-3">
          {ndf.demandeurs.map((demandeur: any, i: any) => (
            <div className="p-4 m-3 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" key={demandeur.id}>
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{demandeur.nom}</h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                Transport: {demandeur.transport}<br />
                Description transport: {demandeur.descriptionTransport} <br />
                Montant trajet: {demandeur.montantTrajet} €<br />
                Montant péage: {demandeur.montantPeage} €<br />
                Montant Hébergement: {demandeur.montantHebergement} €<br />
                Autres frais:<br />
                {demandeur.descriptionAutreFrais1}: {demandeur.montantAutre1} €<br />
                Total: {demandeur.montantTrajet + demandeur.montantPeage + demandeur.montantHebergement + demandeur.montantAutre} €<br />
                Remboursement: {demandeur.remboursement ? "oui" : "non"}<br />


              </p>
              <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Valider
              </button>
              <button className="inline-flex items-center px-3 py-2 ml-10 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Refuser
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}