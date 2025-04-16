import React from 'react';
import Pagination from '@mui/material/Pagination';

interface PagenationProps {
  props: {
    totalPages: number;
    currentPage: number;
    onChange?: (page: number) => void;
    gridRef?: React.RefObject<any>;
  }
}

export default function Pagenation1({ props }: PagenationProps) {
  const { totalPages, currentPage, onChange, gridRef } = props;

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onChange?.(value);
    gridRef?.current?.api?.paginationGoToPage?.(value - 1);
  };

  return (
    <Pagination 
      count={totalPages} 
      page={currentPage} 
      onChange={handleChange}
      boundaryCount={1}
      siblingCount={4}
    />
  );
}