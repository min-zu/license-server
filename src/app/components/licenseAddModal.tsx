import { useState, useEffect } from "react";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, styled, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";

// 데이터
import { defaultOps, ituOps } from "@/app/data/config";
import { checkHardwareSerial } from "@/app/api/validation";

// form
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// toast
import { useToastState } from "@/app/components/useToast";

export default function LicenseAddModal({ close, onUpdated }: { close: () => void, onUpdated: () => void }) {
  // 입력값
  const [selectedHardware, setSelectedHardware] = useState("ITU");
  // 토스트 상태
  const { showToast, ToastComponent } = useToastState();

  // const defaultOps = ['FW', 'VPN', 'SSL', 'IPS', 'WAF', 'AV', 'AS', 'Tracker'];
  // const ituOps = ['FW', 'VPN', '행안부', 'DPI', 'AV', 'AS'];

  const [isContinue, setIsContinue] = useState(false);

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
    hardwareStatus: z.enum(["ITU", "ITM"]),
    hardwareSerial: z.string()
      .min(1, { message: '제품 시리얼 번호를 입력해주세요.' })
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, { message: '제품 시리얼 번호는 영문과 숫자를 각각 1개 이상 포함해야 합니다.' })
      .superRefine((value, ctx) => {
        const trimmed = value.trim();
        const codes = trimmed.split('-').length >= 3;
      
        if (codes && trimmed.length < 22) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '제품 시리얼 번호는 22자 이상이어야 합니다.',
          });
        } else if (!codes && trimmed.length !== 24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '제품 시리얼 번호는 24자입니다.',
          });
        }
      }),
      // .refine(async (value) => {
      //   const trimmed = value.trim();
      //   const codes = trimmed.split('-').length >= 3;
      //   const isValidLength = (codes && trimmed.length >= 22) || (!codes && trimmed.length === 24);

      //   if (!isValidLength) return true; // 조건 안 맞으면 중복 체크는 안 함

      //   const count = await checkHardwareCode(value);
      //   return Number(count) === 0;
      // }, { message: '이미 사용 중인 제품 시리얼 번호입니다.' }),
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' })
      .superRefine((value, ctx) => {
        const startDate = getValues('limitTimeStart');
        const endDate = new Date(value);
        
        if (value <= startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '만료일을 확인해주세요.',
          });
        }
      }),
    regUser: z.string().optional(),
    regRequest: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    customer: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    projectName: z.string(),
    customerEmail: z.string(),
    hardwareCode: z.string().optional(),
  }).superRefine((data, ctx) => {
    const { hardwareStatus, customerEmail, projectName } = data;
    const isITU = hardwareStatus === 'ITU';
    const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;

    if (!projectName || projectName.trim() === '') {
      ctx.addIssue({
        path: ["projectName"],
        code: z.ZodIssueCode.custom,
        message: isITU ? '프로젝트명을 입력해주세요.' : 'CPU명을 입력해주세요.',
      });
    }
    
    if (!customerEmail || customerEmail.trim() === '') {
      ctx.addIssue({
        path: ["customerEmail"],
        code: z.ZodIssueCode.custom,
        message: isITU ? '고객사 E-mail을 입력해주세요.' : 'CF ID를 입력해주세요.',
      });
      return;
    }

    if (isITU) {
      if (!emailRegex.test(customerEmail)) {
        ctx.addIssue({
          path: ["customerEmail"],
          code: z.ZodIssueCode.custom,
          message: '이메일 형식이 올바르지 않습니다.',
        })
      }
    }
  });

  const {
    control,
    register,
    handleSubmit, 
    formState: { errors },
    setValue,
    setError,
    reset,
    clearErrors,
    watch,
    trigger,
    getValues,
    formState: { dirtyFields }
  } = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: 'onChange',
    defaultValues: {
      hardwareStatus: "ITU",
      hardwareSerial: "",
      softwareOpt: {  
        // FW: 0,
        // VPN: 0,
        // S2: 0,
        // DPI: 0,
        // AV: 0,
        // AS: 0,
        // OT: 0,
      },
      limitTimeStart: new Date().toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      limitTimeEnd: "2036-12-31",
      regUser: "",
      regRequest: "",
      customer: "",
      projectName: "",
      customerEmail: "",
      hardwareCode: "",
    },
  });

  // "ITU", "ITM" 토글 변경 시 입력 값이 없으면 오류 초기화, 입력 값이 있으면 유효성 검사 다시 실행
  const fieldsToCheck = ["hardwareSerial", "regRequest", "customer", "projectName", "customerEmail"] as const;

  useEffect(() => {
  const subscription = watch((_value, { name }) => {
    if (name === "hardwareStatus") {
      fieldsToCheck.forEach(field => {
        if (dirtyFields[field]) {
          trigger(field);
        } else {
          clearErrors(field);
        }
      });
    }
  });
    return () => subscription.unsubscribe();
  }, [watch, trigger, clearErrors, dirtyFields]);

  const isOptionDisabled = (softwareOpt: Record<string, number>, option: { value: string }) => {
    console.log('softwareOpt', softwareOpt)
    console.log('option', option)
    if (softwareOpt['ot'] === 1) {
      if (option.value !== 'ot' && option.value !== 'fw') {
        softwareOpt[option.value] = 0;
        return true;
      } 
    }

    if (softwareOpt['vpn'] === 1 || softwareOpt['s2'] === 1 || softwareOpt['dpi'] === 1 || softwareOpt['av'] === 1 || softwareOpt['as'] === 1) {
      if (option.value === 'ot') {
        softwareOpt['ot'] = 0;
        return true;
      }
    }
    return false;
  };

  const onSubmit = async (data: z.infer<typeof addSchema>) => {

    const count = await checkHardwareSerial(data.hardwareSerial);
    if (Number(count) !== 0) {
      // 사용자에게 중복 메시지 보여주기
      setError("hardwareSerial", {
        type: "manual",
        message: "이미 사용 중인 제품 시리얼 번호입니다.",
      });
      return;
    }
    
    const updatedSoftwareOpt = { ...data.softwareOpt };
    if(data.hardwareStatus === "ITU") {
      const ituValues = ituOps.map(option => option.value);
      ituValues.forEach(label => {
        if (!(label in updatedSoftwareOpt)) {
          updatedSoftwareOpt[label] = 0; // 기본값으로 0 추가
        }
      });
    }
    // 업데이트된 소프트웨어 옵션을 데이터에 다시 설정
    data.softwareOpt = updatedSoftwareOpt;

    const res = await fetch('/api/license/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.success) {
      onUpdated();
      reset();

      if(!isContinue) close();
    }
    // showToast("라이센스 등록 완료", "success");

  };

  return ( 
    <>
    
    <form className="w-full h-full flex justify-center items-center text-13" onSubmit={handleSubmit(onSubmit)}>
      <div className="w-1/2 bg-white rounded-md">
        {ToastComponent}
        <div className="flex justify-between items-center p-4 border-b bg-cyan-950">
          <h2 className="text-xl font-semibold text-white">라이센스 등록</h2>
          <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
        </div>
        <div className="flex flex-col gap-4 p-10">
          <Box className="add-license-form">
            <Box display="flex" alignItems="center"> 
              <FormLabel>
                <span className="text-red-500">*</span> 장비 선택
              </FormLabel>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={selectedHardware}
                onChange={(e, value) => {
                  if (value) {
                    setSelectedHardware(value);
                    setValue("hardwareStatus", value);
                  }
                }}
              >
                {["ITU", "ITM"].map((type) => (
                  <ToggleButton key={type} value={type}>{type}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 제품 시리얼 번호
              </FormLabel>
              <TextField 
                size="small" 
                // inputProps={{ maxLength: 24 }}
                error={errors.hardwareSerial !== undefined}
                helperText={errors.hardwareSerial?.message}
                {...register('hardwareSerial', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('hardwareSerial', value.replace(/\s/g, ''));
                  }
                })}
              />
              {textFieldTooltip(`ITU : ITU201AXXXXXXXXXXXXXXXXX (24 codes)\nITM : 3XXXXX-XXXXXX-XXXXXXXX[-N]\n(대소문자구분 22 codes | 번호추가[-N] 시 24 codes)`)}
            </Box>
            
            {selectedHardware === 'ITU' && (
              <Box display="flex" alignItems="center">
                <FormLabel>
                  <span>&nbsp;&nbsp;</span>소프트웨어 옵션
              </FormLabel>
              <Controller
                control={control}
                name="softwareOpt"
                render={({ field }) => (
                  <FormGroup className="flex flex-wrap justify-between" style={{ flexDirection: 'row' }}>
                    {ituOps.map((item) => (
                      <FormControlLabel
                        key={item.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={field.value[item.value] === 1}
                            onChange={(e) => {
                              const newValue = e.target.checked ? { ...field.value, [item.value]: 1 } : { ...field.value, [item.value]: 0 };
                              field.onChange(newValue);
                            }}
                            disabled={isOptionDisabled(field.value, item)}
                          />
                        }
                        label={item.value === 's2' ? '행안부' : item.value === 'ot' ? '산업용 프로토콜' : item.label}
                      />
                    ))}
                  </FormGroup>
                )}
              />
              </Box>
            )}

            <Box display="flex" alignItems="center" >
              <FormLabel>
                <span className="text-red-500">*</span> 유효기간(시작)
              </FormLabel>
              <TextField
                className="add-license-half-width add-date-input" 
                size="small"
                type="date"
                error={errors.limitTimeStart !== undefined}
                helperText={errors.limitTimeStart?.message}
                {...register('limitTimeStart')}
              />

              <FormLabel>
                <span className="text-red-500">*</span> 유효기간(만료)
              </FormLabel>
              <TextField
                className="add-license-half-width add-date-input"
                size="small"
                type="date"
                error={errors.limitTimeEnd !== undefined}
                helperText={errors.limitTimeEnd?.message}
                {...register('limitTimeEnd')}
              />
              {textFieldTooltip('만료일은 최대 2036년 12월 31일까지 가능합니다.')}
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel> 
                <span>&nbsp;&nbsp;</span>발급자
              </FormLabel>
              <TextField 
                size="small" 
                {...register('regUser', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('regUser', value.trim());
                  }
                })} 
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 발급요청사
              </FormLabel>
              <TextField 
                size="small" 
                error={errors.regRequest !== undefined}
                helperText={errors.regRequest?.message}
                {...register('regRequest', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('regRequest', value.trim());
                  }
                })}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> {selectedHardware === "ITU" ? "프로젝트명" : "CPU명"}
              </FormLabel>  
              <TextField 
                size="small" 
                error={errors.projectName !== undefined}
                helperText={errors.projectName?.message}
                {...register('projectName', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('projectName', value.trim());
                  }
                })}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 고객사명
              </FormLabel>
              <TextField 
                size="small" 
                error={errors.customer !== undefined}
                helperText={errors.customer?.message}
                {...register('customer', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('customer', value.trim());
                  }
                })}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> {selectedHardware === "ITU" ? "고객사 E-mail" : "CF ID"}
              </FormLabel>
              <TextField 
                size="small" 
                error={errors.customerEmail !== undefined}
                helperText={errors.customerEmail?.message}
                {...register('customerEmail', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('customerEmail', value.trim());
                  }
                })}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span>&nbsp;&nbsp;</span>하드웨어 인증키
              </FormLabel>
              <TextField 
                size="small" 
                {...register('hardwareCode', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('hardwareCode', value.replace(/\s/g, ''));
                  }
                })}
              />
              {textFieldTooltip('수동 발급시에만 입력하세요!')}
            </Box>

            <Box display="flex" justifyContent="center" gap={0.5} mt={2}>
              <Button type="submit" className="default-btn" onClick={() => setIsContinue(true)} > 
                계속 등록
              </Button>
              <Button type="submit" className="default-btn" onClick={() => setIsContinue(false)}>
                등록
              </Button>
              <Button className="close-text-btn" onClick={close}>
                취소
              </Button>
            </Box>
          </Box>
        </div>
      </div>
    </form>
    </>
  )
}