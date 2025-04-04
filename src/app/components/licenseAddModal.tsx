import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import '../style/common.css';
import '../style/license.css';
import { useState } from "react";
import { ValidEmail, ValidHardwareCode, ValidLimitTimeEnd, ValidLimitTimeStart, checkHardwareCode } from "@/app/api/validation";
import { useToastState } from "@/app/components/useToast";
// import { z } from "zod";

export default function LicenseAddModal({ close }: { close: () => void }) {
  // 입력값
  const [hardwareStatus, setHardwareStatus] = useState<string>('ITU');
  const [hardwareCode, setHardwareCode] = useState<string>('');
  const [limitTimeStart, setLimitTimeStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [limitTimeEnd, setLimitTimeEnd] = useState<string>('2036-12-31');
  const [issuer, setIssuer] = useState<string>('');
  const [manager, setManager] = useState<string>('');
  const [cpuName, setCpuName] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');
  const [cfid, setCfid] = useState<string>('');
  const [initCode, setInitCode] = useState<string>('');

    // 토스트 상태
    const { showToast, ToastComponent } = useToastState();

  const defaultOps = ['FW', 'VPN', 'SSL', 'IPS', 'WAF', 'AV', 'AS', 'Tracker'];
  const ituOps = ['FW', 'VPN', '행안부', 'DPI', 'AV', 'AS'];

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [hardwareCodeError, setHardwareCodeError] = useState<string>('');
  const [validHardwareCode, setValidHardwareCode] = useState<string>('');
  const [limitTimeStartError, setLimitTimeStartError] = useState<string>('');
  const [limitTimeEndError, setLimitTimeEndError] = useState<string>('');
  const textFieldTooltip = (text: string) => {
    return (
      <Tooltip
        title={<span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>}
        placement="top-end"
      >
        <Button
          className="add-license-help-btn"
          variant="contained"
          color="primary"
        >
          ?
        </Button>
      </Tooltip>
    );
  };

  const validationCheck = async (field: string, value: string) => {
    console.log(field, value);
    if(field === 'hardwareCode') {
      const result = ValidHardwareCode(value);
      console.log('result',result);
      if (result !== true) {
        setHardwareCodeError(result);
        setValidHardwareCode('');
      } else {
        setHardwareCodeError('');
        const isDuplicate = await checkHardwareCode(value);
        Number(isDuplicate) > 0 ? setValidHardwareCode('이미 등록된 시리얼 번호입니다.') : setValidHardwareCode('');
      }
    }

    if(field === 'limitTimeStart') {
      value === '' ? setLimitTimeStartError('유효기간(시작)을 입력해 주세요.') : setLimitTimeStartError('');
    }

    if(field === 'limitTimeEnd') {
      value === '' ? setLimitTimeEndError('유효기간(만료)을 입력해 주세요.') : setLimitTimeEndError('');
    }

  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true); 

    // 필수 입력값 체크
    if (hardwareCodeError !== '' || limitTimeStartError !== '' || limitTimeEndError !== '') { 
      showToast("입력값을 확인해 주세요.", "error");
      return;
    }

    // 입력값 유효성 검사

    // 등록 처리 로직
    const licenseData = {
      hardwareStatus, 
      hardwareCode,
      limitTimeStart,
      limitTimeEnd,
      issuer,
      manager,
      cpuName,
      siteName,
      cfid,
      initCode,
    };
    console.log("라이센스 등록 데이터:", licenseData);
    // 여기서 API 호출 등을 통해 등록 처리

    
  };

  return (
    <form className="w-full h-full flex justify-center items-center text-13" onSubmit={handleSubmit}>
      <div className="w-1/2 bg-white rounded-md">
        <div className="flex justify-between items-center p-4 border-b bg-gray-500">
          <h2 className="text-xl font-semibold text-white">라이센스 등록</h2>
          <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
        </div>
        <div className="flex flex-col gap-4 p-10">
          <Box className="add-license-form">
            <Box display="flex" alignItems="center"> 
              <FormLabel>
                <span className="text-red-500">*</span> 장비 선택
              </FormLabel>
              <ToggleButtonGroup exclusive size="small" onChange={(e, value) => {setHardwareStatus(value)}}>
                <ToggleButton 
                  value="ITU"
                  selected={hardwareStatus === 'ITU'}
                >
                  ITU
                </ToggleButton>
                <ToggleButton value="ITM" selected={hardwareStatus === 'ITM'}>ITM</ToggleButton>
                <ToggleButton value="XTM" selected={hardwareStatus === 'XTM'}>XTM</ToggleButton>
                <ToggleButton value="SMC" selected={hardwareStatus === 'SMC'}>SMC</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 제품 시리얼 번호
              </FormLabel>
              <TextField 
                size="small" 
                inputProps={{ maxLength: 24 }}
                name="hardwareCode"
                value={hardwareCode} 
                onChange={(e) => {
                  const value = e.target.value;
                  setHardwareCode(value);
                  validationCheck('hardwareCode', value);
                }} 
                error={hardwareCodeError !== '' || validHardwareCode !== ''}
                helperText={hardwareCodeError || validHardwareCode}
              />
              {textFieldTooltip(`ITU : ITU201AXXXXXXXXXXXXXXXXX (24 codes)\nITM : 3XXXXX-XXXXXX-XXXXXXXX[-N]\n(대소문자구분 22 codes | 번호추가[-N] 시 24 codes)`)}
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                소프트웨어 옵션
              </FormLabel>
              <FormGroup className="flex flex-wrap justify-between" style={{ flexDirection: 'row' }}>
                {hardwareStatus === 'ITU' ? ituOps.map((item) => (
                  <FormControlLabel
                    control={<Checkbox size="small"/>}
                    label={item}
                    key={item}
                  />
                )) : defaultOps.map((item) => (
                  <FormControlLabel
                    control={<Checkbox size="small"/>}
                    label={item}
                    key={item}

                    
                  />
                ))} 
              </FormGroup>
            </Box>

            <Box display="flex" alignItems="center" >
              <FormLabel>
                <span className="text-red-500">*</span> 유효기간(시작)
              </FormLabel>
              <TextField
                className="add-license-half-width" 
                name="limitTimeStart"
                size="small"
                type="date"
                value={limitTimeStart}
                onChange={(e) => {
                  setLimitTimeStart(e.target.value);
                  validationCheck('limitTimeStart', e.target.value);
                }}
                error={limitTimeStartError !== ''}
                helperText={limitTimeStartError}
                // required
              />

              <FormLabel>
                <span className="text-red-500">*</span> 유효기간(만료)
              </FormLabel>
              <TextField
                className="add-license-half-width"
                name="limitTimeEnd"
                size="small"
                type="date"
                value={limitTimeEnd}
                onChange={(e) => {
                  if(new Date(e.target.value) > new Date('2036-12-31')) setLimitTimeEnd('2036-12-31');
                  else setLimitTimeEnd(e.target.value);
                  validationCheck('limitTimeEnd', e.target.value);
                }}
                error={limitTimeEndError !== ''}
                helperText={limitTimeEndError}
                // required
              />
              {textFieldTooltip('만료일은 최대 2036년 12월 31일까지 가능합니다.')}
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel> 
                발급자
              </FormLabel>
              <TextField size="small" name="issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 발급요청사
              </FormLabel>
              <TextField size="small" name="manager" value={manager} onChange={(e) => setManager(e.target.value)} />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 프로젝트명
              </FormLabel>
              <TextField size="small" name="cpuName" value={cpuName} onChange={(e) => setCpuName(e.target.value)} />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 고객사명
              </FormLabel>
              <TextField size="small" name="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 고객사 E-mail
              </FormLabel>
              <TextField size="small" name="cfid" value={cfid} onChange={(e) => setCfid(e.target.value)} />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                하드웨어 인증키
              </FormLabel>
              <TextField size="small" name="initCode" value={initCode} onChange={(e) => setInitCode(e.target.value)} />
              {textFieldTooltip('수동 발급시에만 입력하세요!')}
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Button type="submit" variant="contained" color="primary"> 
                계속 등록
              </Button>
              <Button type="submit" variant="contained" color="primary">
                등록
              </Button>
              <Button variant="contained" color="inherit" onClick={close}>
                취소
              </Button>
            </Box>
          </Box>
        </div>
      </div>
      {ToastComponent}
    </form>
  )
}