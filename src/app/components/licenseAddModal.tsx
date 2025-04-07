import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, styled, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import '../style/common.css';
import '../style/license.css';
import { useState, useEffect } from "react";
import { ValidEmail, ValidHardwareCode, ValidLimitTimeEnd, ValidLimitTimeStart, checkHardwareCode } from "@/app/api/validation";
import { useToastState } from "@/app/components/useToast";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

  // const [isSubmitted, setIsSubmitted] = useState(false);

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

  const addSchema = z.object({
    hardwareStatus: z.string().min(1, { message: '장비 선택을 해주세요.' }),
    hardwareCode: z.string()
      .min(1, { message: '제품 시리얼 번호를 입력해주세요.' })
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, { message: '제품 시리얼 번호는 영문과 숫자를 각각 1개 이상 포함해야 합니다.' })
      .min(24, { message: '제품 시리얼 번호는 24자입니다.' }),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    manager: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    cpuName: z.string().min(1, { message: '프로젝트명을 입력해주세요.' }),
    siteName: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    cfid: z.string().min(1, { message: '고객사 E-mail을 입력해주세요.' }).email({ message: '이메일 형식이 올바르지 않습니다.' }),
  })

  const {
    register,
    handleSubmit, 
    formState: { errors },
  } = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: 'onChange',
    reValidateMode: 'onSubmit',
  });

  const onSubmit = (data: z.infer<typeof addSchema>) => {
    console.log("onsubmit: ", data);
  };

  return ( 
    <>
    <form className="w-full h-full flex justify-center items-center text-13" onSubmit={handleSubmit(onSubmit)}>
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
                value={hardwareCode} 
                error={errors.hardwareCode !== undefined}
                helperText={errors.hardwareCode?.message}
                {...register('hardwareCode', {
                  onChange: (e) => {
                    const value = e.target.value;
                    if(value.length > 24) return;
                    setHardwareCode(value);
                  },
                })}
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
                size="small"
                type="date"
                value={limitTimeStart}
                error={errors.limitTimeStart !== undefined}
                helperText={errors.limitTimeStart?.message}
                {...register('limitTimeStart', {
                  onChange: (e) => {
                    setLimitTimeStart(e.target.value);
                  },
                })}
              />

              <FormLabel>
                <span className="text-red-500">*</span> 유효기간(만료)
              </FormLabel>
              <TextField
                className="add-license-half-width"
                size="small"
                type="date"
                value={limitTimeEnd}
                error={errors.limitTimeEnd !== undefined}
                helperText={errors.limitTimeEnd?.message}
                {...register('limitTimeEnd', {
                  onChange: (e) => {
                    if(new Date(e.target.value) > new Date('2036-12-31')) setLimitTimeEnd('2036-12-31');
                    else setLimitTimeEnd(e.target.value);
                  },
                })}
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
              <TextField 
                size="small" 
                value={manager}
                error={errors.manager !== undefined}
                helperText={errors.manager?.message}
                {...register('manager', {
                  onChange: (e) => {
                    setManager(e.target.value);
                  },
                })} 
                />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 프로젝트명
              </FormLabel>  
              <TextField 
                size="small" 
                value={cpuName}  
                error={errors.cpuName !== undefined}
                helperText={errors.cpuName?.message}
                {...register('cpuName', {
                  onChange: (e) => {
                    setCpuName(e.target.value);
                  },
                })} 
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 고객사명
              </FormLabel>
              <TextField 
                size="small" 
                value={siteName}  
                error={errors.siteName !== undefined}
                helperText={errors.siteName?.message}
                {...register('siteName', {
                  onChange: (e) => {
                    setSiteName(e.target.value);
                  },
                })} 
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 고객사 E-mail
              </FormLabel>
              <TextField 
                size="small" 
                value={cfid} 
                error={errors.cfid !== undefined}
                helperText={errors.cfid?.message}
                {...register('cfid', {
                  onChange: (e) => {
                    setCfid(e.target.value);
                  },
                })} 
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                하드웨어 인증키
              </FormLabel>
              <TextField size="small" name="initCode" value={initCode} onChange={(e) => setInitCode(e.target.value)} />
              {textFieldTooltip('수동 발급시에만 입력하세요!')}
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Button type="submit" variant="contained" color="primary" > 
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
    </>
  )
}