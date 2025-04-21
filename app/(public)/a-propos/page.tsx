'use client';

import Image from 'next/image';
import { FaMountain, FaUsers, FaCode, FaHeart, FaGithub, FaLightbulb } from 'react-icons/fa';

export default function AboutPage() {
    return (
        <div className="container max-w-5xl px-4 py-12 mx-auto">
            {/* En-tête avec image */}
            <div className="flex flex-col items-center mb-16 text-center">
                <div className="relative w-24 h-24 mb-6 overflow-hidden rounded-full">
                    <Image 
                        src="/images/logo.png" 
                        alt="Logo Club Alpin de Lyon" 
                        fill
                        className="object-contain p-2"
                    />
                </div>
                <h1 className="mb-4 text-4xl font-bold text-gray-900">À propos de Compta-Club</h1>
                <p className="max-w-2xl text-lg text-gray-600">
                    Un outil simple développé par des bénévoles pour faciliter la gestion des notes de frais du Club Alpin de Lyon.
                </p>
            </div>
            
            {/* Section principale */}
            <div className="grid gap-12 md:grid-cols-2">
                {/* Colonne de gauche */}
                <div className="space-y-8">
                    <section className="p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                                <FaMountain />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Origine du projet</h2>
                        </div>
                        <p className="text-gray-600">
                            Compta-Club a été créé pour répondre à un besoin simple : faciliter la gestion des notes de frais 
                            pour les bénévoles du Club Alpin de Lyon. Face aux difficultés rencontrées avec les méthodes traditionnelles, 
                            quelques bénévoles ont décidé de créer cet outil adapté aux besoins du club.
                        </p>
                    </section>

                    <section className="p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                                <FaUsers />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Objectif</h2>
                        </div>
                        <p className="text-gray-600">
                            Notre objectif est simple : offrir aux bénévoles et aux encadrants un outil pratique pour gérer 
                            leurs notes de frais sans complication. Nous voulons que les tâches administratives soient les plus 
                            simples possible pour que vous puissiez vous concentrer sur ce qui compte vraiment.
                        </p>
                    </section>

                    <section className="p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                                <FaCode />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Technologies</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Compta-Club est développé avec des technologies modernes :
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center p-2 text-sm bg-gray-50 rounded-lg">
                                <span className="w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>
                                Next.js
                            </div>
                            <div className="flex items-center p-2 text-sm bg-gray-50 rounded-lg">
                                <span className="w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>
                                React
                            </div>
                            <div className="flex items-center p-2 text-sm bg-gray-50 rounded-lg">
                                <span className="w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>
                                TypeScript
                            </div>
                            <div className="flex items-center p-2 text-sm bg-gray-50 rounded-lg">
                                <span className="w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>
                                TailwindCSS
                            </div>
                        </div>
                    </section>
                </div>

                {/* Colonne de droite */}
                <div className="space-y-8">
                    <section className="p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                                <FaLightbulb />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Fonctionnalités</h2>
                        </div>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">1</span>
                                <span>Saisie simplifiée des notes de frais</span>
                            </li>
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">2</span>
                                <span>Suivi du statut des remboursements</span>
                            </li>
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">3</span>
                                <span>Gestion des justificatifs</span>
                            </li>
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">4</span>
                                <span>Interface adaptée à tous les appareils</span>
                            </li>
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-5 h-5 mr-2 mt-0.5 text-sm text-white bg-blue-600 rounded-full">5</span>
                                <span>Accès sécurisé</span>
                            </li>
                        </ul>
                    </section>

                    <section className="p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                                <FaHeart />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Les bénévoles</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Compta-Club est le résultat du travail de bénévoles qui ont mis leurs compétences au service du club. 
                            Chacun a apporté sa contribution, que ce soit en développement, en design ou en organisation.
                        </p>
                        <p className="text-gray-600">
                            Nous espérons que cet outil vous facilitera la tâche et vous permettra de consacrer plus de temps 
                            aux activités que vous aimez vraiment au sein du Club Alpin de Lyon.
                        </p>
                    </section>

                    <section className="p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-600 rounded-lg">
                                <FaGithub />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">Code source</h2>
                        </div>
                        <p className="text-gray-600">
                            Le code de Compta-Club est disponible sur GitHub. Si vous avez des idées d&apos;amélioration ou si vous 
                            souhaitez simplement explorer le code, n&apos;hésitez pas à consulter notre dépôt.
                        </p>
                        <a 
                            href="https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <FaGithub className="mr-2" />
                            Voir le code source
                        </a>
                    </section>
                </div>
            </div>
        </div>
    );
} 