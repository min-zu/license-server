import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSession } from 'next-auth/react';
import { defaultOps, ituOps } from "@/app/data/config";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useToastState } from "./useToast";
import AlertModal from "./alertModal";

interface LicenseDetailModalProps {
  close: () => void; // close prop 추가
  license: any; // license prop 추가
  onUpdated?: () => void;
}

const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({ close, license, onUpdated }) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const { showToast, ToastComponent } = useToastState();

  // role
  const { data: session } = useSession();
  const role = session?.user?.role;
  const id = session?.user?.id;

  // ITU 장비 여부 판단: 시리얼 번호가 ITU로 시작하는지 확인
  const isITU = license?.hardware_serial?.startsWith("ITU");

  // 라이선스 키 관리
  const [licenseDate, setLicenseDate] = useState<string>(license.license_date || "");
  const [licenseKey, setLicenseKey] = useState<string>(license.license_key || "");
  const [ip, setIp] = useState<string>(license.ip || "");

  useEffect(() => {
    setLicenseDate(license.license_date || "");
    setLicenseKey(license.license_key || "");
    setIp(license.ip || "");
  }, [license.license_date, license.license_key, license.ip]);

  const baseSchema = z.object({
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    regUser: z.string().optional(),
    regRequest: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    customer: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    hardwareSerial: z.string().optional(),
    hardwareCode: z.string().optional(),
    projectName: z.string().optional().nullable(),
    customerEmail: z.string().optional().nullable(),
  }).superRefine((data, ctx) => {
    if (isITU) {
      if (!data.projectName || data.projectName.trim() === "") {
        ctx.addIssue({
          path: ['projectName'],
          code: z.ZodIssueCode.custom,
          message: '프로젝트명을 입력해주세요.',
        });
      }
      if (!data.customerEmail || data.customerEmail.trim() === "") {
        ctx.addIssue({
          path: ['customerEmail'],
          code: z.ZodIssueCode.custom,
          message: '고객사 E-mail을 입력해주세요.',
        });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.customerEmail)) {
          ctx.addIssue({
            path: ['customerEmail'],
            code: z.ZodIssueCode.custom,
            message: '이메일 형식이 올바르지 않습니다.',
          });
        }
      }
    }
    const start = new Date(data.limitTimeStart);
    const end = new Date(data.limitTimeEnd);

    if (start > end) {
      ctx.addIssue({
        path: ['limitTimeStart'],
        code: z.ZodIssueCode.custom,
        message: '유효기간(시작)이 만료일보다 늦을 수 없습니다.',
      });
      ctx.addIssue({
        path: ['limitTimeEnd'],
        code: z.ZodIssueCode.custom,
        message: '유효기간(만료)은 시작일 이전일 수 없습니다.',
      });
    }
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
        ZT: license.license_zt === "1" ? 1 : 0,
      },
      limitTimeStart: new Date(license.limit_time_start).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      limitTimeEnd: new Date(license.limit_time_end).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      regUser: license.reg_user,
      regRequest: license.reg_request,
      customer: license.customer,
      hardwareSerial: license.hardware_serial,
      hardwareCode: license.hardware_code,
      projectName: license.project_name || "",
      customerEmail: license.customer_email || "",
    };

    return { schema: baseSchema, defaultValues: base };
  }, [license]);

  const {
    control,
    register,
    handleSubmit, 
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const isOptionDisabled = (isEdit: boolean, field: any, label: string, value: string) => {
    if(!isEdit) return true;

    if (field.value['OT'] === 1) {
      if (value !== 'ot' && value !== 'fw') {
        field.value[label] = 0;
        return true;
      } 
    }

    if (field.value['VPN'] === 1 || field.value['S2'] === 1 || field.value['DPI'] === 1 || field.value['AV'] === 1 || field.value['AS'] === 1 || field.value['ZT'] === 1) {
      if (value === 'ot') {
        field.value['OT'] = 0;
        return true;
      }
    }
    return false;
  }

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
  
      // if (!res.ok) {
      //   const errorData = await res.json();
      //   console.error("업데이트 실패:", errorData);
      //   showToast("업데이트 실패: " + (errorData?.error || "알 수 없는 오류"), "error");
      //   return;
      // }
  
      const result = await res.json();
      
      if (res.ok) {
        if (result.status === "reissued") {
          await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              state: "addLog",
              log: [{
                hardware_serial: result.updated[0].hardware_serial,
                user: id,
                action: "edit",
                desc: '소프트웨어 옵션 수정으로 인한 라이센스 키 재발급',
              }]
            })
          });
        }
        
        showToast("라이센스 정보 수정이 완료되었습니다.", "success");
        setIsEdit(false); // 저장 후 수정 모드 종료
        setLicenseDate(result.updated[0].license_date);
        setLicenseKey(result.updated[0].license_key);
        setIp(result.updated[0].ip);
        onUpdated?.(); // 데이터 갱신
      }
        
    } catch (error) {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: "addLog",
          log: [{
            hardware_serial: data.hardwareSerial,
            user: id,
            action: "fail",
            desc: '라이센스 정보 수정 실패',
          }]
        })
      });
      showToast("라이센스 정보 수정이 실패되었습니다.", "error");
    }
  };

  useEffect(() => {
    if(licenseKey !== license.license_key) {
      showToast(`라이센스 인증키가 변경되었습니다.\nITU 장비에서 라이센스 자동발급을 다시 해주세요.`, "info");
    }
  }, [licenseKey])

  return (
    <form className="w-full h-full flex justify-center items-center text-13">
      <div className="w-full h-full flex justify-center items-center license-detail-modal-wrap">
        <div className="w-1/2 bg-white rounded-md">
          <div className="flex justify-between items-center p-4 border-b bg-cyan-950">
            <h2 className="text-xl font-semibold text-white">{license.hardware_status.toUpperCase()} 라이센스 상세보기</h2>
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
                  <FormLabel>라이센스 발급일 :</FormLabel> {licenseDate === null ? "" : <p>{new Date(licenseDate).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'})}</p>}
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
                      <TextField
                        size="small"
                        {...register("projectName", {
                          onChange: (e) => {
                            const value = e.target.value;
                            setValue('projectName', value.trim());
                          }
                        })}
                        error={!!errors.projectName}
                      /> : 
                      <p>{watch("projectName")}</p>} 
                  </Box>
                  <Box className="detail-line-box-item">
                    <FormLabel>고객사 E-mail :</FormLabel> 
                    {isEdit ? 
                      <TextField
                        size="small"
                        {...register("customerEmail", {
                          onChange: (e) => {
                            const value = e.target.value;
                            setValue('customerEmail', value.trim());
                          }
                        })}
                        error={!!errors.customerEmail}
                      /> : 
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
                  <FormLabel>IP :</FormLabel> <p>{ip}</p>
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>유효기간(시작) :</FormLabel> 
                  {isEdit ? 
                    <TextField
                      size="small"
                      {...register("limitTimeStart")}
                      type="date"
                      error={!!errors.limitTimeStart}
                    /> : 
                    <p>{watch("limitTimeStart")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>유효기간(만료) :</FormLabel> 
                  {isEdit ? 
                    <TextField
                      size="small"
                      {...register("limitTimeEnd")}
                      type="date"
                      error={!!errors.limitTimeEnd}
                    /> : 
                    <p>{watch("limitTimeEnd")}</p>}
                </Box>
              </Box>

              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>발급자 :</FormLabel> 
                  {isEdit ? 
                    <TextField
                      size="small"
                      {...register("regUser", {
                        onChange: (e) => {
                          const value = e.target.value;
                          setValue('regUser', value.trim());
                        }
                      })}
                      error={!!errors.regUser}
                    /> : 
                    <p>{watch("regUser")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>발급요청사(총판사) :</FormLabel> 
                  {isEdit ? 
                    <TextField
                      size="small"
                      {...register("regRequest", {
                        onChange: (e) => {
                          const value = e.target.value;
                          setValue('regRequest', value.trim());
                        }
                      })}
                      error={!!errors.regRequest}
                    /> : 
                    <p>{watch("regRequest")}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>고객사명 :</FormLabel> 
                  {isEdit ? 
                    <TextField
                      size="small"
                      {...register("customer", {
                        onChange: (e) => {
                          const value = e.target.value;
                          setValue('customer', value.trim());
                        }
                      })}
                      error={!!errors.customer}
                    /> : 
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
                                disabled={isOptionDisabled(isEdit, field, label, value)}
                                onChange={(e) => {
                                  const newValue = e.target.checked ? { ...field.value, [label]: 1 } : { ...field.value, [label]: 0 };
                                  field.onChange(newValue);
                                }}
                              />
                            }
                            label={value === 's2' ? '행안부' : value === 'ot' ? '산업용 프로토콜' : value === 'zt' ? 'ITUz' : label}
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
                    onClick={() => isEdit ? setIsEditModalOpen(true) : setIsEdit(true)}
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
      <AlertModal
        open={isEditModalOpen}
        close={() => setIsEditModalOpen(false)}
        state="edit"
        title="라이센스 수정"
        message={`수정사항을 적용 하시겠습니까?`}
        onConfirm={() => {
          handleSubmit(
            onSubmit,
            (errors) => {
              if (Object.keys(errors).length > 0) {
                showToast(String(Object.values(errors)[0]?.message ?? "라이센스 수정 정보를 확인해주세요."), "warning");
              }
            }
          )();
        }}
      />
    {ToastComponent}
    </form>
  )
}

export default LicenseDetailModal;