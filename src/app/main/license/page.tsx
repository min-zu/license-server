'use client';

import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, Module, ColDef, ColGroupDef, CellStyleModule, RowSelectionModule, GridApi } from 'ag-grid-community';
import { use, useEffect, useRef, useState } from 'react';
import { Button, FormControl, IconButton, MenuItem, Modal, Select, TextField } from '@mui/material';
import LicenseDetailModal from '@/app/components/licenseDetailModal'; // 라이센스 상세 모달 임포트
import AlertModal from '@/app/components/alertModal'; // 도움말 모달 임포트
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Pagenation from '@/app/components/pagenation';
import { fetchLicenses, searchLicenses } from '@/app/api/license/license'; // API 요청 함수 임포트
import ToastAlert, { ToastAlertProps } from '@/app/components/toastAleat';
import { useToastState } from '@/app/components/useToast';
import { addLog } from '@/app/api/log/log';

interface License {
  number: number;
  reg_date: string;
  hardware_code: string;
  software_opt: object;
  license_date: string;
  limit_time_st: string;
  limit_time_end: string;
  ip: string;
  issuer: string;
  manager: string;
  site_nm: string;

  // 필요한 다른 라이센스 필드들을 여기에 추가
}

export default function LicensePage() {
  // ag-grid 모듈 설정
  const modules: Module[] = [
    ClientSideRowModelModule,
    CellStyleModule,
    RowSelectionModule
  ];
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  // 데이터 상태
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 추가 삭제
  const [selectedRows, setSelectedRows] = useState<License[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  // 검색 상태
  const [searchText, setSearchText] = useState<string>('');  
  const [searchField, setSearchField] = useState('hardware_code');
  const [hardwareState, setHardwareState] = useState('all');
  // 모달 열기 상태
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null); // 선택된 라이센스 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false); // 라이센스 상세보기 모달 열기 상태 추가
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false); // 삭제 모달 열기 상태 추가
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false); // 도움말 모달 열기 상태 추가
  
  // 페이지 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 토스트 상태
  const { toastOpen, toastMsg, severity, showToast, toastClose } = useToastState();

  // 모달 닫기 함수
  const handleClose = () => setDetailModalOpen(false);

  const softwareOptions = ['license_basic', 'license_fw', 'license_vpn', 'license_ssl', 'license_ips', 'license_waf', 'license_av', 'license_as', 'license_tracker'];
  const searchOptions = ['hardware_code', 'cfid', 'reg_date', 'license_date', 'limit_time_st', 'limit_time_end', 'issuer', 'manager', 'site_nm'];

  const [columnDefs] = useState<(ColDef<License, any> | ColGroupDef<any>)[]>([
    { field: 'number', headerName: 'No', checkboxSelection: true, headerCheckboxSelection: true, headerClass: 'header-style', cellClass: 'cell-style', width: 100 },
    { field: 'reg_date', headerName: '등록일', cellClass: 'cell-style', width: 100,
      valueFormatter: (params: any) => {
        if (params.value) return new Date(params.value).toISOString().split('T')[0];
        return '';
      }
    },
    { field: 'hardware_code', headerName: '제품 시리얼 번호', headerClass: 'header-style', cellClass: 'cell-style', width: 220 },
    ...softwareOptions.map((item) => ({
      field: item as keyof License,
      headerName: item.split('_')[1].toUpperCase(),
      headerStyle: { textAlign: 'center', fontSize: '10px', padding: '0px' },
      cellClass: 'cell-style',
      flex: 1,
      valueGetter: (params: any) => params.data?.[item] === '1' ? 'O' : 'X',
    })),
    { field: 'license_date', headerName: '발급일', headerClass: 'header-style', cellClass: 'cell-style', width: 100,
      valueFormatter: (params: any) => {
        if (params.value) return new Date(params.value).toISOString().split('T')[0];
        return '';
      }
    },
    { field: 'limit_time_st', headerName: '시작일', headerClass: 'header-style', cellClass: 'cell-style', width: 100,
      valueFormatter: (params: any) => { 
        if (params.value) return new Date(params.value).toISOString().split('T')[0];
        return '';
      }
    },
    { field: 'limit_time_end', headerName: '종료일', cellClass: 'cell-style', width: 100,
      valueFormatter: (params: any) => {
        if (params.value) return new Date(params.value).toISOString().split('T')[0];
        return '';
      }
    },
    { field: 'ip', headerName: 'IP', cellClass: 'cell-style', width: 120 },
    { field: 'issuer', headerName: '발급자', cellClass: 'cell-style', width: 120 },
    { field: 'manager', headerName: '발급요청사(총판사)', cellClass: 'cell-style', width: 120 },
    { field: 'site_nm', headerName: '고객사명', cellClass: 'cell-style', width: 150 },
  ]);

  // 라이센스 데이터 조회
  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLicenses();
      setLicenses(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setTotalPages(Math.ceil(data.length / pageSize));
      }
    } catch (error) {
      console.error('라이센스 데이터 조회 중 오류 발생:', error);
      setError(error instanceof Error ? error.message : '데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);
  
  // 검색
  const handleSearch = async () => {
    if(searchText === '') {
      showToast('검색어가 입력되지 않았습니다.', 'error');
      return;
    }

    try {
      const data = await searchLicenses(searchField, searchText);
      setLicenses(data);
      setTotalPages(Math.ceil(data.length / pageSize));
      setCurrentPage(1);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (licenses.length > 0) {
      setTotalPages(Math.ceil(licenses.length / pageSize));
    }
  }, [licenses, pageSize]);

  const onRowClicked = (event: any) => {
    setSelectedLicense(event.data); // 클릭한 행의 데이터 저장
    setDetailModalOpen(true); // 모달 열기
  };

  // 삭제
  const selectedRowsRef = useRef<any[]>([]);

  const onSelectionChanged = (e: any) => {
    const selected = e.api.getSelectedRows();
    selectedRowsRef.current = selected;
    setSelectedRows([...selected]);
  };

  const deleteSelectedRows = () => {
    if(selectedRows.length === 0) {
      showToast('삭제할 데이터를 선택해주세요.', 'error');
      return;
    }
    setDeleteIds(selectedRows.map((row) => row.hardware_code));
    setIsDeleteModalOpen(true);
  };

  // if (isLoading) {
  //   return <div>로딩 중...</div>;
  // }

  // if (error) {
  //   return <div>에러: {error}</div>;
  // }

  // 페이지 데이터 조회
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize; 
    const endIndex = startIndex + pageSize;
    return licenses.slice(startIndex, endIndex);
  };

  return (
    <div className="p-4">
        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => deleteSelectedRows()} // 선택된 체크박스 데이터 가져오기
            >
              삭제
            </Button>

            <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
                <MenuItem value={10}>10개</MenuItem>
                <MenuItem value={20}>20개</MenuItem> 
                <MenuItem value={30}>30개</MenuItem>
                <MenuItem value={100}>100개</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select 
                value={hardwareState} 
                onChange={(e) => setHardwareState(e.target.value)}>
                <MenuItem value={'all'}>전체</MenuItem>
                <MenuItem value={'ITU'}>ITU</MenuItem>
                <MenuItem value={'ITM'}>ITM</MenuItem> 
                <MenuItem value={'XTM'}>XTM</MenuItem> 
                <MenuItem value={'SMC'}>SMC</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select 
                value={searchField} 
                onChange={(e) => setSearchField(e.target.value)}>
                {columnDefs
                  .filter((item): item is ColDef<License, any> => 'field' in item)
                  .filter((item) => searchOptions.includes(item.field!))
                  .map((item) => (
                    <MenuItem key={item.field} value={item.field ?? ''}>
                      {item.headerName}
                    </MenuItem>
                ))}
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
              onClick={() => {loadLicenses()}}
            >
              🔃
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="contained"
              component="label"
              size="small"
            >
              파일 선택
              <input
                type="file"
                hidden
              />
            </Button>

            <TextField
              size="small"
              placeholder="선택된 파일 없음"
              disabled
            />

            <Button
              variant="contained"
              color="primary"
              size="small"
            >
              등록
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => setIsHelpModalOpen(true)}
            >
              ?
            </Button>
          </div>
        </div>
        <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 240px)', width: '100%' }}>
          {/* <AgGridReact
            onGridReady={(params) => setGridApi(params.api)}
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
            pagination={true}
            onRowClicked={onRowClicked} // 행 클릭 이벤트 핸들러 추가
            onSelectionChanged={onSelectionChanged}
          /> */}
          <AgGridReact
            getRowId={(params) => params.data.number} 
            rowData={getCurrentPageData()}
            rowHeight={30}
            headerHeight={30}
            columnDefs={columnDefs}
            modules={modules}
            theme="legacy"
            defaultColDef={{
              sortable: true,
              resizable: true,
              headerClass: 'text-center'
            }}
            rowSelection="multiple"
            pagination={true}
            onRowClicked={onRowClicked}
            onSelectionChanged={onSelectionChanged}
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
          <span className='text-13'>총 {licenses.length}개</span>
        </footer>

        {/* modal */}
          <Modal
          open={isDetailModalOpen}
          onClose={handleClose}
          >
            <span>
            <LicenseDetailModal 
              close={handleClose}
              license={selectedLicense}
            />
            </span>
          </Modal>

          <AlertModal
            open={isDeleteModalOpen}
            close={() => setIsDeleteModalOpen(false)}
            state="license"
            title="삭제"
            message={`선택하신 ${selectedRows.length}개의 데이터를 삭제하시겠습니까?`}
            deleteIds={deleteIds}
            onConfirm={() => {
              addLog(selectedRows);
              loadLicenses();
            }}
          />

          <AlertModal
            open={isHelpModalOpen}
            close={() => setIsHelpModalOpen(false)}
            state="help"
            title="일괄등록 도움말"
            message={`파일업로드 형식은 CSV 이며 구성항목은 아래와 같습니다.
                    \n[시리얼, 유효기간(시작), 유효기간(만료), 발급자, 발급요청사(총판사),
                    \n고객사명, 프로젝트명, 고객사 E-mail,
                    \n방화벽, VPN, DPI, AV, AS, 행안부 라이센스 옵션]
                    \n유효기간(YYYYMMDD 형식), 라이센스 옵션(1: 사용함, 0: 사용안함)`}
          />

          <ToastAlert
            open={toastOpen}
            setOpen={toastClose}
            message={toastMsg}
            severity={severity}
          />
    </div>
  );
}