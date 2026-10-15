import React from 'react';
import { FaQuestionCircle, FaCheckCircle, FaExclamationTriangle, FaEnvelope, FaFileAlt, FaComments } from 'react-icons/fa';

export const metadata = { title: 'Aide' };

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
                <span>Approbation ou refus des notes de frais, puis comptabilisation</span>
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
                <h3 className="mb-2 text-lg font-medium text-gray-800">Comment approuver une note ?</h3>
                <p className="text-gray-600">
                  Ouvrez-la depuis «&nbsp;À valider&nbsp;», vérifiez les justificatifs, puis «&nbsp;Approuver&nbsp;». Le demandeur reçoit un mail.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="mb-2 text-lg font-medium text-gray-800">Une note est incomplète ?</h3>
                <p className="text-gray-600">
                  «&nbsp;Refuser&nbsp;», avec un message au demandeur : il le reçoit par mail, corrige et renvoie sa note. Une note
                  hors sortie repasse alors par le responsable de sa commission, s&apos;il y en a un.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="mb-2 text-lg font-medium text-gray-800">Notes hors sortie (formation, achat)</h3>
                <p className="text-gray-600">
                  Elles arrivent validées par le responsable de leur commission («&nbsp;Validée par le responsable&nbsp;»), ou
                  directement si personne d&apos;autre ne peut les valider («&nbsp;Directement à la trésorerie&nbsp;»).
                  Si un responsable de la commission redevient actif (renouvellement, nomination) avant votre décision, la note
                  quitte la liste et attend la sienne, sans que personne soit prévenu par mail. Une approbation depuis une page
                  restée ouverte reçoit alors «&nbsp;Cette note attend encore la décision du responsable de la commission.&nbsp;»
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
                <span>Erreur lors d&apos;une action : assurez-vous d&apos;avoir les droits nécessaires</span>
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