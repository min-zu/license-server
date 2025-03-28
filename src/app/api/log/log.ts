export const fetchLogs = async () => {
  const response = await fetch('/api/log');
  if (!response.ok) {
    throw new Error('로그 데이터를 불러오는데 실패했습니다.');
  }
  return await response.json();
};

export const searchLogs = async (searchField: string, searchText: string) => {
  const response = await fetch('/api/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ searchField, searchText })
  });
  if (!response.ok) {
    throw new Error('검색 중 오류가 발생했습니다.');
  }
  return await response.json();
};