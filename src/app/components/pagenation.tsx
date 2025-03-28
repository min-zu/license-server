import React from 'react';
import Pagination from '@mui/material/Pagination';

interface PagenationProps {
  props: {
    totalPages: number;
    currentPage: number;
    onChange?: (page: number) => void;
  }
}

export default function Pagenation({ props }: PagenationProps) {
  const { totalPages, currentPage, onChange } = props;

  console.log('totalPages', totalPages);
  console.log('currentPage', currentPage);
  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <Pagination 
      count={totalPages} 
      page={currentPage} 
      boundaryCount={1}
      siblingCount={4}
      onChange={handleChange}
    />
  );
}