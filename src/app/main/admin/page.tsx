'use client'

import { useEffect, useMemo, useState } from 'react';

import { GridApi, ColDef, Module, ICellRendererParams, RowSelectionOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, RowSelectionModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import { Box, Button, ButtonGroup, FormControl, MenuItem, Pagination, Select, SelectChangeEvent, IconButton } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import EditIcon from '@mui/icons-material/Edit';

import Addadmin from '@/app/components/addAdmin';
import AlertModal from '@/app/components/alertModal';
import Editadmin from '@/app/components/editAdmin';

import { SessionProvider } from 'next-auth/react';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: number;
  status: number;
  login_ts: string;
}

export default function AdminPage() {
  const [rowData, setRowData] = useState<Admin[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Admin[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const modules: Module[] = [ClientSideRowModelModule, RowSelectionModule];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin?mode=list');
        if (!res.ok) throw new Error('네트워크 오류');
        const data = await res.json();
        setRowData(data);
      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
      }
    };
    fetchData();
  }, []);

  const pagedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rowData.slice(startIndex, startIndex + pageSize);
  }, [rowData, pageSize, currentPage]);

  const handlePageSizeChange = (event: SelectChangeEvent) => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePageChange = (_: any, value: number) => {
    setCurrentPage(value);
  };

  const rowSelection: RowSelectionOptions = useMemo(() => { 
    return { 
          mode: 'multiRow' 
    }
  }, []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: true,
    headerClass: 'text-center',
  }), []);

  const columnDefs: ColDef<Admin>[] = [
    { field: 'id', headerName: '아이디', cellStyle: {justifyContent: "center"} },
    { field: 'name', headerName: '이름', cellStyle: {textAlign: "center"} },
    {
      headerName: '슈퍼 관리자',
      field: 'role',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        params.value === 3 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
      ),
    },
    {
      headerName: '설정 관리자',
      field: 'role',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        params.value === 2 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
      ),
    },
    {
      headerName: '모니터 관리자',
      field: 'role',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        params.value === 1 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
      ),
    },
    { field: 'phone', headerName: '연락처' },
    { field: 'email', headerName: '이메일' },
    { field: 'login_ts', headerName: '최근 로그인' },
    {
      headerName: '활성화',
      field: 'status',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        params.value === 1 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
      ),
    },
    {
      headerName: '관리',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        <IconButton // onClick={() => setOpenEdit(true)}
          onClick={() => {
            // 👇 예: 해당 row의 데이터 활용
            console.log('수정 클릭:', params.data);
            // 여기에 모달 열기 같은 기능 추가 가능
          }}
        >
          <EditIcon />
        </IconButton>
      ),
      width: 100,
      // pinned: 'right', // 👉 우측 고정 (선택)
      // suppressSizeToFit: true, // 자동 크기 조정 제외 (선택)
    },
  ];



  return (
    <SessionProvider>
      <div className="flex flex-col justify-center h-[calc(100vh-10rem)] w-[calc(100vw)] p-4 mt-5 bg-gray-100">
        <div className="flex justify-between items-end mb-2" >
          <FormControl size="small" sx={{ width: 90 }}>
            <Select value={pageSize.toString()} onChange={handlePageSizeChange}>
              <MenuItem value={10}>10개</MenuItem>
              <MenuItem value={20}>20개</MenuItem>
              <MenuItem value={50}>50개</MenuItem>
              <MenuItem value={100}>100개</MenuItem>
              <MenuItem value={1000000}>전체</MenuItem>
            </Select>
          </FormControl>
          <ButtonGroup size="large" disableElevation variant="contained">
            <Button onClick={() => setOpenAdd(true)}>추가</Button>
            <Button
              onClick={() => {
                const ids = selectedRows.map((row) => row.id);
                setDeleteIds(ids);
                setOpenDelete(true)
              }}
              disabled={selectedRows.length === 0}>삭제</Button>
            {/* <Button onClick={() => setOpenEdit(true)}>수정</Button> */}
          </ButtonGroup>

          <Addadmin open={openAdd} onClose={() => setOpenAdd(false)} />
          <AlertModal open={openDelete} close={() => setOpenDelete(false)} state='delete' title='관리자 삭제' message={`선택하신 ${selectedRows.length}개의 계정을 삭제하시겠습니까?`}/>
          <Editadmin open={openEdit} onClose={() => setOpenEdit(false)} mode="other" />
        </div>
        <AgGridReact
          modules={modules}
          rowData={pagedData}
          columnDefs={columnDefs}
          rowSelection={rowSelection}
          defaultColDef={defaultColDef}
          pagination={false}
          onGridReady={(params) => setGridApi(params.api)}
          onSelectionChanged={(e) => setSelectedRows(e.api.getSelectedRows())}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(rowData.length / pageSize)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </div>
    </SessionProvider>
  );
}
