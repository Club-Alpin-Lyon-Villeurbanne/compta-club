import useStore from '@/app/store/useStore';
import React from "react";

const Pagination: React.FC = () => {
    const currentPage = useStore((state) => state.currentPage);
    const setCurrentPage = useStore((state) => state.setCurrentPage);
    const paginationMeta = useStore((state) => state.paginationMeta);
    const displayedCount = useStore((state) => state.displayedCount);

    const totalPages = paginationMeta?.pages ?? 1;

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    if (!paginationMeta || paginationMeta.total === 0) return null;

    return (
        <div className="flex flex-col items-center px-5 py-5 bg-white border-t xs:flex-row xs:justify-between ">
      <span className="text-xs text-gray-900 xs:text-sm">
        {displayedCount} note{displayedCount > 1 ? 's' : ''} de frais affichée{displayedCount > 1 ? 's' : ''} — Page {currentPage} sur {totalPages}
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
