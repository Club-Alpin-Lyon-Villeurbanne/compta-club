import Link from "next/link";
import { FaGithub, FaClipboardList, FaInfoCircle } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-white shadow-md dark:bg-gray-900">
            <div className="w-full max-w-screen-xl px-4 py-6 mx-auto md:flex md:items-center md:justify-between">
                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                    Réalisé avec ❤️ par les bénévoles du{' '}
                    <a href="https://clubalpinlyon.fr/" className="font-medium hover:underline">
                        Club Alpin de Lyon
                    </a>
                </span>
                <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
                    <li>
                        <Link href="/a-propos" className="flex items-center mr-4 hover:underline md:mr-6">
                            <FaInfoCircle className="mr-1" />
                            À propos
                        </Link>
                    </li>
                    <li>
                        <a href="https://sharing.clickup.com/42653954/l/h/18np82-82/e8c751e9ba9d61f" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center mr-4 hover:underline md:mr-6">
                            <FaClipboardList className="mr-1" />
                            Backlog du projet
                        </a>
                    </li>
                    <li>
                        <a href="https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center hover:underline">
                            <FaGithub className="mr-1" />
                            Code source
                        </a>
                    </li>
                </ul>
            </div>
        </footer>
    )
}