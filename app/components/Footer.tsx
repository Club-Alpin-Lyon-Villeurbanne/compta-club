import Link from "next/link";
import { FaGithub, FaClipboardList, FaInfoCircle } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-white shadow-md dark:bg-gray-900">
            <div className="w-full mx-auto max-w-screen-xl px-4 py-6 md:flex md:items-center md:justify-between">
                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                    Réalisé avec ❤️ par les bénévoles du{' '}
                    <a href="https://clubalpinlyon.fr/" className="hover:underline font-medium">
                        Club Alpin de Lyon
                    </a>
                </span>
                <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
                    <li>
                        <Link href="/about" className="mr-4 hover:underline md:mr-6 flex items-center">
                            <FaInfoCircle className="mr-1" />
                            À propos
                        </Link>
                    </li>
                    <li>
                        <a href="https://sharing.clickup.com/42653954/l/h/18np82-82/e8c751e9ba9d61f" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="mr-4 hover:underline md:mr-6 flex items-center">
                            <FaClipboardList className="mr-1" />
                            Backlog du projet
                        </a>
                    </li>
                    <li>
                        <a href="https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="hover:underline flex items-center">
                            <FaGithub className="mr-1" />
                            Code source
                        </a>
                    </li>
                </ul>
            </div>
        </footer>
    )
}