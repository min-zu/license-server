import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { defaultOps, ituOps } from "@/app/data/config";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import '../style/common.css';
import '../style/license.css';
import { generateLicenseKey } from "../utils/licenseUtils";
import { useToastState } from "./useToast";

interface LicenseDetailModalProps {
  close: () => void; // close prop 추가
  license: any; // license prop 추가
  onUpdated?: () => void;
}

const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({ close, license, onUpdated }) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const { showToast, ToastComponent } = useToastState();

  const isITU = license?.hardware_code?.startsWith("ITU");

  console.log(license);

  // ITU 유효성 검사
  const ITUSchema = z.object({
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

  // ITU 제외 유효성 검사
  const nonITUSchema = z.object({
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    issuer: z.string().optional(),
    manager: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    siteName: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    initCode: z.string().optional(),
  })


  const { schema, defaultValues } = useMemo(() => {
    const base = {
      softwareOpt: {
        FW: license.license_fw === "1" ? 1 : 0,
        VPN: license.license_vpn === "1" ? 1 : 0,
        [isITU ? "행안부" : "SSL"]: license?.license_ssl === "1" ? 1 : 0,
        [isITU ? "DPI" : "IPS"]: license?.license_ips === "1" ? 1 : 0,
        WAF: license.license_waf === "1" ? 1 : 0,
        AV: license.license_av === "1" ? 1 : 0,
        AS: license.license_as === "1" ? 1 : 0,
        Tracker: license.license_tracker === "1" ? 1 : 0,
      },
      limitTimeStart: new Date(license.limit_time_st).toISOString().split("T")[0],
      limitTimeEnd: new Date(license.limit_time_end).toISOString().split("T")[0],
      issuer: license.issuer,
      manager: license.manager,
      siteName: license.site_nm,
      initCode: license.init_code,
    };
    if (isITU) {
      return {
        schema: ITUSchema,
        defaultValues: {
          ...base,
          cpuName: license.cpu_name,
          cfid: license.cfid,
        },
      };
    }
    return { schema: nonITUSchema, defaultValues: base };
  }, [license]);

  const {
    control,
    register,
    handleSubmit, 
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    console.log("onsubmit: ", data);
    try {
      const res = await fetch('/api/license/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        console.error("업데이트 실패:", errorData);
        showToast("업데이트 실패: " + (errorData?.error || "알 수 없는 오류"), "warning");
        return;
      }
  
      const result = await res.json();
      console.log("업데이트 성공:", result);
      showToast("라이선스 수정 완료", "success");
      setIsEdit(false); // 저장 후 수정 모드 종료
      onUpdated?.();
  
    } catch (error) {
      console.error("서버 요청 중 오류 발생:", error);
      showToast("서버 오류 발생", "warning");
    }
    // showToast("라이센스 수정 완료", "success");
  };

  return (
    <form className="w-full h-full flex justify-center items-center text-13">
      <div className="w-full h-full flex justify-center items-center license-detail-modal-wrap">
        <div className="w-1/2 bg-white rounded-md">
          <div className="flex justify-between items-center p-4 border-b bg-cyan-950">
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
                    <FormLabel>프로젝트명 :</FormLabel> 
                    {isEdit ? 
                      <TextField {...register("cpuName")} /> : 
                      <p>{watch("cpuName")}</p>} 
                  </Box>
                  <Box className="detail-line-box-item">
                    <FormLabel>고객사 E-mail :</FormLabel> 
                    {isEdit ? 
                      <TextField {...register("cfid")} /> : 
                      <p>{watch("cfid")}</p>}
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
                    <p>{watch("limitTimeStart")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>유효기간(만료) :</FormLabel> 
                  {isEdit ? 
                    <TextField {...register("limitTimeEnd")} type="date"/> : 
                    <p>{watch("limitTimeEnd")}</p>}
                </Box>
              </Box>

              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>발급자 :</FormLabel> 
                  {isEdit ? 
                    <TextField {...register("issuer")} /> : 
                    <p>{watch("issuer")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>담당자 :</FormLabel> 
                  {isEdit ? 
                    <TextField {...register("manager")} /> : 
                    <p>{watch("manager")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>고객사명 :</FormLabel> 
                  {isEdit ? 
                    <TextField {...register("siteName")} /> : 
                    <p>{watch("siteName")}</p>}
                </Box>
              </Box>

              <div className="split-line"></div>
              
              <Controller
                  control={control}
                  name="softwareOpt"
                  render={({ field }) => (
                    <Box className="detail-line-box">
                      {(license.hardware_code.startsWith('ITU') ? ituOps : defaultOps).map(({ label, value }) => (
                        <FormControlLabel
                          key={label}
                          control={
                            <Checkbox 
                              checked={field.value[label] === 1}
                              disabled={!isEdit}
                              onChange={(e) => {
                                // 여기에 체크박스 변경 로직 추가
                                const newValue = e.target.checked ? { ...field.value, [label]: 1 } : { ...field.value, [label]: 0 };
                                field.onChange(newValue);
                              }}
                            />
                          }
                          label={label}
                        />
                      ))}
                    </Box>
                  )}
                />
              
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
                <FormLabel>인증키 :</FormLabel> <p>{license.auth_code}</p>
              </Box>

              <div className="split-line"></div>

              <Box display="flex" justifyContent="center" gap={0.5} mt={2}>
                <Button
                  className="default-btn"
                  onClick={() => {
                    if (!isEdit) {
                      setIsEdit(true);
                    } else {
                      handleSubmit(onSubmit)();
                    };
                  }}
                >
                  {isEdit ? '저장' : '수정'}
                </Button>
                <Button className="close-text-btn" onClick={close}>
                  취소
                </Button>
              </Box>
            </Box>
          </div>
        </div>
      </div>
     {ToastComponent}
    </form>
  )
}

export default LicenseDetailModal;