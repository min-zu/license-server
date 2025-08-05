import { ituOps } from '@/app/data/config';

interface LicenseData {
  reg_date: string;
  hardware_serial: string;
  hardware_code?: string; // optional로 변경
  license_key?: string; // optional로 변경
  software_opt: object; // any[]에서 object로 변경
  license_date: string;
  limit_time_start: string;
  limit_time_end: string;
  ip: string;
  reg_user: string;
  reg_request: string;
  customer: string;
  reg_auto: number; // string에서 number로 변경
  expiration: number; // string에서 number로 변경
}

export const exportLicenseToCSV = (selectedRows: LicenseData[], opts?: any[]) => {
  const getOpts = (opts: any[]) => {
    const res: any[] = [];
    
    Object.entries(opts).forEach(([key, value]) => {
      if (value === '1') {
        const label = key === 'license_s2' ? '행안부' : key === 'license_ot' ? '산업용 프로토콜' : key === 'license_zt' ? 'ITUz' : key.split('_')[1].toUpperCase();
        res.push(label);
      }
    });

    return res.join(' | '); // 쉼표 대신 파이프(|) 사용
  }

  const getRegAuto = (reg_auto: number, license_key: string | undefined) => {
    const text = reg_auto === 0 ? '수동' : reg_auto === 1 ? '자동' : reg_auto === 2 ? '데모' : reg_auto === 3 ? '미발급' : reg_auto === 4 ? '만료' : '';
    if(reg_auto === 2 && license_key === null) {
      return text + '(미발급)';
    }
    console.log(text);
    return text;
  }

  const excelData = selectedRows.map((row, index) => {
    return {
      '등록일': new Date(row.reg_date).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }),
      '제품 시리얼 번호': row.hardware_serial, 
      '하드웨어 인증키': row.hardware_code || '',
      '라이센스 키': row.license_key || '',
      '소프트웨어 옵션': opts && opts[index] ? getOpts(opts[index]) : '',
      '라이센스 발급일': row.license_date === '' || row.license_date === null ? '' : new Date(row.license_date).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }),
      '유효기간(시작)': new Date(row.limit_time_start).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
      '유효기간(만료)': new Date(row.limit_time_end).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
      'IP': row.ip,
      '발급자': row.reg_user,
      '발급요청사항': row.reg_request,
      '고객사명': row.customer,
      '발급 구분': getRegAuto(row.reg_auto, row.license_key),
    };
  });

  // CSV 값 이스케이프 함수 추가
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // 값에 쉼표, 개행, 따옴표가 포함되어 있으면 따옴표로 감싸고 내부 따옴표는 이중 따옴표로 처리
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headers = Object.keys(excelData[0]);
  const csvContent = [
    headers.join(','), 
    ...excelData.map((row) => 
      Object.values(row).map(escapeCSVValue).join(',')
    )
  ].join('\n');
  
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${today}_export_license.csv`;
  a.click();
  
  // 메모리 정리
  URL.revokeObjectURL(url);
};  