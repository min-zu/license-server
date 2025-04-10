import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import { defaultOps, ituOps } from "@/app/data/config";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import '../style/common.css';
import '../style/license.css';
import { generateLicenseKey } from "../utils/licenseUtils";

interface LicenseDetailModalProps {
  close: () => void; // close prop 추가
  license: any; // license prop 추가
}

const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({ close, license }) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);

  console.log(license);

  const editSchema = z.object({
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    issuer: z.string().optional(),
    manager: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    cpuName: z.string().min(1, { message: '프로젝트명을 입력해주세요.' }),
    siteName: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    cfid: z.string().min(1, { message: '고객사 E-mail을 입력해주세요.' }).email({ message: '이메일 형식이 올바르지 않습니다.' }),
    initCode: z.string().optional(),
  })

  const {
    control,
    register,
    handleSubmit, 
    formState: { errors },
    setValue,
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
    defaultValues: {
      softwareOpt: {  
        // FW: 0,
        // VPN: 0,
        // SSL: 0,
        // 행안부 :0,
        // IPS: 0,
        // DPI: 0,
        // WAF: 0,
        // AV: 0,
        // AS: 0,
        // Tracker: 0,
      },
      limitTimeStart: new Date(license.limit_time_st).toISOString().split("T")[0],
      limitTimeEnd: new Date(license.limit_time_end).toISOString().split("T")[0],
      issuer: license.issuer,
      manager: license.manager,
      cpuName: license.cpu_name,
      siteName: license.sete_nm,
      cfid: license.cfid,
      initCode: license.init_code,
    },
  });

  const onSubmit = (data: z.infer<typeof editSchema>) => {
    console.log("onsubmit: ", data);

    // showToast("라이센스 수정 완료", "success");
    generateLicenseKey(data);
  };

  return (
    <form className="w-full h-full flex justify-center items-center text-13" onSubmit={handleSubmit(onSubmit)}>
    <div className="w-full h-full flex justify-center items-center license-detail-modal-wrap">
      <div className="w-1/2 bg-white rounded-md">
        <div className="flex justify-between items-center p-4 border-b bg-gray-500">
          <h2 className="text-xl font-semibold text-white">상세보기</h2>
          <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
        </div>
        <div className="flex flex-col gap-4 p-10 text-13" style={{ fontSize: '13px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="split-line"></div>
            <Box className="detail-line-box">
              <Box className="detail-line-box-item">
                <FormLabel>등록일 :</FormLabel> <p>{new Date(license.reg_date).toISOString().split('T')[0]}</p>
              </Box>
              <Box className="detail-line-box-item">
                <FormLabel>라이센스 발급일 :</FormLabel> <p>{new Date(license.license_date).toISOString().split('T')[0]}</p>
              </Box>
              <Box className="detail-line-box-item">
                <FormLabel>발급이력 :</FormLabel> <p>{license.reissuance === 1 ? '재발급' : '초기발급'}</p>
              </Box>
            </Box>

            {license.hardware_code.startsWith('ITU') ? (
              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>데모 발급 가능 횟수 :</FormLabel> <p>{license.process}</p>
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>고객사명 :</FormLabel> 
                  {isEdit ? 
                    <TextField {...register("cpuName")} /> : 
                    <p>{license.cpu_name}</p>} 
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>고객사 E-mail :</FormLabel> 
                  {isEdit ? 
                    <TextField {...register("cfid")} /> : 
                    <p>{license.cfid}</p>}
                </Box>
              </Box>
            ) : (
              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>PROCESS :</FormLabel> <p>{license.process}</p>
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>CPU명 :</FormLabel> <p>{license.cpu_name}</p>
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>CFID :</FormLabel> <p>{license.cfid}</p>
                </Box>
              </Box>
            )}

            <Box className="detail-line-box">
              <Box className="detail-line-box-item">
                <FormLabel>IP :</FormLabel> <p>{license.ip}</p>
              </Box>
              <Box className="detail-line-box-item">
                <FormLabel>유효기간(시작) :</FormLabel> 
                {isEdit ? 
                  <TextField {...register("limitTimeStart")} type="date"/> : 
                  <p>{new Date(license.limit_time_st).toISOString().split('T')[0]}</p>}
              </Box>
              <Box className="detail-line-box-item">
                <FormLabel>유효기간(만료) :</FormLabel> 
                {isEdit ? 
                  <TextField {...register("limitTimeEnd")} type="date"/> : 
                  <p>{new Date(license.limit_time_end).toISOString().split('T')[0]}</p>}
              </Box>
            </Box>

            <Box className="detail-line-box">
              <Box className="detail-line-box-item">
                <FormLabel>발급자 :</FormLabel> 
                {isEdit ? 
                  <TextField {...register("issuer")} /> : 
                  <p>{license.issuer}</p>}
              </Box>
              <Box className="detail-line-box-item">
                <FormLabel>담당자 :</FormLabel> 
                {isEdit ? 
                  <TextField {...register("manager")} /> : 
                  <p>{license.manager}</p>}
              </Box>
              <Box className="detail-line-box-item">
                <FormLabel>사이트 :</FormLabel> 
                {isEdit ? 
                  <TextField {...register("siteName")} /> : 
                  <p>{license.sete_nm}</p>}
              </Box>
            </Box>

            <div className="split-line"></div>
            
            <Box className="detail-line-box">
              {(license.hardware_code.startsWith('ITU') ? ituOps : defaultOps).map(({ label, value }) => (
                <FormControlLabel
                  key={label}
                  control={
                    <Checkbox 
                      checked={license['license_' + value] === '1'}
                      disabled={!isEdit}
                      onChange={(e) => {
                        // 여기에 체크박스 변경 로직 추가
                        const newValue = e.target.checked ? '1' : '0';
                        // setValue('license_' + value, newValue);
                      }}
                    />
                  }
                  label={label}
                />
              ))}
            </Box>

            <div className="split-line"></div>
            
            <Box display="flex" alignItems="center">
              <FormLabel>제품 시리얼번호 :</FormLabel> <p>{license.hardware_code}</p>
            </Box>
            <Box display="flex" alignItems="center">
              <FormLabel>하드웨어 인증키 :</FormLabel>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', maxWidth: '100%' }}>
                {license.init_code.length > 60 ? `${license.init_code.slice(0, 60)}\n${license.init_code.slice(60)}` : license.init_code}
              </p>
            </Box>
            <Box display="flex" alignItems="center">
              <FormLabel>사이트 :</FormLabel> <p>{license.auth_code}</p>
            </Box>

            <div className="split-line"></div>

            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Button variant="contained" color="primary" onClick={() => setIsEdit(!isEdit)}>
                {isEdit ? '저장' : '수정'}
              </Button>
              <Button variant="contained" color="inherit" onClick={close}>
                취소
              </Button>
            </Box>
          </Box>
        </div>
      </div>
    </div>
    </form>
  )
}

export default LicenseDetailModal;