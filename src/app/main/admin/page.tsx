'use client'

import { useEffect, useMemo, useState } from 'react';

import { ColDef, Module, ICellRendererParams, RowSelectionOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, RowSelectionModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import { Box, Button, ButtonGroup, FormControl, MenuItem, Select, SelectChangeEvent, IconButton } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import EditIcon from '@mui/icons-material/Edit';

import AlertModal from '@/app/components/alertModal';
import Pagenation from '@/app/components/pagenation';
import UpsertModal from '@/app/components/upsertAdminModal';
import { useToastState } from '@/app/components/useToast';
import ToastAlert from '@/app/components/toastAleat';
import { SessionProvider } from 'next-auth/react';

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
  // 전체 관리자 데이터
  const [rowData, setRowData] = useState<Admin[]>([]);
  // mode ('add' = 추가, 'other' = 수정)
  const [upsertMode, setUpsertMode] = useState<'add' | 'other'>();
  // 수정 대상 관리자 정보
  const [editTarget, setEditTarget] = useState<Admin>();
  // 현재 페이지 번호
  const [currentPage, setCurrentPage] = useState(1);
  // 페이지당 보여줄 항목 수
  const [pageSize, setPageSize] = useState(10);
  // 관리자 추가/수정 모달 열림 여부
  const [openUpsert, setOpenUpsert] = useState(false);
  // 관리자 삭제 확인 모달 열림 여부
  const [openDelete, setOpenDelete] = useState(false)
  // 선택된 행(관리자) 목록
  const [selectedRows, setSelectedRows] = useState<Admin[]>([]);
  // 삭제 대상 관리자 ID 배열
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  // ag-Grid에서 사용할 모듈 설정
  const modules: Module[] = [ClientSideRowModelModule, RowSelectionModule];
  // ToastAlert
  const { toastOpen, toastMsg, severity, showToast, toastClose } = useToastState();

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

  // 현재 페이지와 페이지 크기를 기반으로 보여줄 데이터 계산
  const pagedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rowData.slice(startIndex, startIndex + pageSize);
  }, [rowData, pageSize, currentPage]);

  // 페이지 사이즈 변경 시 호출되는 핸들러 - 선택된 페이지 크기(newSize)로 설정하고, 페이지를 첫 페이지(1)로 초기화
  const handlePageSizeChange = (event: SelectChangeEvent) => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // 페이지 번호 클릭 시 현재 페이지 상태를 업데이트하는 핸들러
  const handlePageChange = (value: number) => {
    setCurrentPage(value);
  };

  // ag-Grid에서 다중 행 선택 설정 및 조건부 선택 제한 설정 - 슈퍼 관리자는 선택 불가로 설정
  const rowSelection: RowSelectionOptions = useMemo(() => { 
    return { 
          mode: 'multiRow',
          isRowSelectable: (rowNode) => rowNode.data ? rowNode.data.role !== 3 : false,
    }
  }, []);

  // ag-Grid의 모든 컬럼에 적용할 기본 속성 설정
  const defaultColDef = useMemo(() => ({
    sortable: true, // 컬럼 정렬 허용
    resizable: false, // 컬럼 크기 조절 X
    suppressMovable: true, // 컬럼 드래그로 위치 이동 X
  }), []);

  // ag-Grid에 표시할 컬럼 정의 목록
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
      headerName: '활성화',
      field: 'status',
      cellRenderer: (params: ICellRendererParams<Admin>) => (
        params.value === 1 ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
      ),
    },
    {// 편집 버튼 (슈퍼 관리자는 제외)
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
      width: 100,
    },
  ];

  return (
    <SessionProvider>
      <ToastAlert
        open={toastOpen}
        setOpen={toastClose}
        message={toastMsg}
        severity={severity} 
      />
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
            <Button onClick={() => {setUpsertMode('add'); setOpenUpsert(true)}}>추가</Button>
            <Button
              onClick={() => {
                const ids = selectedRows.map((row) => row.id);
                setDeleteIds(ids);
                setOpenDelete(true)
              }}
              disabled={selectedRows.length === 0}>삭제</Button>
          </ButtonGroup>
        </div>
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

        <AgGridReact
          modules={modules}
          rowData={pagedData}
          columnDefs={columnDefs}
          rowSelection={rowSelection}
          defaultColDef={defaultColDef}
          pagination={false}
          onSelectionChanged={(e) => setSelectedRows(e.api.getSelectedRows())}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagenation
            props={{
              totalPages:Math.ceil(rowData.length / pageSize),
              currentPage:currentPage,
              onChange:handlePageChange
            }}
          />
        </Box>
      </div>
    </SessionProvider>

    
  );
}
