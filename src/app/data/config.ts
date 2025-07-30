/**
 * 라이센스 옵션 설정
 */

//   defaultOps: ['FW', 'VPN', 'SSL', 'IPS', 'WAF', 'AV', 'AS', 'Tracker'],
  // ituOps: ['FW', 'VPN', '행안부', 'DPI', 'AV', 'AS'],

export const defaultOps = [
  { label: 'FW', value: 'fw' },
  { label: 'VPN', value: 'vpn' },
  { label: 'S2', value: 's2' },
  { label: 'DPI', value: 'dpi' },
  { label: 'AV', value: 'av' },
  { label: 'AS', value: 'as' },
  { label: 'OT', value: 'ot' },
]

export const ituOps = [
  { label: 'FW', value: 'fw' },
  { label: 'VPN', value: 'vpn' },
  { label: 'S2', value: 's2' },
  { label: 'DPI', value: 'dpi' },
  { label: 'AV', value: 'av' },
  { label: 'AS', value: 'as' },
  { label: 'OT', value: 'ot' },
  { label: 'ZT', value: 'zt' },
] 

export const userType = [
  { label: '데모 관리자', value: 'demo' },
  { label: '슈퍼 관리자', value: 'super' },
  { label: '설정 관리자', value: 'setting' },
  { label: '모니터 관리자', value: 'monitor' },
]
