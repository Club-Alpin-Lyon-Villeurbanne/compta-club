import React from 'react';

export default function AidePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Aide - Compta-Club (Administration)</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Utilisation de Compta-Club pour les administrateurs</h2>
        <p className="mb-4">Compta-Club est une application conçue pour simplifier la gestion et la validation des notes de frais du Club Alpin de Lyon. Voici les principales fonctionnalités pour les administrateurs :</p>
        <ul className="list-disc pl-6">
          <li>Connexion : Utilisez vos identifiants administrateur pour accéder au système.</li>
          <li>Consultation des notes de frais : Visualisez toutes les notes de frais soumises par les membres.</li>
          <li>Vérification des détails : Examinez les dépenses et les justificatifs fournis pour chaque note de frais.</li>
          <li>Validation ou refus : Approuvez ou refusez les notes de frais après examen.</li>
          <li>Commentaires : Ajoutez des commentaires pour expliquer vos décisions ou demander des informations supplémentaires.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">FAQ pour les administrateurs</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">Comment valider une note de frais ?</h3>
            <p>Ouvrez la note de frais, vérifiez tous les détails et justificatifs. Si tout est en ordre, cliquez sur le bouton "Valider". Vous pouvez ajouter un commentaire si nécessaire.</p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Que faire si une note de frais est incomplète ?</h3>
            <p>Si des informations ou justificatifs manquent, vous pouvez soit refuser la note de frais, soit ajouter un commentaire demandant des compléments d'information au membre.</p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Comment gérer les litiges sur les notes de frais ?</h3>
            <p>En cas de litige, utilisez la fonction de commentaire pour communiquer avec le membre. Si nécessaire, vous pouvez marquer la note de frais comme "En litige" pour un traitement ultérieur.</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Bonnes pratiques pour la vérification des notes de frais</h2>
        <ul className="list-disc pl-6">
          <li>Vérifiez toujours la cohérence entre les montants déclarés et les justificatifs fournis.</li>
          <li>Assurez-vous que les dépenses sont conformes aux politiques du Club Alpin de Lyon.</li>
          <li>En cas de doute, n'hésitez pas à demander des clarifications au membre avant de prendre une décision.</li>
          <li>Traitez les notes de frais dans un délai raisonnable pour faciliter la gestion financière du club.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Besoin d'assistance technique ?</h2>
        <p>Si vous rencontrez des problèmes techniques avec l'application ou avez besoin d'aide supplémentaire, contactez notre équipe IT à : <a href="mailto:numerique@clubalpinlyon.fr" className="text-blue-600 hover:underline">numerique@clubalpinlyon.fr</a></p>
      </section>
    </div>
  );
}