'use client';

import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, ValidationModule, RowSelectionModule, CellStyleModule, ColDef, Module } from 'ag-grid-community';
import { useEffect, useState, useRef } from 'react';
import { Button, FormControl, MenuItem, Select, TextField } from '@mui/material';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Pagenation from '@/app/components/pagenation';

interface Log {
  number: number;
  hardware_code: string;
  date: string;
  manager: string;
  site_nm: string;  
}

export default function LogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>('');
  const [searchField, setSearchField] = useState<string>('hardware_code');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const modules: Module[] = [
    ClientSideRowModelModule,
    ValidationModule,
    RowSelectionModule,
    CellStyleModule
  ];
  const [columnDefs] = useState<(ColDef<Log, any>)[]>([
    { field: 'number', headerName: 'No', width: 120, checkboxSelection: true, headerCheckboxSelection: true, cellStyle: { textAlign: 'center', fontSize: '10px' } },
    { field: 'hardware_code', headerName: '제품 시리얼 번호', flex: 2, cellStyle: { textAlign: 'center', fontSize: '10px' } },
    { 
      field: 'date', 
      headerName: '라이센스 발급일', 
      flex: 1,
      cellStyle: { textAlign: 'center', fontSize: '10px' },
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toISOString().split('T')[0];
        }
        return '';
      }
    },
    { field: 'manager', headerName: '발급요청사(출판사)', flex: 1, cellStyle: { textAlign: 'center', fontSize: '10px' } },
    { field: 'site_nm', headerName: '고객사명', flex: 1, cellStyle: { textAlign: 'center', fontSize: '10px' } }
  ]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/log');
        if (!response.ok) {
          throw new Error('로그 데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setLogs(data);
        setTotalPages(Math.ceil(data.length / pageSize));
      } catch (error) {
        console.error('로그 데이터 조회 중 오류 발생:', error);
      }
    };

    fetchLogs();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchField, searchText })
      });
      console.log('response', response);
      if (!response.ok) {
        throw new Error('검색 중 오류가 발생했습니다.');
      } 
      const data = await response.json();
      setLogs(data);
      setTotalPages(Math.ceil(data.length / pageSize));
      setCurrentPage(1);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    console.log('logs', logs);
  }, [logs]); 

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 현재 페이지에 해당하는 데이터만 필터링
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize; 
    const endIndex = startIndex + pageSize;
    return logs.slice(startIndex, endIndex);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <MenuItem value={10}>10개</MenuItem>
            <MenuItem value={20}>20개</MenuItem>
            <MenuItem value={50}>50개</MenuItem>
            <MenuItem value={100}>100개</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            {columnDefs
              .filter(col => col.field !== 'number')
              .map((col) => (
                <MenuItem key={col.field} value={col.field}>
                  {col.headerName}
                </MenuItem>
              ))
            }
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="검색어를 입력하세요"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <Button
          variant="contained"
          size="small"
          onClick={() => {handleSearch();}}
        >
          검색
        </Button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 240px)', width: '100%' }}>
        <AgGridReact
          rowData={getCurrentPageData()}
          rowHeight={30}
          headerHeight={30}
          columnDefs={columnDefs}
          modules={modules}
          theme="legacy"
          defaultColDef={{
            sortable: true,
            resizable: true,
            headerClass: 'text-center' // 헤더 텍스트 가운데 정렬
          }}
          rowSelection="multiple"
          pagination={false}
        />
      </div>

      <footer className="flex justify-center items-center mt-4">
        <Pagenation 
          props={{
            totalPages,
            currentPage,
            onChange: handlePageChange
          }}
        />
      </footer>
    </div>
  );
} 