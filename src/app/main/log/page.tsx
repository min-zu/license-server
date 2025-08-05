'use client';

import { useEffect, useState, useRef } from 'react';
// ag-grid
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, ValidationModule, RowSelectionModule, CellStyleModule, ColDef, Module, PaginationModule } from 'ag-grid-community';
import { Button, FormControl, MenuItem, Select, TextField, Modal } from '@mui/material';
import Pagenation from '@/app/components/pagenation';
import { fetchLogs, searchLogs, fetchLogDetail } from '@/app/api/log/log'; // API 요청 함수 임포트

// 컴포넌트
import LicenseDetailModal from '@/app/components/licenseDetailModal'; // 라이센스 상세 모달 임포트

// toast
import { useToastState } from '@/app/components/useToast';

interface Log {
  number: number;
  action_date: string;
  hardware_serial: string;
  customer: string | null;
  action: string;
  action_type: string | null;
  user: string | null;
  ip: string;
  desc: string | null;
}

interface LogDetail {
  number: number;
  reg_date: string;
  hardware_serial: string;
  hardware_status: string;
  software_opt: object;
  license_date: string;
  limit_time_start: string;
  limit_time_end: string;
  ip: string;
  reg_user: string;
  reg_request: string;
  customer: string;
  reg_auto: number; 
  expiration: number;
  // 필요한 다른 라이센스 필드들을 여기에 추가
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
  const [searchField, setSearchField] = useState<string>('hardware_serial');
  const [searchStartDate, setSearchStartDate] = useState<string>('');
  const [searchEndDate, setSearchEndDate] = useState<string>('');

  // 페이지 상태
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSizeType, setPageSizeType] = useState<string>('select');

  // 라이센스 상세보기 모달 열기 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [logDetail, setLogDetail] = useState<LogDetail | null>(null); // 선택된 라이센스 상태 추가
  const detailModalClose = () => setDetailModalOpen(false);
  

  // ToastAlert
  const {  showToast, ToastComponent } = useToastState();

  // 데이터 인덱스 계산 함수
  const getDataRange = () => {
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, logs.length);
    return logs.length > 0 ? `${startIndex.toLocaleString()}-${endIndex.toLocaleString()}` : '0';
  };

  const [columnDefs] = useState<(ColDef<Log, any>)[]>([
    { field: 'number', headerName: 'No', width: 120, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'hardware_serial', headerName: '제품 시리얼 번호', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'customer', headerName: '고객사 명', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'action_type', headerName: '분류', flex: 1, headerClass: 'header-style', cellClass: 'cell-style',
      valueFormatter: (params) => {
        const map: { [key: string]: string } = {
          account: '계정',
          license: '라이센스',
          login: '로그인',
          logout: '로그아웃'
        };
        return map[params.value] ?? null;  // 정의되지 않은 값이면 null 반환
      }
    },
    { field: 'action', headerName: '상태', flex: 1, headerClass: 'header-style', cellClass: 'cell-style',
        valueFormatter: (params) => {
        const map: { [key: string]: string } = {
          success: '성공',
          fail: '실패',
        };
        return map[params.value] ?? null;  // 정의되지 않은 값이면 null 반환
      }
    },
    { field: 'desc', headerName: '설명', flex: 2, headerClass: 'header-style', cellClass: 'cell-style', 
      valueFormatter: (params) => {
        return params.value || '완료';
      }
    },
    { field: 'user', headerName: '사용자 ID', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'ip', headerName: '사용자 IP', flex: 1, headerClass: 'header-style', cellClass: 'cell-style' },
    { field: 'action_date', headerName: '날짜', flex: 1, headerClass: 'header-style', cellClass: 'cell-style',
      valueFormatter: (params: any) => {
        const value = params.value;
        if(!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
      }
    }
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
    const isDateField = searchField.includes('date');
    if(!isDateField && searchText === '') {
      showToast('검색어가 입력되지 않았습니다.', 'warning');
      loadLogs();
      return;
    }
    if(isDateField && (!searchStartDate || !searchEndDate)) {
      showToast('시작일과 종료일을 모두 입력해주세요.', 'warning');
      return;
    }
    try {
      const searchData = isDateField ? { startDate: searchStartDate, endDate: searchEndDate } : searchText;
      const data = await searchLogs(searchField, searchData);
      setLogs(data);
      setTotalPages(Math.ceil(data.length / pageSize));
      gridRef.current?.api?.paginationGoToPage?.(0);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  };

  // 로그 상세 모달 열기
  const onRowClicked = async (event: any) => {
    // hardware_serial 값이 없으면 상세 모달 열지 않음
    if (!event.data?.hardware_serial) {
      return;
    }
    event.api.deselectAll();
    event.node.setSelected(true);
    
    try {
      const date = new Date(event.data.action_date);
      let data = await fetchLogDetail(event.data.hardware_serial, date.toLocaleString('sv-SE', { timeZone: 'UTC' }));
      if(data === undefined || data.length === 0) {
        data = await fetchLogDetail(event.data.hardware_serial, date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }));
      }
      if(data === undefined || data.length === 0) {
        showToast('상세보기 데이터가 없습니다.', 'warning');
        return;
      }
      setLogDetail(data[0]);
      setDetailModalOpen(true); // 모달 열기
    } catch (error) {
      console.error('로그 상세 데이터 조회 중 오류 발생:', error);
    }
  };

  // 현재 페이지 번호와 전체 페이지 수
  const handlePaginationChanged = (params: any) => {
    const current = params.api.paginationGetCurrentPage() + 1;
    const total = params.api.paginationGetTotalPages();
    setCurrentPage(current);
    setTotalPages(total);
  };
  
  useEffect(() => {
    setTotalPages(Math.ceil(logs.length / pageSize));
  }, [logs, pageSize]);

  useEffect(() => {
    setSearchText('');
    if(searchField === 'action') {
      setSearchText('success'); 
    } 
    if(searchField === 'action_type') {
      setSearchText('license');
    }
  }, [searchField]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-1 mb-4">
        <FormControl size="small" sx={{ width: 90 }}>
          <Select
            value={pageSizeType === 'input' ? 'input' : pageSize}
            onChange={(e) => {
              if(e.target.value !== 'input') {
                setPageSizeType('select'); 
                setPageSize(Number(e.target.value));
                gridRef.current?.api?.paginationGoToPage?.(0);
              }else{
                setPageSizeType('input');
              }
            }}
          >
            <MenuItem value={20}>20개</MenuItem> 
            <MenuItem value={50}>50개</MenuItem>
            <MenuItem value={100}>100개</MenuItem>
            <MenuItem value={'input'}>입력</MenuItem>
            <MenuItem value={1000000}>전체</MenuItem>
          </Select>
        </FormControl>
        {pageSizeType === 'input' && (
          <FormControl size="small" sx={{ width: 80}}>
          <TextField
            size="small"
            placeholder="입력"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          />
          </FormControl>
        )}
        
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
        
        {searchField === 'action' ? (
          <Select
            size="small"
            defaultValue="success"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          >
            <MenuItem value="success">성공</MenuItem>
            <MenuItem value="fail">실패</MenuItem>
          </Select>
        ) : searchField === 'action_type' ? (
          <Select
            size="small"
            defaultValue="license"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          >
            <MenuItem value="license">라이센스</MenuItem>
            <MenuItem value="account">계정</MenuItem>
            <MenuItem value="login">로그인</MenuItem>
            <MenuItem value="logout">로그아웃</MenuItem>
          </Select>
        ) : searchField.includes('date') ? (
          <div className="flex gap-2">
            <TextField
              type="date"
              size="small"
              value={searchStartDate}
              onChange={(e) => setSearchStartDate(e.target.value)}
              placeholder="시작일"
            />
            <span className="flex items-center">~</span>
            <TextField
              type="date"
              size="small"
              value={searchEndDate}
              onChange={(e) => setSearchEndDate(e.target.value)}
              placeholder="종료일"
            />
          </div>
        ) : (
          <TextField
            size="small"
            placeholder="검색어를 입력하세요"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        )}

        <Button
          variant="contained"
          className="default-btn"
          size="small"
          onClick={() => {handleSearch()}}
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
            setSearchField('hardware_serial');
            gridRef.current?.api?.paginationGoToPage?.(0);
          }}
        >
          ↻
        </Button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <AgGridReact
          // rowData={getCurrentPageData()}
          rowData={logs}
          rowSelection="single"
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
          onCellClicked={onRowClicked}
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
        <span className='text-13 text-black'>
          {getDataRange()} / 총 {logs.length.toLocaleString()}개
        </span>
      </footer>
      
      <Modal
          open={isDetailModalOpen}
          onClose={detailModalClose}
          >
            <span>
            <LicenseDetailModal 
              close={detailModalClose}
              license={logDetail}
              isLog={true}
            />
            </span>
          </Modal>
      {ToastComponent}
    </div>
  );
} 

