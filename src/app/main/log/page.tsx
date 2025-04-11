'use client';

import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, ValidationModule, RowSelectionModule, CellStyleModule, ColDef, Module } from 'ag-grid-community';
import { useEffect, useState, useRef } from 'react';
import { Button, FormControl, MenuItem, Select, TextField } from '@mui/material';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../../style/common.css';
import '../../style/license.css';
import Pagenation from '@/app/components/pagenation';
import { fetchLogs, searchLogs } from '@/app/api/log/log'; // API 요청 함수 임포트
import { useToastState } from '@/app/components/useToast';
import ToastAlert from '@/app/components/toastAleat';

interface Log {
  number: number;
  hardware_code: string;
  date: string;
  manager: string;
  site_nm: string;  
}

export default function LogPage() {
  // ag-grid 모듈 설정
  const modules: Module[] = [
    ClientSideRowModelModule,
    ValidationModule,
    RowSelectionModule,
    CellStyleModule
  ];
  const [logs, setLogs] = useState<Log[]>([]);

  // 검색 상태
  const [searchText, setSearchText] = useState<string>('');
  const [searchField, setSearchField] = useState<string>('hardware_code');

  // 페이지 상태
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  

  // ToastAlert
  const {  showToast, ToastComponent } = useToastState();

  const [columnDefs] = useState<(ColDef<Log, any>)[]>([
    { field: 'number', headerName: 'No', width: 120, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'hardware_code', headerName: '제품 시리얼 번호', flex: 2, headerClass: 'header-style', cellClass: 'cell-style' },
    { 
      field: 'date', 
      headerName: '라이센스 발급일', 
      flex: 1,
      headerClass: 'header-style',
      cellClass: 'cell-style',
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toISOString().split('T')[0];
        }
        return '';
      }
    },
    { field: 'manager', headerName: '발급요청사(출판사)', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'site_nm', headerName: '고객사명', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' }
  ]);

  const loadLogs = async () => {
    try {
      const data = await fetchLogs();
      setLogs(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error('로그 데이터 조회 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = async () => {
    if(searchText === '') {
      showToast('검색어가 입력되지 않았습니다.', 'error');
      loadLogs();
      return;
    }
    try {
      const data = await searchLogs(searchField, searchText);
      setLogs(data);
      setTotalPages(Math.ceil(data.length / pageSize));
      setCurrentPage(1);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  useEffect(() => {
    setTotalPages(Math.ceil(logs.length / pageSize));
  }, [logs, pageSize]);

  // 현재 페이지에 해당하는 데이터만 필터링
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize; 
    const endIndex = startIndex + pageSize;
    return logs.slice(startIndex, endIndex);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-1 mb-4">
        <FormControl size="small" sx={{ width: 90 }}>
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <MenuItem value={10}>10개</MenuItem>
            <MenuItem value={20}>20개</MenuItem>
            <MenuItem value={50}>50개</MenuItem>
            <MenuItem value={100}>100개</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ width: 160 }}>
          <Select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            {columnDefs
              .filter(item => item.field !== 'number')
              .map((item) => (
                <MenuItem key={item.field} value={item.field}>
                  {item.headerName}
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
          onClick={() => {handleSearch()}}
        >
          검색
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => {
            loadLogs();
            setSearchText('');
            setSearchField('hardware_code');
          }}
        >
          🔃
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
          pagination={false}
        />
      </div>

      <footer className="flex justify-between items-center mt-4">
        <div className="flex justify-center flex-grow">
          <Pagenation 
            props={{
              totalPages,
              currentPage,
              onChange: handlePageChange
            }}
          />
        </div>
        <span className='text-13'>총 {logs.length}개</span>
      </footer>
      
      {ToastComponent}
    </div>
  );
} 