'use client';

export default function AboutPage() {
    return (
        <div className="container max-w-4xl px-4 py-8 mx-auto">
            <h1 className="mb-8 text-3xl font-bold text-gray-900">À propos</h1>
            
            <div className="space-y-6 text-gray-600">
                <section>
                    <h2 className="mb-4 text-2xl font-semibold text-gray-800">Compta-Club</h2>
                    <p>
                        Compta-Club est une application web développée spécifiquement pour le Club Alpin de Lyon 
                        afin de simplifier et moderniser la gestion des notes de frais.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold text-gray-800">Notre Mission</h2>
                    <p>
                        Faciliter la gestion administrative des bénévoles et des encadrants du Club Alpin de Lyon 
                        en proposant un outil simple et efficace pour la saisie et le suivi des notes de frais.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold text-gray-800">Fonctionnalités</h2>
                    <ul className="ml-6 list-disc">
                        <li>Saisie simplifiée des notes de frais</li>
                        <li>Suivi en temps réel du statut des remboursements</li>
                        <li>Gestion des justificatifs dématérialisés</li>
                        <li>Interface intuitive et responsive</li>
                        <li>Accès sécurisé avec authentification</li>
                    </ul>
                </section>
            </div>
        </div>
    );
} 