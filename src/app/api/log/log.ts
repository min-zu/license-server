export const fetchLogs = async () => {
  const response = await fetch('/api/log');
  if (!response.ok) {
    throw new Error('로그 데이터를 불러오는데 실패했습니다.');
  }
  return await response.json();
};

export const fetchLogDetail = async (hardware_serial: string, action_date: string) => {
  const response = await fetch('/api/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'logDetail', hardware_serial, action_date })
  });
  if (!response.ok) {
    throw new Error('로그 상세 데이터 조회에 실패했습니다.');
  }
  return await response.json();
};

export const searchLogs = async (searchField: string, searchData: string | { startDate: string, endDate: string }) => {
  const response = await fetch('/api/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'searchLog', searchField, searchData })
  });
  if (!response.ok) {
    throw new Error('검색 중 오류가 발생했습니다.');
  }
  return await response.json();
};

export const addLog = async (log: any) => {
  const response = await fetch('/api/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'addLog', log })
  });
  if (!response.ok) {
    throw new Error('로그 추가 중 오류가 발생했습니다.');
  }
  return await response.json();
};

