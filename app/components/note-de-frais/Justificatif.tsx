import { FaFileAlt } from 'react-icons/fa';

export const Justificatif = ({ fileUrl }: { fileUrl: string | undefined }) => {
    return (
        <>
            {fileUrl ? (
                <a href={process.env.NEXT_PUBLIC_WEBSITE_BASE_URL + fileUrl} target="_blank"
                    rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                    <FaFileAlt className="inline-block w-5 h-5" />
                </a>
            ) : (
                "N/A"
            )}
        </>
    );
};