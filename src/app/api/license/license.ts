export const fetchLicenses = async () => {
  const response = await fetch('/api/license');
  if (!response.ok) {
    throw new Error('라이센스 데이터를 불러오는데 실패했습니다.');
  }
  return await response.json();
};