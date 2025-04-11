'use client'

import { useEffect, useMemo, useRef, useState } from 'react';

// AG Grid 관련
import { ColDef, Module, ICellRendererParams, RowSelectionOptions, PaginationModule } from 'ag-grid-community';
import { ClientSideRowModelModule, RowSelectionModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// MUI 관련
import { Box, Button, ButtonGroup, FormControl, MenuItem, Select, SelectChangeEvent, IconButton } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import EditIcon from '@mui/icons-material/Edit';

// 컴포넌트
import AlertModal from '@/app/components/alertModal';
import Pagenation from '@/app/components/pagenation';
import UpsertModal from '@/app/components/upsertAdminModal';
import { useToastState } from '@/app/components/useToast';
import Link from 'next/link';

// 커스텀 css
import '@/app/style/login.css'
import '@/app/style/common.css'

export interface Admin {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: number;
  status: number;
  login_ts?: string;
}

export default function AdminPage() {
  // ag-Grid에서 사용할 모듈 설정
  const modules: Module[] = [ClientSideRowModelModule, RowSelectionModule, PaginationModule];
  // AG Grid API에 접근하기 위한 참조 객체
  const gridRef = useRef<any>(null);
  // 전체 관리자 데이터
  const [rowData, setRowData] = useState<Admin[]>([]);
  // 전체 페이지 수
  const [totalPages, setTotalPages] = useState(1);
  // 현재 페이지 번호
  const [currentPage, setCurrentPage] = useState(1);
  // 페이지당 보여줄 행(관리자) 수
  const [pageSize, setPageSize] = useState(10);
  // mode ('add' = 추가, 'other' = 수정)
  const [upsertMode, setUpsertMode] = useState<'add' | 'other'>();
  // 수정 대상 정보
  const [editTarget, setEditTarget] = useState<Admin>();
  // 관리자 추가/수정 모달 열림 여부
  const [openUpsert, setOpenUpsert] = useState(false);
  // 관리자 삭제 확인 모달 열림 여부
  const [openDelete, setOpenDelete] = useState(false)
  // 선택된 행(관리자) 목록
  const [selectedRows, setSelectedRows] = useState<Admin[]>([]);
  // 삭제 대상 관리자 ID 배열
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  // ToastAlert
  const {  showToast, ToastComponent } = useToastState();

  // 관리자 목록 데이터를 API로부터 불러와 상태로 저장하는 함수
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin?mode=adminList'); // admin 목록 요청
      if (!res.ok) throw new Error('네트워크 오류');
      const data = await res.json();
      setRowData(data);
    } catch (err) {
      console.error('데이터 불러오기 실패:', err);
    }
  };

  // 처음 화면이 나타나면 실행
  useEffect(() => {
    fetchData();
  }, []);

  // 현재 페이지 번호와 전체 페이지 수
  const handlePaginationChanged = (params: any) => {
    const current = params.api.paginationGetCurrentPage() + 1;
    const total = params.api.paginationGetTotalPages();
    setCurrentPage(current);
    setTotalPages(total);
  };

  // 페이지 사이즈 변경 시 호출되는 핸들러 - 선택된 페이지 크기(newSize)로 설정하고, 페이지를 첫 페이지(1)로 초기화
  const handlePageSizeChange = (event: SelectChangeEvent) => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    gridRef.current?.api?.paginationGoToPage?.(0); // 첫 페이지
  };

  // ag-Grid에서 다중 행 선택 설정 및 조건부 선택 제한 설정 - 슈퍼 관리자는 선택 불가로 설정
  const rowSelection: RowSelectionOptions = useMemo(() => { 
    return { 
          mode: 'multiRow',
          isRowSelectable: (rowNode) => rowNode.data ? rowNode.data.role !== 3 : false,
    }
  }, []);
  
  // ag-Grid에 표시할 컬럼 정의 목록
  const columnDefs: ColDef<Admin>[] = [
    { field: 'id', headerName: '아이디' },
    { field: 'name', headerName: '이름' },
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
    {
      field: 'login_ts',
      headerName: '최근 로그인',
      valueFormatter: (params) => {
        const value = params.value;
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString(); // 로컬 시간 형식으로 출력
      },
    },
    {
      field: 'status',
      headerName: '활성화',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        params.value === 1 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
      ),
    },
    {// 편집 버튼 (슈퍼 관리자는 제외)
      colId: 'editBtn',
      headerName: '관리',
      cellRenderer: (params: ICellRendererParams<Admin>) => {
        const data = params.data;
        if (!data || data.role === 3) return null; // 슈퍼 관리자 수정 금지
        
        return (
          <IconButton
            onClick={() => {
              setEditTarget(data);
              setUpsertMode('other');
              setOpenUpsert(true);
            }}
            >
            <EditIcon />
          </IconButton>
        );
      },
    },
  ];
  
  // ag-Grid의 모든 컬럼에 적용할 기본 속성 설정
  const defaultColDef = useMemo(() => ({
    sortable: true, // 컬럼 정렬 허용
    resizable: true, // 컬럼 크기 조절 X
    suppressMovable: true, // 컬럼 드래그로 위치 이동 X
    flex: 1
  }), []);
  
  return (
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
          <div className="flex items-center gap-1">
            <Button size="small" variant="contained" onClick={() => {setUpsertMode('add'); setOpenUpsert(true)}}>추가</Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => {
                const ids = selectedRows.map((row) => row.id);
                setDeleteIds(ids);
                setOpenDelete(true)
              }}
              disabled={selectedRows.length === 0}>삭제</Button>
          </div>
        </div>
        {openUpsert && (
          <UpsertModal
            mode={upsertMode}
            open={openUpsert}
            onClose={() => setOpenUpsert(false)}
            onAdded={() => {
              let message = "";
              if (upsertMode === "add") {
                message = "관리자 계정이 생성되었습니다.";
              } else if (upsertMode === "other") {
                message = "관리자 계정이 수정되었습니다.";
              }
              
              if (message) {
                showToast(message, "success");
              }
              fetchData();
            }}
            target={upsertMode === "other" ? editTarget : undefined}
          />
        )}
        <AlertModal 
          open={openDelete} 
          close={() => setOpenDelete(false)} 
          state='admin' 
          title='관리자 삭제' 
          message={`선택하신 ${selectedRows.length}개의 계정을 삭제하시겠습니까?`}
          deleteIds={deleteIds} 
          onDeleted={(deletedIds) => {
            setRowData((prev) => prev.filter((row) => !deletedIds.includes(row.id)));
            setSelectedRows([]);
          }}
        />
        <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 240px)', width: '100%' }}>
        <AgGridReact
          modules={modules}
          rowData={rowData}
          columnDefs={columnDefs}
          rowSelection={rowSelection}
          defaultColDef={defaultColDef}
          theme="legacy"
          onSelectionChanged={(e) => setSelectedRows(e.api.getSelectedRows())}
          pagination={true}
          suppressPaginationPanel={true}
          paginationPageSize={pageSize}
          onPaginationChanged={handlePaginationChanged}
          ref={gridRef}
        />
        </div>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
          <div className="flex justify-center flex-grow">
            <Pagenation
              props={{
                totalPages: totalPages,
                currentPage: currentPage,
                gridRef: gridRef,
              }}
            />
          </div>
          <span className='text-13 text-black'>총 {rowData.length}개</span>
        </Box>
        {ToastComponent}
      </div>
  );
}
