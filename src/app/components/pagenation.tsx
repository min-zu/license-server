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

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <Pagination 
      count={totalPages} 
      page={currentPage} 
      onChange={handleChange}
    />
  );
}