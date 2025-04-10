import { POST } from '@/app/api/cmd/route';

export async function generateLicenseKey(data: any) {
  const { hardwareStatus, hardwareCode, softwareOpt, limitTimeStart, limitTimeEnd, issuer, manager, cpuName, siteName, cfid, regInit } = data;
  let license_key: string | null = null;

  console.log('data ::::::: ', data);
  console.log('code ::::::: ', hardwareCode);
  // function parseOption(opt?: number): number {
  //   return opt === 1 ? 1 : 0;
  // }

  /**
   * 
  Option
    0: BASIC
    1: FW
    2: VPN
    3: SSL / 행안부
    4: IPS / DIS
    5: DDOS
    6: WAF
    7: AV
    8: AS
    9: APT
    10: Web Filter
  */

    // ITU
  if (hardwareCode.startsWith('ITU')) {
    const functionMap = 
      (Number(softwareOpt.FW) || 0) * 1 + // option 1
      (Number(softwareOpt.VPN) || 0) * 2 + // option 2
      (Number(softwareOpt.DIS) || 0) * 4 + // option 4
      (Number(softwareOpt.AV) || 0) * 8 + // option 7
      (Number(softwareOpt.AS) || 0) * 16 + // option 8
      (Number(softwareOpt.행안부) || 0) * 32; // option 3

    const expireDate = new Date(limitTimeEnd).getTime()/1000;
    const hex_expire = Math.floor(expireDate).toString(16);

    console.log("functionMap: ", functionMap);
    console.log("hexExpire: ", hex_expire);

    const cmd = `/var/www/issue/license ${hardwareCode} ${functionMap} ${hex_expire}`;
    
    // const res = await fetch('/api/cmd', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ cmd, status: 'write' }),
    // });

    // const result = await res.json();
    // console.log("result: ", result);

    // let itu_res = await fetch('/api/cmd', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ cmd, status: 'exec' }),
    // });

    // const _key = await itu_res.json();
    const _key = "addtestITU123hardwardCode456";
    license_key = typeof _key === 'string' ? _key : null;

  } else if (!hardwareCode.startsWith('ITU') && regInit.length > 0) {
    let license_module = "-F";
    if(Number(softwareOpt.VPN) === 1) license_module += "V"; // option 2
    if(Number(softwareOpt.SSL) === 1) license_module += "S"; // option 3
    if(Number(softwareOpt.IPS) === 1) license_module += "I"; // option 4
    if(Number(softwareOpt.DDOS) === 1) license_module += "D"; // option 5
    if(Number(softwareOpt.WAF) === 1) license_module += "W"; // option 6
    if(Number(softwareOpt.AV) === 1) license_module += "A"; // option 7
    if(Number(softwareOpt.AS) === 1) license_module += "P"; // option 8

    // SMC / ITM
    else if(hardwareCode.split('-').length >= 3){
      let serial = hardwareCode;
      const codes = hardwareCode.split('-');

      if (codes.length > 3) { // cut dummy number
        serial = `${codes[0]}-${codes[1]}-${codes[2]}`;
      }

      const cmd = `../issue/fslicense -n -k ${regInit} -s ${serial} -b ${limitTimeStart} -e ${limitTimeEnd}`;
      // let smcitm_res = await fetch('/api/cmd', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ cmd, status: 'exec' }),
      // });

      // const smcitm_key = await smcitm_res.json();
      const smcitm_key = "addtestSMCITM123hardwardCode456";
      license_key = typeof smcitm_key === 'string' ? smcitm_key : null;
    } else {
      // XTM
      const cmd = `../issue/issue_china -c ${regInit} -s ${limitTimeStart} -e ${limitTimeEnd} -r ${hardwareCode} ${license_module}`;
      // let xtm_res = await fetch('/api/cmd', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ cmd, status: 'exec' }),
      // });

      // const xtm_key = await xtm_res.json();
      const xtm_key = "addtestXTM123hardwardCode456";
      license_key = typeof xtm_key === 'string' ? xtm_key : null;
    }

    
  } else {
    throw new Error(`해당 코드에 대한 라이선스 생성 로직이 아직 없습니다: ${hardwareCode}`);
  }
  console.log('license_key ::::::: ', license_key);
  return license_key;
}