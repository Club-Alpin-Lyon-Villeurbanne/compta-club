import { FaFileAlt } from 'react-icons/fa';

export const Justificatif = ({ fileUrl, libelle }: { fileUrl: string | undefined; libelle?: string | null }) => {
    const nom = `Justificatif${libelle ? ` : ${libelle}` : ''} (ouvre un nouvel onglet)`;
    return (
        <>
            {fileUrl ? (
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={nom}
                    title={nom}
                    className="inline-flex items-center justify-center w-8 h-8 text-blue-500 rounded hover:text-blue-700 hover:bg-blue-50"
                >
                    <FaFileAlt className="w-5 h-5" aria-hidden="true" />
                </a>
            ) : (
                "N/A"
            )}
        </>
    );
};
