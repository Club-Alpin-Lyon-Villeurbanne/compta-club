import React from 'react';
import { FaQuestionCircle, FaCheckCircle, FaExclamationTriangle, FaEnvelope, FaFileAlt, FaComments } from 'react-icons/fa';

export default function AidePage() {
  return (
    <div className="container max-w-5xl px-4 py-12 mx-auto">
      {/* En-tête */}
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 mb-4 text-white bg-blue-600 rounded-full">
          <FaQuestionCircle className="w-8 h-8" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Centre d&apos;aide</h1>
        <p className="max-w-2xl text-lg text-gray-600">
          Trouvez des réponses à vos questions sur l&apos;utilisation de Compta-Club
        </p>
      </div>

      {/* Sections principales */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Colonne de gauche */}
        <div className="space-y-8">
          <section className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                <FaFileAlt />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Guide d&apos;utilisation</h2>
            </div>
            <p className="mb-4 text-gray-600">
              Compta-Club est conçu pour simplifier la gestion des notes de frais. Voici les principales fonctionnalités :
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">1</span>
                <span>Connexion avec vos identifiants administrateur</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">2</span>
                <span>Consultation des notes de frais soumises</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">3</span>
                <span>Vérification des détails et justificatifs</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">4</span>
                <span>Validation ou refus des notes de frais</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">5</span>
                <span>Ajout de commentaires pour communiquer</span>
              </li>
            </ul>
          </section>

          <section className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                <FaCheckCircle />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Bonnes pratiques</h2>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-green-500 rounded-full">✓</span>
                <span>Vérifiez la cohérence entre les montants et les justificatifs</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-green-500 rounded-full">✓</span>
                <span>Assurez-vous que les dépenses sont conformes aux politiques du club</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-green-500 rounded-full">✓</span>
                <span>Demandez des clarifications en cas de doute</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-green-500 rounded-full">✓</span>
                <span>Traitez les notes de frais dans un délai raisonnable</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Colonne de droite */}
        <div className="space-y-8">
          <section className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                <FaComments />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Questions fréquentes</h2>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="mb-2 text-lg font-medium text-gray-800">Comment valider une note de frais ?</h3>
                <p className="text-gray-600">
                  Ouvrez la note de frais, vérifiez tous les détails et justificatifs. Si tout est en ordre, 
                  cliquez sur le bouton &quot;Valider&quot;. Vous pouvez ajouter un commentaire si nécessaire.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="mb-2 text-lg font-medium text-gray-800">Que faire si une note de frais est incomplète ?</h3>
                <p className="text-gray-600">
                  Si des informations ou justificatifs manquent, vous pouvez soit refuser la note de frais, 
                  soit ajouter un commentaire demandant des compléments d&apos;information au membre.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="mb-2 text-lg font-medium text-gray-800">Comment gérer les litiges sur les notes de frais ?</h3>
                <p className="text-gray-600">
                  En cas de litige, utilisez la fonction de commentaire pour communiquer avec le membre. 
                  Si nécessaire, vous pouvez marquer la note de frais comme &quot;En litige&quot; pour un traitement ultérieur.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                <FaExclamationTriangle />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Problèmes courants</h2>
            </div>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-red-500 rounded-full">!</span>
                <span>Impossible de se connecter : vérifiez vos identifiants ou contactez l&apos;administrateur</span>
              </div>
              <div className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-red-500 rounded-full">!</span>
                <span>Problèmes d&apos;affichage : essayez de vider le cache de votre navigateur</span>
              </div>
              <div className="flex items-start">
                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-red-500 rounded-full">!</span>
                <span>Erreurs lors de la validation : assurez-vous d&apos;avoir les droits nécessaires</span>
              </div>
            </div>
          </section>

          <section className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                <FaEnvelope />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Besoin d&apos;aide supplémentaire ?</h2>
            </div>
            <p className="mb-4 text-gray-600">
              Si vous rencontrez des problèmes techniques ou avez besoin d&apos;aide supplémentaire, 
              notre équipe est là pour vous aider.
            </p>
            <a 
              href="mailto:numerique@clubalpinlyon.fr" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <FaEnvelope className="mr-2" />
              Contacter l&apos;équipe technique
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}