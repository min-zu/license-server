import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSession } from 'next-auth/react';
import { defaultOps, ituOps } from "@/app/data/config";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useToastState } from "./useToast";

interface LicenseDetailModalProps {
  close: () => void; // close prop 추가
  license: any; // license prop 추가
  onUpdated?: () => void;
}

const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({ close, license, onUpdated }) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const { showToast, ToastComponent } = useToastState();

  // role
  const { data: session } = useSession();
  const role = session?.user?.role;

  // ITU 장비 여부 판단: 시리얼 번호가 ITU로 시작하는지 확인
  const isITU = license?.hardwareSerial?.startsWith("ITU");

  // 라이선스 키 관리
  const [licenseKey, setLicenseKey] = useState<string>(license.license_key || "");

  useEffect(() => {
    setLicenseKey(license.license_key || "");
  }, [license.license_key]);

  // ITU 유효성 검사
  const ITUSchema = z.object({
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    regUser: z.string().optional(),
    regRequest: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    customer: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    projectName: z.string().min(1, { message: '프로젝트명을 입력해주세요.' }),
    customerEmail: z.string().min(1, { message: '고객사 E-mail을 입력해주세요.' }).email({ message: '이메일 형식이 올바르지 않습니다.' }),
    hardwareSerial: z.string().optional(),
    hardwareCode: z.string().optional(),
  })

  // ITU 제외 유효성 검사
  const nonITUSchema = z.object({
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    regUser: z.string().optional(),
    regRequest: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    customer: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    hardwareSerial: z.string().optional(),
    hardwareCode: z.string().optional(),
  })

  // 초기 렌더링 값 설정
  const { schema, defaultValues } = useMemo(() => {
    // 공통
    const base = {
      softwareOpt: {
        FW: license.license_fw === "1" ? 1 : 0,
        VPN: license.license_vpn === "1" ? 1 : 0,
        S2: license?.license_s2 === "1" ? 1 : 0,
        DPI: license?.license_dpi === "1" ? 1 : 0,
        AV: license.license_av === "1" ? 1 : 0,
        AS: license.license_as === "1" ? 1 : 0,
        OT: license.license_ot === "1" ? 1 : 0,
      },
      limitTimeStart: new Date(license.limit_time_start).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      limitTimeEnd: new Date(license.limit_time_end).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      issuer: license.reg_user,
      manager: license.reg_request,
      siteName: license.customer,
      hardwareCode: license.hardware_serial,
      initCode: license.hardware_code,
    };
    // ITU 장비: ITUSchema로 유효성 검사 및 렌더링 - 공통 + cpuName,cfid
    if (isITU) {
      return {
        schema: ITUSchema,
        defaultValues: {
          ...base,
          cpuName: license.project_name,
          cfid: license.customer_email,
        },
      };
    }
    // ITU 장비 제외 다른 장비: nonITUSchema로 유효성 검사 및 렌더링 - 공통
    return { schema: nonITUSchema, defaultValues: base };
  }, [license]);

  const {
    control,
    register,
    handleSubmit, 
    formState: { errors },
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

  // 저장 버튼 클릭 시 실행되는 submit 함수
  const onSubmit = async (data: z.infer<typeof schema>) => {
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
        showToast("업데이트 실패: " + (errorData?.error || "알 수 없는 오류"), "error");
        return;
      }
  
      const result = await res.json();
      showToast("라이선스 수정 완료", "success");
      setIsEdit(false); // 저장 후 수정 모드 종료
      if (result.license_key) {
        setLicenseKey(result.license_key);
      }
      onUpdated?.(); // 데이터 갱신
  
    } catch (error) {
      console.error("서버 요청 중 오류 발생:", error);
      showToast("서버 오류 발생", "error");
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
              <div className="split-wrap">
                <span>라이센스 정보</span>
                <div className="split-line"></div>
              </div>
              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>등록일 :</FormLabel> <p>{new Date(license.reg_date).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'})}</p>
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>라이센스 발급일 :</FormLabel> {license.license_date === null ? "" : <p>{new Date(license.license_date).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'})}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>발급이력 :</FormLabel> <p>{license.reissuance === 1 ? '재발급' : '초기발급'}</p>
                </Box>
              </Box>

              {license.hardware_status.toUpperCase() === 'ITU' ? (
                <Box className="detail-line-box">
                  <Box className="detail-line-box-item">
                    <FormLabel>데모 발급 가능 횟수 :</FormLabel> <p>{license.demo_cnt}</p> 
                  </Box>
                  <Box className="detail-line-box-item">
                    <FormLabel>프로젝트명 :</FormLabel> 
                    {isEdit ? 
                      <TextField size="small" {...register("projectName")} /> : 
                      <p>{watch("projectName")}</p>} 
                  </Box>
                  <Box className="detail-line-box-item">
                    <FormLabel>고객사 E-mail :</FormLabel> 
                    {isEdit ? 
                      <TextField size="small" {...register("customerEmail")} /> : 
                      <p>{watch("customerEmail")}</p>}
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
                    <TextField size="small" {...register("limitTimeStart")} type="date"/> : 
                    <p>{watch("limitTimeStart")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>유효기간(만료) :</FormLabel> 
                  {isEdit ? 
                    <TextField size="small" {...register("limitTimeEnd")} type="date"/> : 
                    <p>{watch("limitTimeEnd")}</p>}
                </Box>
              </Box>

              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>발급자 :</FormLabel> 
                  {isEdit ? 
                    <TextField size="small" {...register("regUser")} /> : 
                    <p>{watch("regUser")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>담당자 :</FormLabel> 
                  {isEdit ? 
                    <TextField size="small" {...register("regRequest")} /> : 
                    <p>{watch("regRequest")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>고객사명 :</FormLabel> 
                  {isEdit ? 
                    <TextField size="small" {...register("customer")} /> : 
                    <p>{watch("customer")}</p>}
                </Box>
              </Box>
              {license.hardware_status.toUpperCase() === 'ITU' && (
                <>
                <div className="split-wrap">
                  <span>소프트웨어 옵션</span>
                  <div className="split-line"></div>
                </div>
                
                <Controller
                    control={control}
                    name="softwareOpt"
                    render={({ field }) => (
                      <Box className="detail-line-box">
                        {ituOps.map(({ label, value }) => (
                          <FormControlLabel
                            key={label}
                            control={
                              <Checkbox 
                                checked={field.value[label] === 1}
                                disabled={!isEdit}
                                onChange={(e) => {
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
                </>
              )}
              
              <div className="split-wrap">
                <span>제품 정보</span>
                <div className="split-line"></div>
              </div>
              
              <Box display="flex" alignItems="center">
                <FormLabel>제품 시리얼번호 :</FormLabel> <p>{license.hardware_serial}</p>
              </Box>
              <Box display="flex" alignItems="center">
                <FormLabel>하드웨어 인증키 :</FormLabel>
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', maxWidth: '100%' }}>
                  {license.hardware_code.length > 60 ? `${license.hardware_code.slice(0, 60)}\n${license.hardware_code.slice(60)}` : license.hardware_code}
                </p>
              </Box>
              <Box display="flex" alignItems="center">
                <FormLabel>인증키 :</FormLabel> <p>{licenseKey}</p>
              </Box>

              <div className="split-line"></div>

              <Box display="flex" justifyContent="center" gap={0.5} mt={2}>
                {role !== 1 && (
                  <Button
                    className="default-btn"
                    onClick={isEdit ? handleSubmit(onSubmit) : () => setIsEdit(true)}
                  >
                    {isEdit ? '저장' : '수정'}
                  </Button>
                )}
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