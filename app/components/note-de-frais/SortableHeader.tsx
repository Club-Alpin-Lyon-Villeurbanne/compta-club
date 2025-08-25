import React from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { SortDirection } from '@/app/hooks/useSortableTable';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  className = '',
  align = 'left',
}) => {
  const isActive = currentSortKey === sortKey;
  
  const getSortIcon = () => {
    if (!isActive || sortDirection === null) {
      return <FaSort className="ml-1 opacity-30" />;
    }
    if (sortDirection === 'asc') {
      return <FaSortUp className="ml-1 text-blue-600" />;
    }
    return <FaSortDown className="ml-1 text-blue-600" />;
  };

  const alignClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <th 
      className={`${className} bg-gray-100 border-b-2 border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center ${alignClass}`}>
        <span className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
          {label}
        </span>
        {getSortIcon()}
      </div>
    </th>
  );
};

export default SortableHeader;