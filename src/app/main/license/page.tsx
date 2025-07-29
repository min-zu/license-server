'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

// ag-grid
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, Module, ColDef, ColGroupDef, CellStyleModule, RowSelectionModule, GridApi, PaginationModule } from 'ag-grid-community';

// mui
import { Button, FormControl, MenuItem, Modal, Select, TextField } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

// 컴포넌트
import LicenseDetailModal from '@/app/components/licenseDetailModal'; // 라이센스 상세 모달 임포트
import LicenseAddModal from '@/app/components/licenseAddModal';
import AlertModal from '@/app/components/alertModal'; // 도움말 모달 임포트
import Pagenation from '@/app/components/pagenation';


import { fetchLicenses, searchLicenses } from '@/app/api/license/license'; // API 요청 함수 임포트
import { addLog } from '@/app/api/log/log';

// toast
import { useToastState } from '@/app/components/useToast';


interface License {
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
  license_key?: string;
  // 필요한 다른 라이센스 필드들을 여기에 추가
}

export default function LicensePage() {
  // ag-grid 모듈 설정
  const modules: Module[] = [
    ClientSideRowModelModule,
    CellStyleModule,
    RowSelectionModule,
    PaginationModule
  ];
  // AG Grid API에 접근하기 위한 참조 객체
  const gridRef = useRef<any>(null);

  // session
  const { data: session } = useSession();
  const role = session?.user?.role;
  const id = session?.user?.id;

  // 데이터 상태
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 추가 삭제
  const [selectedRows, setSelectedRows] = useState<License[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  // 만료 상태
  const [expirationData, setExpirationData] = useState<License[]>([]);
  const [expirationType, setExpirationType] = useState<string>('single');

  // 검색 상태
  const [searchText, setSearchText] = useState<string>('');  
  const [searchField, setSearchField] = useState('hardware_serial');
  const [hardwareStatus, setHardwareStatus] = useState('all');
  const [searchStartDate, setSearchStartDate] = useState<string>('');
  const [searchEndDate, setSearchEndDate] = useState<string>('');

  // 모달 열기 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false); // 라이센스 등록 모달 열기 상태 추가
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null); // 선택된 라이센스 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false); // 라이센스 상세보기 모달 열기 상태 추가
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false); // 삭제 모달 열기 상태 추가
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false); // 도움말 모달 열기 상태 추가
  const [isFailModalOpen, setIsFailModalOpen] = useState<boolean>(false); // 파일 업로드 실패 모달 열기 상태 추가  
  const [isExpirationModalOpen, setIsExpirationModalOpen] = useState<boolean>(false); // 만료 모달 열기 상태 추가
  
  // 페이지 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [pageSizeType, setPageSizeType] = useState<string>('select');

  // 토스트 상태
  const { showToast, ToastComponent } = useToastState();
  
  // 파일 업로드 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [failedCsvBase64, setFailedCsvBase64] = useState<string | undefined>(undefined);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // 모달 닫기 함수
  const addModalClose = () => setIsAddModalOpen(false);
  const detailModalClose = () => setDetailModalOpen(false);

  const softwareOptions = ['license_fw', 'license_vpn', 'license_s2', 'license_dpi', 'license_av', 'license_as', 'license_ot', 'license_zt'];
  const searchOptions = ['hardware_serial', 'customer_email', 'reg_date', 'license_date', 'limit_time_start', 'limit_time_end', ,'ip', 'reg_user', 'reg_request', 'customer', 'reg_auto'];

  const [columnDefs] = useState<(ColDef<License, any> | ColGroupDef<any>)[]>([
    { field: 'number', headerName: 'No', checkboxSelection: true, headerCheckboxSelection: true, headerStyle: { textAlign: 'center', fontSize: '12px' }, cellClass: 'cell-style', width: 100 },
    { field: 'reg_date', headerName: '등록일', headerClass: 'header-style', cellClass: 'cell-style', width: 140,
      valueFormatter: (params: any) => {
        const value = params.value;
        if(!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
      }
    },
    { field: 'hardware_serial', headerName: '제품 시리얼 번호', headerClass: 'header-style', cellClass: 'cell-left', width: 200 },
    ...softwareOptions.map((item) => ({
      field: item as keyof License,
      headerName: item === 'license_s2' ? '행안부' : item === 'license_ot' ? '산업용 프로토콜' : item === 'license_zt' ? 'ITUz' : item.split('_')[1].toUpperCase(),
      headerStyle: { textAlign: 'center', fontSize: '10px', padding: '0px' },
      cellClass: 'cell-style',
      flex: 1,
      cellRenderer: (params: any) => {
        if(params.data?.hardware_status === 'ITU') {
          return params.data?.[item] === '1' ? <CheckBox fontSize="small" style={{ color: 'gray'}} /> : <CheckBoxOutlineBlank fontSize="small" style={{ color: 'gray'}} />
        } else {
          return ''
        }
      }
    })),
    { field: 'license_date', headerName: '라이센스 발급일', headerClass: 'header-style', cellClass: 'cell-style', width: 140,
      valueFormatter: (params: any) => {
        const value = params.value;
        if(!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
      }
    },
    { field: 'limit_time_start', headerName: '유효기간(시작)', headerClass: 'header-style', cellClass: 'cell-style', width: 100,
      cellRenderer: (params: any) => {
        const value = params.value; 
        if(!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        if(params.data.reg_auto === 4) {
          return <span style={{ textDecoration: 'line-through', color: '#888' }}>{date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })}</span>
        } else {
          return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
        }
      }
    },
    { field: 'limit_time_end', headerName: '유효기간(만료)', headerClass: 'header-style', cellClass: 'cell-style', width: 100,
      cellRenderer: (params: any) => {
        const value = params.value;
        if(!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        if(params.data.reg_auto === 4) {
          return <span style={{ textDecoration: 'line-through', color: '#888' }}>{date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })}</span>
        } else {
          return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
        }
      }
    },
    { field: 'ip', headerName: 'IP', headerClass: 'header-style', cellClass: 'cell-style', width: 120 },
    { field: 'reg_user', headerName: '발급자', headerClass: 'header-style', cellClass: 'cell-left', width: 120 },
    { field: 'reg_request', headerName: '발급요청사(총판사)', headerClass: 'header-style', cellClass: 'cell-left', width: 120 },
    { field: 'customer', headerName: '고객사명', headerClass: 'header-style', cellClass: 'cell-left', width: 150 },
    { field: 'reg_auto', headerName: '발급 구분', headerClass: 'header-style', cellClass: 'cell-style', width: 100,
      valueFormatter: (params: any) => {
        const value = params.value;
        let text = value === 1 ? '자동' : value === 0 ? '수동' : value === 2 ? '데모' : value === 3 ? '미발급' : value === 4 ? '만료' : ''; 
        if(value === 2 && params.data.license_key === null) {
          text = '데모(미발급)';
        }
        return text
      }
    },
    { field: 'expiration', headerName: '만료', headerClass: 'header-style', cellStyle: { padding: 0 }, width: 40,
      cellRenderer: (params: any) => {
        if(params.data.license_key !== null && (params.data.reg_auto !== 4 && params.data.reg_auto !== 3)) {
          return (
            <Button size="small" 
              className="expired-btn-s" 
              onClick={() => {
                if(role === 3 || (role === 4 && params.data.reg_auto === 2) || (role !== 1 && role !== 4 && params.data.reg_auto !== 4 && params.data.reg_auto !== 2)) {
                  setExpirationType('single');
                  setExpirationData([params.data]);
                  setIsExpirationModalOpen(true);                  
                } else {
                  showToast('만료 권한이 없습니다.', 'warning');
                }
              }}
            >
            만료</Button>
          )
        } else {
          return ''
        }
      }
    }
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



  const onRowClicked = (event: any) => {
    if (event.column.getColId() === 'number' || event.column.getColId() === 'expiration') {
      // No, 만료 컬럼 클릭 시 모달 안 열기
      return;
    }
    event.api.deselectAll();
    event.node.setSelected(true);
    
    setSelectedLicense(event.data); // 클릭한 행의 데이터 저장
    setDetailModalOpen(true); // 모달 열기
  };

  // 현재 페이지 번호와 전체 페이지 수
  const handlePaginationChanged = (params: any) => {
    const current = params.api.paginationGetCurrentPage() + 1;
    const total = params.api.paginationGetTotalPages();
    setCurrentPage(current);
    setTotalPages(total);
  };

  useEffect(() => {
    if (licenses.length > 0) {
      setTotalPages(Math.ceil(licenses.length / pageSize));
    }
  }, [licenses, pageSize]);

  // 장비 상태
  const handelStatusChange = useCallback(async (status: string) => {
    const data = await fetchLicenses(); // 전체 라이센스 데이터 불러오기
    if (status === 'all') {
      setLicenses(data); // 모든 라이센스 데이터 설정
    } else {
      const filteredLicenses = data.filter((item: License) => {
        if (item.hardware_status) {
          return item.hardware_status.toUpperCase() === status;
        }
        return false;
      });
      setLicenses(filteredLicenses); // 필터링된 라이센스 데이터 설정
    }
  }, []);

  useEffect(() => {
    handelStatusChange(hardwareStatus);
    setSearchText('');
    setSearchStartDate('');
    setSearchEndDate('');
    setSearchField('hardware_serial');
  }, [hardwareStatus]);
  
  // 검색
  const handleSearch = async () => {
    const isDateField = searchField.includes('date') || searchField.includes('_start') || searchField.includes('_end');
    
    if(!isDateField && searchText === '') {
      showToast('검색어가 입력되지 않았습니다.', 'warning');
      loadLicenses();
      return;
    }

    if(isDateField && (!searchStartDate || !searchEndDate)) {
      showToast('시작일과 종료일을 모두 입력해주세요.', 'warning');
      return;
    }

    try {
      const searchData = isDateField ? { startDate: searchStartDate, endDate: searchEndDate } : searchText;
      const data = await searchLicenses(hardwareStatus, searchField, searchData);
      setLicenses(data);
      setTotalPages(Math.ceil(data.length / pageSize));
      gridRef.current?.api?.paginationGoToPage?.(0);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  };

  // 삭제
  const selectedRowsRef = useRef<any[]>([]);

  const onSelectionChanged = (e: any) => {
    const selected = e.api.getSelectedRows();
    selectedRowsRef.current = selected;
    setSelectedRows([...selected]);
  };

  const handleSelectedRows = (type: string) => {
    const word = type === 'del' ? '삭제' : '만료';
    if(selectedRows.length === 0) {
      showToast(`${word}할 라이센스를 선택해주세요.`, 'warning');
      return;
    }

    if(role === 4 && type === 'exp' && !selectedRows.every((item) => item.reg_auto === 2)) {
      showToast('데모 라이센스만 선택할 수 있습니다.', 'warning');
      return;
    } else if(role !== 4 && type === 'exp' && selectedRows.some((item) => item.reg_auto === 2)) {
      showToast(`데모 라이센스가 포함되어있습니다.`, 'warning');
      return;
    }

    if(type === 'del') {
      setDeleteIds(selectedRows.map((row) => row.hardware_serial));
      setIsDeleteModalOpen(true);
    } else if(type === 'exp') {
      if(selectedRows.length > 0 && selectedRows.every((item) => item.reg_auto !== 4 && item.reg_auto !== 3 && item.license_key !== null)) {
        setExpirationType('multiple');
        setExpirationData(selectedRows);
        setIsExpirationModalOpen(true); 
      } else {
        showToast('미발급 / 만료된 라이센스는 선택할 수 없습니다.', 'warning');          
      }
    }
  };

  const handleExpiration = (data: any) => {
    data.forEach((item: any) => {
      try {
        const logs = [{
          hardware_serial: item.hardware_serial,
          user: id,
          action: 'success',
          desc: '만료'
        }];                 
        addLog(logs);
      } catch (error) {
        console.error('로그 기록 중 오류 발생:', error);
        const logs = [{
          hardware_serial: item.hardware_serial,
          user: id,
          action: 'fail',
          desc: '만료'
        }];
          addLog(logs);
        }    
    });

    searchText === '' ? loadLicenses() : handleSearch();
  }

  // 파일 업로드
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      setSelectedFile(file);
    }
  }

  const handleFileUpload = async () => {
    if(!selectedFile) {
      showToast('csv파일을 선택해주세요.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('uploadFile', selectedFile);

    try {
      const response = await fetch('/api/license/fileUpload', {
        method: 'POST', 
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.failedCsvBase64) {
        setFailedCsvBase64(result.failedCsvBase64);
        setUploadMessage(result.message)
        setIsFailModalOpen(true);
        showToast(result.message, 'success')
        setSelectedFile(null);
        handleReset();
      } else if (response.ok && !result.failedCsvBase64){
        showToast(result.message, 'success')
        setSelectedFile(null);
        handleReset();
      } else {
        showToast('파일 업로드 실패 : ' + result.message, 'error');
      }
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
    }
  }

  // 데이터 초기화
  const handleReset = () => {
    // 모든 체크박스(선택된 행) 해제
    selectedRowsRef.current = [];
    setSelectedRows([]);
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.deselectAll();
    }
    loadLicenses();
    setHardwareStatus('all');
    setSearchText('');
    setSearchField('hardware_serial');    
    setSearchStartDate('');
    setSearchEndDate('');
    gridRef.current?.api?.paginationGoToPage?.(0);
  }

    const applyRowClasses = useCallback(() => {
    // 데이터 업데이트 후 클래스 적용
    const rows = document.querySelectorAll('.ag-row');
    rows.forEach((row) => {
      const rowId = row.getAttribute('row-id');
      if (rowId) {
        const rowData = licenses.find(item => String(item.number) === rowId);
        if (rowData) {
          // 먼저 모든 클래스 제거
          (row as HTMLElement).classList.remove('expired', 'unissued');
          
          // reg_auto 조건에 따라 클래스 추가
          if (rowData.reg_auto === 4) {
            (row as HTMLElement).classList.add('expired');
          } else if (rowData.reg_auto === 3) {
            (row as HTMLElement).classList.add('unissued');
          } else if (rowData.reg_auto === 2) {
            (row as HTMLElement).classList.add('demo');
          }
        }
      }
    });
  }, [licenses, currentPage]);

  const onRowDataUpdated = useCallback(() => {
    applyRowClasses();
  }, [licenses]);

  useEffect(() => {
    applyRowClasses();
  }, [currentPage]);

  useEffect(() => {
    setSearchText('');    
    setSearchStartDate('');
    setSearchEndDate('');
    if(searchField === 'reg_auto') {
      setSearchText('0'); 
    } 
  }, [searchField]);

  return (
    <div className="p-4">
        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex items-center gap-1">
            {role !== 1 && (
              <>                
                <Button className="expired-btn" size="small" onClick={() => handleSelectedRows('exp')}>일괄 만료</Button>
                <Button className="delete-btn" size="small" onClick={() => handleSelectedRows('del')}>삭제</Button>
                <Button className="default-btn" size="small" onClick={() => setIsAddModalOpen(true)}>라이센스 등록</Button>
              </>
            )} 
            <FormControl size="small" sx={{ width: 80}}>
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

            <FormControl size="small" sx={{ width: 90 }}>
              <Select 
                value={hardwareStatus} 
                onChange={(e) => setHardwareStatus(e.target.value)}>
                <MenuItem value={'all'}>전체</MenuItem>
                <MenuItem value={'ITU'}>ITU</MenuItem>
                <MenuItem value={'ITM'}>ITM</MenuItem> 
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 160 }}>
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

            {searchField === 'reg_auto' ? (
              <Select
                size="small"
                defaultValue={'0'}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              >
                <MenuItem value={'0'}>수동</MenuItem>
                <MenuItem value={'1'}>자동</MenuItem>
                <MenuItem value={'2'}>데모</MenuItem>
                <MenuItem value={'3'}>미발급</MenuItem>
                <MenuItem value={'4'}>만료</MenuItem>
              </Select>
            ) : searchField.includes('date') || searchField.includes('_start') || searchField.includes('_end') ? (
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
              className="default-btn"
              size="small"
              onClick={() => {handleSearch()}}
            >
              검색
            </Button>

            <Button
              className="default-btn"
              size="small"
              onClick={() => {handleReset()}}
            >
              ↻
            </Button>
          </div>

          {role !== 1 && (
            <div className="flex items-center gap-1">
              <Button
                className="default-btn"
                component="label"
                size="small"
              >
                파일 선택
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  key={Date.now()}
                  onChange={handleFileChange}
                />
              </Button>

              <TextField
                size="small"
                placeholder={selectedFile ? selectedFile.name : "선택된 파일 없음"}
                disabled
              />

              <Button
                className="default-btn"
                size="small"
                onClick={handleFileUpload}
              >
                등록
              </Button>

              <Button
                className="default-btn"
                size="small"
                onClick={() => setIsHelpModalOpen(true)}
              >
                ?
              </Button>
            </div>
          )}
        </div>
        <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
          <AgGridReact
            getRowId={(params) => String(params.data.number)}
            rowData={licenses}
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
            suppressPaginationPanel={true}
            paginationPageSize={pageSize}
            onPaginationChanged={handlePaginationChanged}
            ref={gridRef}
            onCellClicked={onRowClicked}
            onSelectionChanged={onSelectionChanged}
            suppressRowClickSelection={true}
            onRowDataUpdated={onRowDataUpdated}
          />
        </div>

        <footer className="flex justify-between items-center mt-4">
          <div className="flex justify-center flex-grow">
            <Pagenation 
              props={{
                totalPages: totalPages,
                currentPage: currentPage,
                gridRef: gridRef,
              }}
            />
          </div>
          <span className='text-13 text-black'>총 {licenses.length}개</span>
        </footer>

        {/* modal */}
          <Modal
          open={isAddModalOpen}
          onClose={addModalClose}
          >
            <span>
            <LicenseAddModal 
              close={addModalClose}
              onUpdated={() => {
                showToast("라이센스 등록이 완료되었습니다.", "success");
                handleReset();
              }}
            />
            </span>
          </Modal>

          <Modal
          open={isDetailModalOpen}
          onClose={detailModalClose}
          >
            <span>
            <LicenseDetailModal 
              close={detailModalClose}
              license={selectedLicense}
              onUpdated={() => {
                loadLicenses(); // 수정 후 데이터 재조회
              }}
            />
            </span>
          </Modal>

          <AlertModal
            open={isDeleteModalOpen}
            close={() => setIsDeleteModalOpen(false)}
            state="delete"
            title="삭제"
            message={`선택하신 ${selectedRows.length}개의 데이터를 삭제하시겠습니까?`} 
            deleteIds={deleteIds}
            onConfirm={(action?: string | null, desc?: string | null) => {
              try {
                const logs = selectedRows.map(row => ({
                  hardware_serial: row.hardware_serial,
                  user: id,
                  action: 'success',
                  desc: '삭제'
                }));                
                addLog(logs);
                loadLicenses();
              } catch (error) {
                console.error('로그 기록 중 오류 발생:', error);
                const logs = selectedRows.map(row => ({
                  hardware_serial: row.hardware_serial,
                  user: id,
                  action: 'fail',
                  desc: '삭제'
                }));
                addLog(logs);
              }
            }}
          />

          <AlertModal
            open={isExpirationModalOpen}
            close={() => setIsExpirationModalOpen(false)}
            state="expiration"
            title="만료"
            message={expirationData && expirationType === 'single' ? `${expirationData[0]?.hardware_serial} 의 라이센스를 만료하시겠습니까?` : `${expirationData.length}개의 라이센스를 만료하시겠습니까?`}
            expirationData={expirationData}
            onConfirm={(action?: string | null, desc?: string | null) => {
                if (expirationData) {
                  handleExpiration(expirationData);
                }
              }}
          />  

          <AlertModal
            open={isHelpModalOpen}
            close={() => setIsHelpModalOpen(false)}
            state="help"
            title="ITU 라이센스 일괄등록 도움말"
            message={
            <div style={{lineHeight: '2'}}>
              파일업로드 형식은 CSV 이며 ITU 라이센스에 한해 등록이 가능합니다.
              <br />
              구성항목은 아래와 같습니다.
              <br />
              [시리얼, 유효기간(시작), 유효기간(만료), 발급자, 발급요청사(총판사),
              <br />
              고객사명, 프로젝트명, 고객사 E-mail, 소프트웨어 옵션]
              <div className="split-line my-4 border-t border-gray-300" />
              {/* * 장비선택(ITU, ITM)
              <br /> */}
              * 유효기간(YYYYMMDD 형식), * 라이센스 옵션(1: 사용함, 0: 사용안함)
            </div>
            } 
          />
          <AlertModal
            open={isFailModalOpen}
            close={() => setIsFailModalOpen(false)}
            state="fail"
            title={uploadMessage ?? "ITU 라이센스 일부 등록 실패"}
            failedCsvBase64={failedCsvBase64}
            message={
            <div style={{lineHeight: '2'}}>
              일부 항목에 필수 정보가 누락되었거나 형식이 올바르지 않아 <strong>ITU 라이선스</strong> 등록에 실패했습니다.
              <br />
              <br />
              아래 항목은 필수로 입력되어야 하며, 누락되거나 형식이 올바르지 않으면 등록이 실패할 수 있습니다.
              <br />
              [제품 시리얼 번호, 유효기간(시작), 유효기간(만료), 발급 요청사(총판사), 고객사명, 프로젝트명,
              <br />
              고객사 E-mail, 소프트웨어 옵션]
              <div className="split-line my-4 border-t border-gray-300" />
              {/* * 장비선택(ITU, ITM)
              <br /> */}
              * 유효기간은 <strong>YYYYMMDD</strong> 형식이어야 하며,
              <br />
              * 소프트웨어 옵션은 각 기능별로 <strong>1(사용), 0(미사용)</strong> 값을 입력해야 합니다.
              <br />
              <br />
              아래 버튼을 클릭하면 등록 실패 항목과 그 사유가 포함된 파일을 다운로드할 수 있습니다.
            </div>
            }
          />
          {ToastComponent}
    </div>
  );
}