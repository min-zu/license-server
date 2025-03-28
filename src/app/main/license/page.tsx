'use client';

import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, Module, ColDef, ColGroupDef } from 'ag-grid-community';
import { useEffect, useState } from 'react';
import { Button, FormControl, IconButton, MenuItem, Select, TextField } from '@mui/material';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { styled } from '@mui/material/styles';

const StyledAgGrid = styled(AgGridReact)`
  .ag-root-wrapper {
    border: 1px solid #2196f3;
  }
  
  .ag-header {
    background-color: #1976d2;
    color: white;
  }

  .ag-header-cell {
    font-size: 12px;
    padding: 4px;
  }

  .ag-cell {
    font-size: 12px;
    padding: 4px;
  }

  .ag-row {
    border-color: #bbdefb;
  }

  .ag-row-hover {
    background-color: #e3f2fd !important;
  }
`;

const StyledTextField = styled(TextField)`
  & .MuiInputBase-root {
    height: 32px;
    font-size: 12px;
  }
`;

const StyledSelect = styled(Select)`
  & .MuiInputBase-root {
    height: 32px;
    font-size: 12px;
  }
`;

const StyledButton = styled(Button)`
  height: 32px;
  font-size: 12px;
`;


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
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [columnDefs] = useState<(ColDef<License, any> | ColGroupDef)[]>([
    { field: 'number', headerName: 'N', checkboxSelection: true },
    { 
      field: 'reg_date', 
      headerName: '등록일',
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toISOString().split('T')[0];
        }
        return '';
      }
    },
    { field: 'hardware_code', headerName: '하드웨어 코드' },
    { 
      headerName: '소프트웨어 옵션',
      children: [
        { field: 'license_basic', headerName: 'BASIC', width: 20, 
          valueGetter: function(params) {
            return params.data.license_basic === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_fw', headerName: 'FW', width: 20,
          valueGetter: function(params) {
            return params.data.license_fw === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_vpn', headerName: 'VPN', width: 20,
          valueGetter: function(params) {
            return params.data.license_vpn === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_ssl', headerName: 'SSL', width: 20,
          valueGetter: function(params) {
            return params.data.license_ssl === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_ips', headerName: 'IPS', width: 20,
          valueGetter: function(params) {
            return params.data.license_ips === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_waf', headerName: 'WAF', width: 20,
          valueGetter: function(params) {
            return params.data.license_waf === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_av', headerName: 'AV', width: 20,
          valueGetter: function(params) {
            return params.data.license_av === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_as', headerName: 'AS', width: 20,
          valueGetter: function(params) {
            return params.data.license_as === '1' ? 'O' : 'X';
          }
        },
        { field: 'license_tracker', headerName: 'Trac ker', width: 20,
          valueGetter: function(params) {
            return params.data.license_tracker === '1' ? 'O' : 'X';
          }
        },
      ]
    },
    { 
      field: 'license_date', 
      headerName: '라이센스 일자',
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toISOString().split('T')[0];
        }
        return '';
      }
    },
    { 
      field: 'limit_time_st', 
      headerName: '시작일',
      valueFormatter: (params: any) => { 
        if (params.value) {
          const value = params.value;
          return value.substr(0, 4) + '-' + value.substr(4, 2) + '-' + value.substr(6, 2);
        }
        return '';
      }
    },
    { 
      field: 'limit_time_end', 
      headerName: '종료일',
      valueFormatter: (params: any) => {
        if (params.value) {
          const value = params.value;
          return value.substr(0, 4) + '-' + value.substr(4, 2) + '-' + value.substr(6, 2);
        }
        return '';
      }
    },
    { field: 'ip', headerName: 'IP' },
    { field: 'issuer', headerName: '발급자' },
    { field: 'manager', headerName: '관리자' },
    { field: 'site_nm', headerName: '사이트명' },
  ]);

  const modules: Module[] = [ClientSideRowModelModule];

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
      } catch (error) {
        console.error('라이센스 데이터 조회 중 오류 발생:', error);
        setError(error instanceof Error ? error.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  useEffect(() => {
    console.log('licenses', licenses);
  }, [licenses]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>에러: {error}</div>;
  }

  return (
    <div>
      <div className="ag-theme-alpine" style={{height: 500, width: '100%'}}>

        <div className="flex justify-between items-center w-full p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="contained"
              color="error"
              size="small"
              // startIcon={<DeleteIcon />}
              
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

            <IconButton
              size="small"
              color="primary"
            >
              
            </IconButton>
          </div>
        </div>
        <div className="w-full min-h-[calc(100vh-200px)] p-4">

        <AgGridReact
          rowData={licenses}
          columnDefs={columnDefs}
          onGridReady={(params)=>setGridApi(params.api)}
          pagination={true}
          paginationPageSize={5}
          modules={modules}
          domLayout='autoHeight'
          className="w-full min-h-[calc(100vh-200px)]"
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            resizable: true
          }}
        />
        </div>
      </div>
    </div>
  );
}
