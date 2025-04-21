/**
 * 라이센스 옵션 설정
 */

//   defaultOps: ['FW', 'VPN', 'SSL', 'IPS', 'WAF', 'AV', 'AS', 'Tracker'],
  // ituOps: ['FW', 'VPN', '행안부', 'DPI', 'AV', 'AS'],

export const defaultOps = [
  { label: 'FW', value: 'fw' },
  { label: 'VPN', value: 'vpn' },
  { label: 'SSL', value: 'ssl' },
  { label: 'IPS', value: 'ips' },
  { label: 'WAF', value: 'waf' },
  { label: 'AV', value: 'av' },
  { label: 'AS', value: 'as' },
  { label: 'Tracker', value: 'tracker' },
]

export const ituOps = [
  { label: 'FW', value: 'fw' },
  { label: 'VPN', value: 'vpn' },
  { label: '행안부', value: '행안부' },
  { label: 'DPI', value: 'dpi' },
  { label: 'AV', value: 'av' },
  { label: 'AS', value: 'as' },
  { label: '한전', value: '한전' },
] 
