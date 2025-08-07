import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSession } from 'next-auth/react';
import { defaultOps, ituOps } from "@/app/data/config";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useToastState } from "./useToast";
import AlertModal from "./alertModal";
import { checkHardwareCode } from "@/app/api/validation";

interface LicenseDetailModalProps {
  close: () => void; // close prop 추가
  license: any; // license prop 추가
  onUpdated?: () => void;
  isLog?: boolean;
}

const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({ close, license, onUpdated, isLog = false }) => {
  const [detailData, setDetailData] = useState<any>(license);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const { showToast, ToastComponent } = useToastState();

  // role
  const { data: session } = useSession();
  const role = session?.user?.role;
  const userType = role === 4 ? 'demo' : role === 3 ? 'super' : role === 2 ? 'setting' : 'monitor';
  const name = session?.user?.name;
  const id = session?.user?.id;

  // ITU 장비 여부 판단: 시리얼 번호가 ITU로 시작하는지 확인
  const isITU = license?.hardware_serial?.startsWith("ITU");

  // ITM 장비 관리 대수
  const [itmCount, setItmCount] = useState<number>(0);

  // 라이선스 키 관리
  const [licenseDate, setLicenseDate] = useState<string>(license.license_date || "");
  const [licenseKey, setLicenseKey] = useState<string>(license.license_key || "");
  const [ip, setIp] = useState<string>(license.ip || "");

  const [showEditBtn, setShowEditBtn] = useState<boolean>(false);

  useEffect(() => {
    setLicenseDate(license.license_date || "");
    setLicenseKey(license.license_key || "");
    setIp(license.ip || "");
    setValue("regUser", license.reg_user || "");
  }, [license.license_date, license.license_key, license.ip, license.reg_user]);

  // license가 변경될 때 detailData 업데이트
  useEffect(() => {
    setDetailData(license);
  }, [license]);

  const baseSchema = z.object({
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' })
      .superRefine((value, ctx) => {
        if(userType === 'demo' && license.reg_auto === 2) {          
          const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
          if (value > today) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '유효기간(시작)은 오늘 이후로 설정할 수 없습니다.',
            });
          }
        }
      }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' })
      .superRefine((value, ctx) => {
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
        if(value > "2036-12-31") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '2036년 12월 31일까지',
          });
        }
        if(value < today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '만료일은 오늘 날짜 부터 설정할 수 있습니다.',
          });
        }
      }),
    regUser: z.string().optional(),
    regRequest: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    customer: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    hardwareSerial: z.string().optional(),
    hardwareCode: z.string().optional()
    .superRefine((value, ctx) => {     
    }), 
    projectName: z.string().optional().nullable(),
    customerEmail: z.string().optional().nullable(),
  }).superRefine((data, ctx) => {
    if (isITU) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.customerEmail && !emailRegex.test(data.customerEmail)) {
          ctx.addIssue({
            path: ['customerEmail'],
            code: z.ZodIssueCode.custom,
            message: '이메일 형식이 올바르지 않습니다.',
          });
        }
      // }
    }

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    if (data.limitTimeStart > data.limitTimeEnd) {
      ctx.addIssue({
        path: ["limitTimeEnd"],
        code: z.ZodIssueCode.custom,
        message: '유효기간을 다시 설정해주세요.',
      });
    } else if(today <= data.limitTimeEnd) {
      clearErrors("limitTimeEnd");
    }

    // 16진수 검증 (0-9, A-F, a-f만 허용)
    const hexRegex = /^[0-9A-Fa-f]{40}$/;
    if (!isITU && data.hardwareCode && data.hardwareCode.trim() !== '') {
      // 40자리 검증
      if (data.hardwareCode.length !== 40 && !hexRegex.test(data.hardwareCode)) {
        ctx.addIssue({
          path: ["hardwareCode"],
          code: z.ZodIssueCode.custom,
          message: '올바른 형식의 하드웨어 인증키가 아닙니다.',
        });
        return;
      }
    }
  })
  
  // 초기 렌더링 값 설정
  const { schema, defaultValues } = useMemo(() => {
    // 공통
    const base = {
      softwareOpt: {
        FW: detailData.license_fw === "1" ? 1 : 0,
        VPN: detailData.license_vpn === "1" ? 1 : 0,
        S2: detailData?.license_s2 === "1" ? 1 : 0,
        DPI: detailData?.license_dpi === "1" ? 1 : 0,
        AV: detailData.license_av === "1" ? 1 : 0,
        AS: detailData.license_as === "1" ? 1 : 0,
        OT: detailData.license_ot === "1" ? 1 : 0,
        ZT: detailData.license_zt === "1" ? 1 : 0,
      },
      limitTimeStart: new Date(detailData.limit_time_start).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      limitTimeEnd: new Date(detailData.limit_time_end).toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      regUser: detailData.reg_user,
      regRequest: detailData.reg_request,
      customer: detailData.customer,
      hardwareSerial: detailData.hardware_serial,
      hardwareCode: detailData.hardware_code || "",
      projectName: detailData.project_name || "",
      customerEmail: detailData.customer_email || "",
    };
    return { schema: baseSchema, defaultValues: base };
  }, [detailData]);

  const {
    control,
    register,
    handleSubmit, 
    formState: { errors },
    setError,
    clearErrors,
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues,
  });

  useEffect(() => {
    if(detailData.hardware_status.toUpperCase() === 'ITM') {
      const serials = detailData.hardware_serial.split('-')[2].slice(4, 8);
      // serials는 16진수 문자열이므로 10진수로 변환
      const serialsDecimal = parseInt(serials, 16);
      setItmCount(serialsDecimal);
    }
    if (defaultValues && detailData) {
      reset(defaultValues);
    }
  }, [defaultValues, reset, detailData]);

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
    // data와 defaultValues의 모든 값을 깊게 비교하여 동일하면 true, 아니면 false를 반환
    function deepEqual(obj1: any, obj2: any): boolean {
      if (obj1 === obj2) return true;
      if (typeof obj1 !== typeof obj2) return false;
      if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) return false;

      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) return false;

      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
      }
      return true;
    }

    const isSame = deepEqual(data, defaultValues);
    
    if (isSame) {
      showToast("변경된 내용이 없습니다.", "warning");
      return;
    }

    // if(data.hardwareCode === '' || data.hardwareCode === null || data.hardwareCode === undefined) {
    //   if(licenseKey !== '' && licenseKey !== null && licenseKey !== undefined) {
    //     showToast("하드웨어 인증키를 입력해주세요.", "warning");
    //     return;
    //   }
    // }

    if (data.hardwareCode) {
      if(data.hardwareCode !== defaultValues.hardwareCode) {

        const codeCount = await checkHardwareCode(data.hardwareCode);
        if (Number(codeCount) !== 0) {
          setError("hardwareCode", {
            type: "manual",
            message: "이미 사용 중인 하드웨어 인증키입니다.",
          });
          showToast("이미 사용 중인 하드웨어 인증키입니다.", "warning");
          return;
        }
      }
    }

    try {
      const res = await fetch('/api/license/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();

      if (res.ok) {
        const changed = []
        if(result.changedKeyInfo.length > 0) {
          changed.push(result.changedKeyInfo);
        }
        if(result.changedInfo.length > 0) {
          changed.push(result.changedInfo);
        }

        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: "addLog",
            log: [{
              hardware_serial: result.updated[0].hardware_serial,
              customer: result.updated[0].customer,
              user: name + '(' + id + ')',
              ip: '',
              action_type: 'license',
              action: "success",
              desc: (result.isITU ? "ITU" : "ITM") + (result.status === "issued_reg" ? '라이센스 발급 : ' : result.status === "reissued_reg" ? '라이센스 재발급 : ' : '라이센스 정보 수정 : ') + changed.join(', '),
            }]
          })
        });
        
        showToast("라이센스 정보 수정이 완료되었습니다.", "success");
        setIsEdit(false); // 저장 후 수정 모드 종료
        
        setDetailData(result.updated[0]);
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
            customer: data.customer,
            user: name + '(' + id + ')',
            ip: '',
            action_type: 'license',
            action: "fail",
            desc: '라이센스 정보 수정 실패',
          }]
        })
      });
      showToast("라이센스 정보 수정이 실패되었습니다.", "error");
    }
  };

  useEffect(() => {
    if(license && licenseKey !== "" && licenseKey !== null && licenseKey !== undefined && licenseKey !== license.license_key) {
      showToast(`라이센스 인증키가 변경되었습니다.\nITU 장비에서 라이센스 자동발급을 다시 해주세요.`, "info");
    }
  }, [licenseKey, license])

  useEffect(() => {
    if (!license) return;
    
    // 편집 버튼 표시 여부를 결정하는 함수
    const shouldShowEditButton = () => {
      // 로그 모드이거나 만료된 경우 편집 불가
      if (isLog) {
        return false;
      }
      
      // 슈퍼 사용자는 항상 편집 가능
      if (userType === 'super' || userType === 'setting') {
        return true;
      }
      
      // 데모 사용자는 reg_auto가 2 또는 4인 경우에만 편집 가능
      if (userType === 'demo') {
        return license.reg_auto === 2 || license.reg_auto === 4;
      }

      // 모니터 사용자는 편집 불가 
      return false;
    };
    
    setShowEditBtn(shouldShowEditButton());
  }, [license, userType, isLog]);

  function addOneMonth(dateString: string) {
    const date = new Date(dateString); 
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }); // yyyy-mm-dd 형식
  }

  // license가 없으면 렌더링하지 않음
  if (!license) {
    return null;
  }

  return (
    <form className="w-full h-full flex justify-center items-center text-13">
      <div className="w-full h-full flex justify-center items-center license-detail-modal-wrap">
        <div className="w-1/2 bg-white rounded-md">
          <div className="flex justify-between items-center p-4 border-b bg-cyan-950">
            <h2 className="text-xl font-semibold text-white">{detailData.hardware_status.toUpperCase()} {detailData.reg_auto === 2 ? "데모" : ""} 라이센스 상세보기</h2>
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
                  <FormLabel>등록일 :</FormLabel> <p>{new Date(detailData.reg_date).toLocaleString('sv-SE', {timeZone: 'Asia/Seoul'})}</p>
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>라이센스 발급일 :</FormLabel> {(!licenseDate || licenseDate === "0000-00-00") ? "" : <p>{new Date(licenseDate).toLocaleString('sv-SE', {timeZone: 'Asia/Seoul'})}</p>}
                </Box>
                <Box className="detail-line-box-item">
                  <FormLabel>발급이력 :</FormLabel> <p>{detailData.reissuance === 1 ? '재발급' : '초기발급'}</p>
                </Box>
              </Box> 

              <Box className="detail-line-box">
                <Box className="detail-line-box-item">
                  <FormLabel>유효기간(시작) :</FormLabel> 
                  {isEdit ? 
                    <TextField
                      size="small"
                      {...register("limitTimeStart")}
                      type="date"
                      error={!!errors.limitTimeStart}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue("limitTimeStart", value);
                        if (userType === 'demo') {
                          if (value) {
                            setValue("limitTimeEnd", addOneMonth(value));
                          }
                        }
                        trigger();
                      }}
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
                      disabled={userType === 'demo'}
                    /> : 
                    <p>{watch("limitTimeEnd")}</p>}
                </Box> 
                <Box className="detail-line-box-item">
                  <FormLabel>상태 :</FormLabel> <p>{detailData.reg_auto === 0 ? '수동 발급' : detailData.reg_auto === 1 ? '자동 발급' : detailData.reg_auto === 2 ? '데모 발급' : detailData.reg_auto === 3 ? '미발급' : '만료'}</p> 
                </Box> 
              </Box>

              <Box className="detail-line-box">                  
                <Box className="detail-line-box-item">
                {detailData.hardware_status.toUpperCase() === 'ITU' ? (
                  <>
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
                    <p>{watch("projectName")}</p>
                  } 
                  </>
                ) : (
                  <>
                    <FormLabel>관리 대수 :</FormLabel> <p>{itmCount}</p>
                  </>
                )}
                </Box>
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
                  <FormLabel>IP :</FormLabel> <p>{ip}</p>
                </Box> 
              </Box> 

              <Box className="detail-line-box">
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
                
                <Box className="detail-line-box-item">
                  {detailData.hardware_status.toUpperCase() === 'ITU' ? (
                    <>
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
                    </>
                  ) : (
                    <>
                    {/* <FormLabel>CFID :</FormLabel> <p>{detailData.cfid}</p> */}
                    </>
                  )}
                  </Box>
              </Box>
              {detailData.hardware_status.toUpperCase() === 'ITU' && (
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
                <FormLabel>제품 시리얼번호 :</FormLabel> <p>{detailData.hardware_serial}</p>
              </Box>
              <Box display="flex" alignItems="center">
                <FormLabel>하드웨어 인증키 :</FormLabel>
                {isEdit ? 
                  <TextField
                    size="small"
                    sx={{ width: 600 }}
                    {...register("hardwareCode", {
                      onChange: (e) => {
                        const value = e.target.value;
                        setValue('hardwareCode', value.trim());
                      }
                    })}
                    error={!!errors.hardwareCode}
                  /> : 
                  <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', maxWidth: '100%' }}>
                    {(() => {
                      const code = watch("hardwareCode");
                      return code && code.length > 60 ? `${code.slice(0, 60)}\n${code.slice(60)}` : code;
                    })()}
                  </p>
                }
              </Box>
              <Box display="flex" alignItems="center">
                <FormLabel>인증키 :</FormLabel> <p>{licenseKey}</p>
              </Box>

              <div className="split-line"></div>

              <Box display="flex" justifyContent="center" gap={0.5} mt={2}>
                {showEditBtn && (
                  <Button
                    className="default-btn"
                    onClick={() => isEdit ? setIsEditModalOpen(true) : setIsEdit(true)}
                  >
                    {isEdit ? '저장' : '수정'}
                  </Button>
                )}
                <Button className="close-text-btn" onClick={close}>
                  {isEdit ? '취소' : '닫기'}
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