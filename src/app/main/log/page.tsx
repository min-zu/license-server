'use client';

import { useEffect, useState, useRef } from 'react';
// ag-grid
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, ValidationModule, RowSelectionModule, CellStyleModule, ColDef, Module, PaginationModule } from 'ag-grid-community';
import { Button, FormControl, MenuItem, Select, TextField } from '@mui/material';
import Pagenation from '@/app/components/pagenation';
import { fetchLogs, searchLogs } from '@/app/api/log/log'; // API 요청 함수 임포트

// toast
import { useToastState } from '@/app/components/useToast';

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
    CellStyleModule,
    PaginationModule
  ];
  const [logs, setLogs] = useState<Log[]>([]);

  // AG Grid API에 접근하기 위한 참조 객체
  const gridRef = useRef<any>(null);

  // 검색 상태
  const [searchText, setSearchText] = useState<string>('');
  const [searchField, setSearchField] = useState<string>('hardware_code');

  // 페이지 상태
  const [pageSize, setPageSize] = useState<number>(20);
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
        const value = params.value;
        if(!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
      }
    },
    { field: 'manager', headerName: '발급요청사(총판사)', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' },
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
      showToast('검색어가 입력되지 않았습니다.', 'warning');
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

  // 현재 페이지 번호와 전체 페이지 수
  const handlePaginationChanged = (params: any) => {
    const current = params.api.paginationGetCurrentPage() + 1;
    const total = params.api.paginationGetTotalPages();
    setCurrentPage(current);
    setTotalPages(total);
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
              // setCurrentPage(1);
              gridRef.current?.api?.paginationGoToPage?.(0);
            }}
          >
            <MenuItem value={20}>20개</MenuItem>
            <MenuItem value={50}>50개</MenuItem>
            <MenuItem value={100}>100개</MenuItem>
            <MenuItem value={1000000}>전체</MenuItem>
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
          className="default-btn"
          size="small"
          onClick={() => {handleSearch()}}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        >
          검색
        </Button>

        <Button
          variant="contained"
          className="default-btn"
          size="small"
          onClick={() => {
            loadLogs();
            setSearchText('');
            setSearchField('hardware_code');
          }}
        >
          ↻
        </Button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <AgGridReact
          // rowData={getCurrentPageData()}
          rowData={logs}
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
          pagination={true}
          suppressPaginationPanel={true}
          paginationPageSize={pageSize}
          onPaginationChanged={handlePaginationChanged}
          ref={gridRef}
        />
      </div>

      <footer className="flex justify-between items-center mt-4">
        <div className="flex justify-center flex-grow">
          <Pagenation 
            props={{
              // totalPages,
              // currentPage,
              // onChange: handlePageChange
              totalPages: totalPages,
              currentPage: currentPage,
              gridRef: gridRef,
            }}
          />
        </div>
        <span className='text-13'>총 {logs.length}개</span>
      </footer>
      
      {ToastComponent}
    </div>
  );
} 