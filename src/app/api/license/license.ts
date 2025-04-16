export const fetchLicenses = async () => {
  const response = await fetch('/api/license');
  if (!response.ok) {
    throw new Error('라이센스 데이터를 불러오는데 실패했습니다.');
  }
  return await response.json();
};

export const searchLicenses = async (searchField: string, searchText: string) => {
  const response = await fetch('/api/license', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ searchField, searchText })
  });
  console.log('response', response);
  if (!response.ok) {
    throw new Error('검색 중 오류가 발생했습니다.');
  }
  return await response.json();
};

export const deleteLicenses = async (codes: string[]) => {
  const response = await fetch('/api/license', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ codes })
  });
  if (!response.ok) {
    throw new Error('삭제 중 오류가 발생했습니다.');
  }
  return await response.json();
};
