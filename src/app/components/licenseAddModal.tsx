import { useState, useEffect } from "react";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, styled, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";

// 데이터
import { defaultOps, ituOps } from "@/app/data/config";
import { checkHardwareCode } from "@/app/api/validation";

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
    hardwareStatus: z.enum(["ITU", "ITM", "XTM", "SMC"]),
    hardwareCode: z.string()
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
      })
      .refine(async (value) => {
        const count = await checkHardwareCode(value);
        console.log("count: ", count);
        return Number(count) === 0; // 중복이 없을 경우
      }, { message: '이미 사용 중인 제품 시리얼 번호입니다.' }),
    softwareOpt: z.record(z.number()),
    limitTimeStart: z.string().min(1, { message: '유효기간(시작)을 입력해주세요.' }),
    limitTimeEnd: z.string().min(1, { message: '유효기간(만료)을 입력해주세요.' }),
    issuer: z.string().optional(),
    manager: z.string().min(1, { message: '발급요청사를 입력해주세요.' }),
    cpuName: z.string(),
    siteName: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    cfid: z.string(),
    regInit: z.string().optional(),
  }).superRefine((data, ctx) => {
    const { hardwareStatus, cfid, cpuName } = data;
    const isITU = hardwareStatus === 'ITU';
    const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;

    if (!cpuName || cpuName.trim() === '') {
      ctx.addIssue({
        path: ["cpuName"],
        code: z.ZodIssueCode.custom,
        message: isITU ? '프로젝트명을 입력해주세요.' : 'CPU명을 입력해주세요.',
      });
    }
    
    if (!cfid || cfid.trim() === '') {
      ctx.addIssue({
        path: ["cfid"],
        code: z.ZodIssueCode.custom,
        message: isITU ? '고객사 E-mail을 입력해주세요.' : 'CF ID를 입력해주세요.',
      });
      return;
    }

    if (isITU) {
      if (!emailRegex.test(cfid)) {
        ctx.addIssue({
          path: ["cfid"],
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
    reset,
    clearErrors,
    watch,
    trigger,
    formState: { dirtyFields }
  } = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: 'onChange',
    defaultValues: {
      hardwareStatus: "ITU",
      hardwareCode: "",
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
      limitTimeStart: new Date().toLocaleDateString('sv-SE', {timeZone: 'Asia/Seoul'}),
      limitTimeEnd: "2036-12-31",
      issuer: "",
      manager: "",
      cpuName: "",
      siteName: "",
      cfid: "",
      regInit: "",
    },
  });

  // "ITU", "ITM", "XTM", "SMC" 토글 변경 시 입력 값이 없으면 오류 초기화, 입력 값이 있으면 유효성 검사 다시 실행
  const fieldsToCheck = ["hardwareCode", "manager", "cpuName", "siteName", "cfid"] as const;

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

  const onSubmit = async (data: z.infer<typeof addSchema>) => {
    
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
    console.log("onsubmit: ", data);

    const res = await fetch('/api/license/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    console.log("result: ", result);

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
                {["ITU", "ITM", "XTM", "SMC"].map((type) => (
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
                inputProps={{ maxLength: 24 }}
                error={errors.hardwareCode !== undefined}
                helperText={errors.hardwareCode?.message}
                {...register('hardwareCode', {
                  onChange: (e) => {
                    const value = e.target.value.trim();
                    setValue('hardwareCode', value);
                  }
                })}
              />
              {textFieldTooltip(`ITU : ITU201AXXXXXXXXXXXXXXXXX (24 codes)\nITM : 3XXXXX-XXXXXX-XXXXXXXX[-N]\n(대소문자구분 22 codes | 번호추가[-N] 시 24 codes)`)}
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span>&nbsp;&nbsp;</span>소프트웨어 옵션
              </FormLabel>
              <Controller
                control={control}
                name="softwareOpt"
                render={({ field }) => (
                  <FormGroup className="flex flex-wrap justify-between" style={{ flexDirection: 'row' }}>
                    {(selectedHardware === 'ITU' ? ituOps : defaultOps).map((item) => (
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
                          />
                        }
                        label={item.label}
                      />
                    ))}
                  </FormGroup>
                )}
              />
            </Box>

            <Box display="flex" alignItems="center" >
              <FormLabel>
                <span className="text-red-500">*</span> 유효기간(시작)
              </FormLabel>
              <TextField
                className="add-license-half-width" 
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
                className="add-license-half-width"
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
                {...register('issuer')} 
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 발급요청사
              </FormLabel>
              <TextField 
                size="small" 
                error={errors.manager !== undefined}
                helperText={errors.manager?.message}
                {...register('manager')}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> {selectedHardware === "ITU" ? "프로젝트명" : "CPU명"}
              </FormLabel>  
              <TextField 
                size="small" 
                error={errors.cpuName !== undefined}
                helperText={errors.cpuName?.message}
                {...register('cpuName')}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> 고객사명
              </FormLabel>
              <TextField 
                size="small" 
                error={errors.siteName !== undefined}
                helperText={errors.siteName?.message}
                {...register('siteName')}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span className="text-red-500">*</span> {selectedHardware === "ITU" ? "고객사 E-mail" : "CF ID"}
              </FormLabel>
              <TextField 
                size="small" 
                error={errors.cfid !== undefined}
                helperText={errors.cfid?.message}
                {...register('cfid')} 
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel>
                <span>&nbsp;&nbsp;</span>하드웨어 인증키
              </FormLabel>
              <TextField 
                size="small" 
                {...register('regInit')}
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