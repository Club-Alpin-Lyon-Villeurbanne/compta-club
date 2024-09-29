import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { FaExternalLinkAlt } from 'react-icons/fa';
import { config } from '@/app/config';

export type HeaderProps = {
    commission: number;
    titre: string;
    id: number;
}

export default function Header({commission, titre, id}: HeaderProps) {
    const [imgSrc, setImgSrc] = useState(`https://www.clubalpinlyon.fr/ftp/commission/${commission}/picto-dark.png`);

    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <Image
                    src={imgSrc}
                    alt="Icône de la commission"
                    width={35}
                    height={35}
                    style={{width: 35, height: 35}}
                    onError={() => {
                        setImgSrc(config.DEFAULT_COMMISSION_ICON);
                    }}
                />
                <h2 className="ml-4 text-2xl font-semibold leading-tight">{titre}</h2>
            </div>
            <Link 
                href={`https://www.clubalpinlyon.fr/sortie/-${id}.html`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                target="_blank"
                rel="noopener noreferrer"
            >
                Voir la sortie
                <FaExternalLinkAlt className="ml-2" />
            </Link>
        </div>
    );
}