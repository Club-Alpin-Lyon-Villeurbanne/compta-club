import useStore from '@/app/store/useStore';
import React from "react";

const Pagination: React.FC = () => {
    const currentPage = useStore((state) => state.currentPage);
    const setCurrentPage = useStore((state) => state.setCurrentPage);
    const itemsPerPage = useStore((state) => state.itemsPerPage);
    const paginationMeta = useStore((state) => state.paginationMeta);

    const totalItems = paginationMeta?.total ?? 0;
    const totalPages = paginationMeta?.pages ?? 1;

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col items-center px-5 py-5 bg-white border-t xs:flex-row xs:justify-between ">
      <span className="text-xs text-gray-900 xs:text-sm">
        Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} à{" "} {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} notes de frais
      </span>
            <div className="inline-flex mt-2 xs:mt-0">
                <button
                    className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-300 rounded-l hover:bg-gray-400"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                >
                    Précédent
                </button>
                <button
                    className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-300 rounded-r hover:bg-gray-400"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                >
                    Suivant
                </button>
            </div>
        </div>
    );
};

export default Pagination;
