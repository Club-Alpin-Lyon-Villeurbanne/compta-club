import React from 'react';
import Image from "next/image";
import Link from "next/link";

export type HeaderProps = {
    commission: number;
    titre: string;
    id: number;
}

export default function Header({commission, titre, id}: HeaderProps) {
    return <>
        <Image
            src={`https://www.clubalpinlyon.fr/ftp/commission/${commission}/picto-dark.png`}
            alt=""
            className="float-left x-left-10"
            width={35}
            height={35}
            style={{width: 35, height: 35}}
        />
        <h2 className="pl-5 text-2xl font-semibold leading-tight"> {titre}</h2>
        <Link href={`https://www.clubalpinlyon.fr/sortie/-${id}.html`}
              className="inline-flex items-center px-3 py-2 ml-10 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Voir
            la sortie sur le site</Link>
    </>;
}
