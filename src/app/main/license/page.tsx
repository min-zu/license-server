'use client';

import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, Module, ColDef, ColGroupDef } from 'ag-grid-community';
import { useEffect, useState } from 'react';
import { Button, FormControl, IconButton, MenuItem, Modal, Select, TextField } from '@mui/material';
import LicenseDetailModal from '@/app/components/licenseDetailModal'; // 라이센스 상세 모달 임포트
import AlertModal from '@/app/components/alertModal'; // 도움말 모달 임포트
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Pagenation from '@/app/components/pagenation';

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
  // 데이터 상태
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<any>(null);

  // 검색 상태
  const [searchText, setSearchText] = useState<string>('');  

  // 모달 열기 상태
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null); // 선택된 라이센스 상태 추가
  const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false); // 라이센스 상세보기 모달 열기 상태 추가
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false); // 삭제 모달 열기 상태 추가
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false); // 도움말 모달 열기 상태 추가

  // 페이지 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 모달 닫기 함수
  const handleClose = () => setDetailModalOpen(false);

  const modules: Module[] = [ClientSideRowModelModule];
  const [columnDefs] = useState<(ColDef<License, any> | ColGroupDef)[]>([
    { field: 'number', headerName: 'N', checkboxSelection: true, headerCheckboxSelection: true, cellStyle: { textAlign: 'center', fontSize: '11px' }, width: 120 },
    { 
      field: 'reg_date', 
      headerName: '등록일',
      cellStyle: { textAlign: 'center', fontSize: '11px' },
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toISOString().split('T')[0];
        }
        return '';
      },
      width: 120,
    },
    { field: 'hardware_code', headerName: '하드웨어 코드', cellStyle: { textAlign: 'center', fontSize: '11px' }, width: 300 },
    { 
      headerName: '소프트웨어 옵션',
      cellStyle: { textAlign: 'center', fontSize: '11px' },
      children: [
        { field: 'license_basic', headerName: 'BASIC', width: 50, 
          valueGetter: function(params) {
            return params.data.license_basic === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_fw', headerName: 'FW', width: 50,
          valueGetter: function(params) {
            return params.data.license_fw === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_vpn', headerName: 'VPN', width: 50,
          valueGetter: function(params) {
            return params.data.license_vpn === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_ssl', headerName: 'SSL', width: 50,
          valueGetter: function(params) {
            return params.data.license_ssl === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_ips', headerName: 'IPS', width: 50,
          valueGetter: function(params) {
            return params.data.license_ips === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_waf', headerName: 'WAF', width: 50,
          valueGetter: function(params) {
            return params.data.license_waf === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_av', headerName: 'AV', width: 50,
          valueGetter: function(params) {
            return params.data.license_av === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_as', headerName: 'AS', width: 50,
          valueGetter: function(params) {
            return params.data.license_as === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_tracker', headerName: 'Tracker', width: 50,
          valueGetter: function(params) {
            return params.data.license_tracker === '1' ? 'O' : 'X';
          }
        },
      ],
      flex: 1
    },
    { 
      field: 'license_date', 
      headerName: '라이센스 일자',
      cellStyle: { textAlign: 'center', fontSize: '11px' },
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toISOString().split('T')[0];
        }
        return '';
      },
      width: 120
    },
    { 
      field: 'limit_time_st', 
      headerName: '시작일',
      cellStyle: { textAlign: 'center', fontSize: '11px' },
      valueFormatter: (params: any) => { 
        if (params.value) {
          const value = params.value;
          return value.substr(0, 4) + '-' + value.substr(4, 2) + '-' + value.substr(6, 2);
        }
        return '';
      },
      width: 120
    },
    { 
      field: 'limit_time_end', 
      headerName: '종료일',
      cellStyle: { textAlign: 'center', fontSize: '11px' },
      valueFormatter: (params: any) => {
        if (params.value) {
          const value = params.value;
          return value.substr(0, 4) + '-' + value.substr(4, 2) + '-' + value.substr(6, 2);
        }
        return '';
      },
      width: 120
    },
    { field: 'ip', headerName: 'IP', cellStyle: { textAlign: 'center', fontSize: '11px' }, width: 160 },
    { field: 'issuer', headerName: '발급자', cellStyle: { textAlign: 'center', fontSize: '11px' }, width: 120 },
    { field: 'manager', headerName: '관리자', cellStyle: { textAlign: 'center', fontSize: '11px' }, width: 120 },
    { field: 'site_nm', headerName: '사이트명', cellStyle: { textAlign: 'center', fontSize: '11px' }, width: 150 },
  ]);

  useEffect(() => {
    const fetchLicenses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/license');
        if (!response.ok) {
          throw new Error('라이센스 데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setLicenses(Array.isArray(data) ? data : []);
        setTotalPages(Math.ceil(data.length / pageSize));
      } catch (error) {
        console.error('라이센스 데이터 조회 중 오류 발생:', error);
        setError(error instanceof Error ? error.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    console.log('licenses', licenses);
  }, [licenses]);

  const onRowClicked = (event: any) => {
    console.log('event', event);
    setSelectedLicense(event.data); // 클릭한 행의 데이터 저장
    setDetailModalOpen(true); // 모달 열기
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>에러: {error}</div>;
  }

  return (
    <div className="p-4">
        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              삭제
            </Button>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select defaultValue={10}>
                <MenuItem value={10}>10개씩 보기</MenuItem>
                <MenuItem value={20}>20개씩 보기</MenuItem> 
                <MenuItem value={30}>30개씩 보기</MenuItem>
                <MenuItem value={100}>100개씩 보기</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select defaultValue={'all'}>
                <MenuItem value={'all'}>전체</MenuItem>
                <MenuItem value={'ITU'}>ITU</MenuItem>
                <MenuItem value={'ITM'}>ITM</MenuItem> 
                <MenuItem value={'XTM'}>XTM</MenuItem>
                <MenuItem value={'SMC'}>SMC</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select defaultValue="number">
                {columnDefs.map((col) => (
                  'field' in col && (
                    <MenuItem key={col.field} value={col.field}>
                      {col.headerName}
                    </MenuItem>
                  )
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
              onClick={() => {
                if (gridApi) {
                  gridApi.setQuickFilter(searchText);
                }
              }}
            >
              검색
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
          <AgGridReact
            rowData={licenses}
            rowHeight={30}
            headerHeight={30}
            columnDefs={columnDefs}
            onGridReady={(params) => setGridApi(params.api)}
            modules={modules}
            theme="legacy"
            defaultColDef={{
              sortable: true,
              resizable: true,
              headerClass: 'text-center' // 헤더 텍스트 가운데 정렬
            }}
            rowSelection="multiple"
            pagination={false}
            onRowClicked={onRowClicked} // 행 클릭 이벤트 핸들러 추가
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
            state="delete"
            title="삭제"
            message="선택하신 데이터를 삭제하시겠습니까?"
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
    </div>
  );
}
