import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white rounded-lg shadow m-4 dark:bg-gray-900">
            <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
                <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">Réalisé avec ❤️ par les bénévoles du <a href="https://clubalpinlyon.fr/" className="hover:underline">Club Alpin de Lyon</a>
                </span>
                <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0 mr-4">
                    <li>
                        <a href="#" className="mr-4 hover:underline md:mr-6">A propos</a>
                    </li>
                    <li>
                        <Link href="https://sharing.clickup.com/42653954/l/h/18np82-82/e8c751e9ba9d61f" className="hover:underline mr-4">Backlog du projet</Link>
                    </li>
                    <li>
                        <Link href="https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club" className="hover:underline mr-4">Code source</Link>
                    </li>
                </ul>
            </div>
        </footer>
    )
}