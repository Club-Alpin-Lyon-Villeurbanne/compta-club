import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const ndf =
  {
    id: 5943,
    titre: "Cycle découverte Splitboard #1 Dévoluy",
    commission: 32,
    dateDebut: "21 janvier 2023",
    dateFin: "22 janvier 2023",
    statut: "Validée",
    lieu: "Aravis",
    nbreParticipants: 9,
    demandeurs: [
      {
        id: 1,
        nom: "Nicolas Ritouet",
        transport: "minibus club",
        descriptionTransport: "Trajet Bron -> Thones -> Bron",
        montantTrajet: 123,
        montantPeage: 23,
        montantHebergement: 100,
        montantAutre1: 23,
        descriptionAutreFrais1: "forfait Tignes",
        remboursement: true
      },
      {
        id: 2,
        nom: "Jean-Christophe Segault",
        transport: "voiture perso",
        descriptionTransport: "Trajet Bron -> Thones -> Bron",
        montantTrajet: 145,
        montantPeage: 23,
        montantHebergement: 80,
        montantAutre1: 23,
        descriptionAutreFrais1: "forfait Tignes",
        remboursement: false
      },
      {
        id: 3,
        nom: "Bernard Servant",
        transport: "voiture perso",
        descriptionTransport: "Trajet Bron -> Thones -> Bron",
        montantTrajet: 145,
        montantPeage: 23,
        montantHebergement: 80,
        montantAutre1: 23,
        descriptionAutreFrais1: "forfait Tignes",
        remboursement: false
      },
    ]
  };
  return (
    <main>
      <div className="container mx-auto px-4 sm:px-8">
        <div className="flex">
          <Image
            src={`https://www.clubalpinlyon.fr/ftp/commission/${ndf.commission}/picto-dark.png`}
            alt=""
            className="float-left x-left-10"
            width={35}
            height={35} />
          <h2 className="text-2xl font-semibold leading-tight pl-5"> {ndf.titre}</h2>
          <Link href={`https://www.clubalpinlyon.fr/sortie/-${ndf.id}.html`} className="inline-flex items-center px-3 py-2 ml-10 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Voir la sortie sur le site</Link>
        </div>
        <div className="my-2 flex sm:flex-row flex-col">
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
