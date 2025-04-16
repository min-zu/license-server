'use client'

import React from "react";
import { useState, useEffect } from 'react';
import { Admin } from "../main/admin/page";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormLabel, Grid2, Switch, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { checkIdDuplicate, ValidEmail, ValidID, ValidName, ValidPhone, ValidPW } from "@/app/api/validation";
import { useToastState } from "./useToast";
import { Session } from "next-auth";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    mode?: "add" | "self" | "other";
    onAdded?: () => void;
    target?:Admin;
    session?: Session | null;
  }

export default function UpsertModal({ open, onClose, mode, onAdded, target, session }: ModalProps) {
  // ToastAlert
  const { showToast, ToastComponent } = useToastState();

  // ID
  const [id, setId] = useState("");
  const [idFormatError, setIdFormatError] = useState<string | null>(null);
  const [idDupMessage, setIdDupMessage] = useState<string | null>(null);
  const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
  
  // 관리자 권한
  const [role, setRole] = useState<number>(2);

  // 계정 활성화
  const [status, setStatus] = useState<number>();

  // 비밀번호
  const [passwd, setPasswd] = useState("");
  const [passwdError, setPasswdError] = useState<string | null>(null);

  // 비밀번호 확인
  const [confirmPasswd, setConfirmPasswd] = useState("");
  const [confirmPasswdMessage, setConfirmPasswdMessage] = useState<string | null>(null);
  const [confirmPasswdValid, setConfirmPasswdValid] = useState<boolean | null>(null);

  // 이름
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  // 연락처
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // 이메일
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const isChanged =
  (mode === "other" && target && (
    name !== (target.name ?? "") ||
    phone !== (target.phone ?? "") ||
    email !== (target.email ?? "") ||
    role !== target.role ||
    status !== target.status ||
    passwd.trim() !== "" && confirmPasswd.trim() !== ""
  )) ||
  (mode === "self" && session?.user && (
    name !== (session.user.name ?? "") ||
    phone !== (session.user.phone ?? "") ||
    email !== (session.user.email ?? "") ||
    passwd.trim() !== "" && confirmPasswd.trim() !== ""
  ));

  // 확인 또는 수정 버튼 막기 조건
  const disableSubmit =
  mode === 'add'
    ? (
      id.trim() === "" ||
      passwd.trim() === "" ||
      confirmPasswd.trim() === "" ||
      !!idFormatError ||
      isIdAvailable !== true ||
      !!passwdError ||
      confirmPasswdValid === false ||
      !!nameError ||
      !!phoneError ||
      !!emailError
      )
    : (
      (passwd !== "" || confirmPasswd !== "") && 
      (passwd.trim() === "" ||
      confirmPasswd.trim() === "" ||
      !!passwdError ||
      confirmPasswdValid === false) ||
      !!nameError ||
      !!phoneError ||
      !!emailError ||
      !!!isChanged
    )

  // 권한 핸들러
  const handleAdminChange = (_: any, newRole: number) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  // 활성화 핸들러
  const handleStatusChange = (_: any, checked: boolean) => {
    setStatus(checked ? 1 : 0); // true: 1(계정 활성화), false: 0(계정 비활성화)
  };
  
  // 모달이 열릴 때 폼 초기화 및 mode에 따라 사용자 정보 설정 ('add' | 'self' | 'other')
  useEffect(() => {
    if (!open) return;
  
    setPasswd("");
    setPasswdError(null);
  
    setConfirmPasswd("");
    setConfirmPasswdMessage(null);
    setConfirmPasswdValid(null);
  
    setName("");
    setNameError(null);
  
    setPhone("");
    setPhoneError(null);
  
    setEmail("");
    setEmailError(null);
  
    if (mode === "add") {
      setId("");
      setIdFormatError(null);
      setIdDupMessage(null);
      setIsIdAvailable(null);
      setRole(2);
    } else if (mode === "self" && session?.user) {
      setId(session.user.id);
      setRole(session.user.role);
      setName(session.user.name ?? "");
      setPhone(session.user.phone ?? "");
      setEmail(session.user.email ?? "");
    } else if (mode === "other" && target) {
      setId(target.id);
      setRole(target.role);
      setName(target.name ?? "");
      setPhone(target.phone ?? "");
      setEmail(target.email ?? "");
      setStatus(target.status ?? 1);
    }
  }, [open, mode, session, target]);

  return (
    <React.Fragment>
      {/* ToastAlert */}
      {ToastComponent}
      
      {/* Modal */}
      <Dialog
        open={open}
        maxWidth={false}
        slotProps={{
          paper: {
            component: 'form',
            sx: { maxWidth: "900px", minWidth: '50%' },
            onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();

              let method = "";
              if (mode === 'add') {
                method = "POST";
              } else {
                method = "PUT"
              }

              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries((formData as any).entries());

              try {
                const res = await fetch("/api/admin", {
                  method,
                  headers: {"Content-Type": "application/json",},
                  body: JSON.stringify(formJson),
                });
            
                const result = await res.json();
            
                if (!result.success) {
                  showToast(`${mode === "add" ? "등록" : "수정"} 실패: ${result.error}`, "error");
                  return;
                }
                
                if (mode === "self") {
                  onAdded?.();
                }

                onAdded?.();
                onClose();
              } catch (err) {
                console.error("전송 실패:", err);
                showToast("네트워크 오류가 발생했습니다.", "error");
              }
            },
          },
        }}
      >
      
        <div className="flex justify-between items-center p-4 border-b bg-cyan-950">
          <h2 className="text-xl font-semibold text-white">{mode === "add" ? "계정 등록" : "정보 수정"} </h2>
          <Button className="close-btn" onClick={onClose}><span style={{color:'#fff'}}>X</span></Button>
        </div>

        {/* <DialogTitle className="bg-cyan-950 text-white">
          {mode === "add" ? "계정 등록" : "정보 수정"} 
          <Button className="close-btn" onClick={onClose}><span style={{ color: '#fff' }}>X</span></Button>
        </DialogTitle> */}

        
        <div className="flex flex-col gap-2 p-10">
          <Box className="admin-form">
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}> 
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  {mode === "add" ? (<><span style={{ color: 'red' }}>*</span> 아이디</>) : ("아이디")}
                </FormLabel>
                  {mode === "add" ? (
                    <>
                    <TextField
                      name="id"
                      size="small"
                      placeholder="영문, 영문 숫자 혼합 4~32자"
                      value={id}
                      onChange={(e) => {
                        setId(e.target.value);
                        setIdFormatError(null);
                        setIdDupMessage(null);
                        setIsIdAvailable(null);
                      }}
                      onBlur={async () => {
                        if (id.trim() === "") {
                          setIdFormatError(null);
                          setIdDupMessage(null);
                          setIsIdAvailable(null);
                          return;
                        }
                        const format = ValidID(id);
                        if (format !== true) {
                          setIdFormatError(format);
                          setIsIdAvailable(false);
                          return;
                        }
                        const dupMsg = await checkIdDuplicate(id);
                        console.log(dupMsg);
                        if(dupMsg === '0') {
                          setIdDupMessage("");
                          setIsIdAvailable(true);
                        } else {
                          setIdDupMessage("이미 사용 중인 아이디");
                          setIsIdAvailable(false);
                        }
                      }}
                      error={!!idFormatError || isIdAvailable === false}
                      helperText={idFormatError ? idFormatError : idDupMessage}
                    />
                    </>
                ) : (
                  <>
                    <TextField
                      name="id"
                      size="small"
                      value={id}
                      disabled
                    />
                    <input type="hidden" name="id" value={id || ""} />
                  </>
                )}
              </Box>

              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  {mode === 'add' ? (<><span>&nbsp;&nbsp;</span>관리자 유형</>) : ("관리자 유형")}
                </FormLabel>
                <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={handleAdminChange}
                >
                  {mode === 'self'
                    ? [<ToggleButton selected disabled value={role} size="small">{role === 2 ? '설정 관리자' : '모니터 관리자'}</ToggleButton>]
                    : [
                      <ToggleButton value={2} size="small">설정 관리자</ToggleButton>,
                      <ToggleButton value={1} size="small">모니터 관리자</ToggleButton>
                    ]
                  }
                </ToggleButtonGroup>
                <input type="hidden" name="role" value={role || ""} />
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}> 
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  {mode === "add" ? (<><span style={{ color: 'red' }}>*</span> 비밀번호</>) : ("비밀번호")}
                </FormLabel>
                <TextField 
                  type="password" 
                  name="passwd" 
                  size="small"
                  placeholder="영문 대/소문자, 숫자, 특수문자 포함, 8~32자"
                  value={passwd}
                  onChange={(e) => {
                    setPasswd(e.target.value);
                    if (passwdError) {
                      setPasswdError(null);
                    }
                  }}
                  onBlur={() => {
                    if (passwd.trim() === "") {
                      setPasswdError(null);
                      return;
                    }
                    const result = ValidPW(passwd);
                    setPasswdError(result === true ? null : result);
                  }}
                  error={!!passwdError}
                  helperText={passwdError}
                />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  {mode === "add" ? (<><span style={{ color: 'red' }}>*</span> 비밀번호 확인</>) : ("비밀번호 확인")}
                </FormLabel>
                <TextField
                  type="password"
                  name="confirmpasswd"
                  size="small"
                  value={confirmPasswd}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPasswd(value);

                    if (!value) {
                      setConfirmPasswdValid(null);
                      setConfirmPasswdMessage(null);
                      return;
                    }

                    if (value === passwd) {
                      setConfirmPasswdValid(true);
                      setConfirmPasswdMessage("");
                    } else {
                      setConfirmPasswdValid(false);
                      setConfirmPasswdMessage("비밀번호가 일치하지 않습니다.");
                    }
                  }}
                  error={confirmPasswdValid === false}
                  helperText={confirmPasswdMessage}
                />
              </Box>
            </Box>

            <div className="split-line"></div>

            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  이름
                </FormLabel>
                  <TextField
                  name="name"
                  size="small"
                  placeholder="32자 이하" 
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    if(value.length <= 33) setName(value);

                    if (nameError) {
                      setNameError(null);
                    }
                  }}
                  onBlur={() => {
                    const result = ValidName(name);
                    if (result !== true) {
                      setNameError(result);
                    } else {
                      setNameError(null);
                    }
                  }}
                  error={!!nameError}
                  helperText={nameError ?? undefined}
                />
              </Box>

              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  연락처
                </FormLabel>
                <TextField 
                  name="phone" 
                  size="small"
                  placeholder="000-0000-0000" 
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPhone(value);

                    if (phoneError) {
                      setPhoneError(null);
                    }
                  }}
                  onBlur={() => {
                    const result = ValidPhone(phone);
                    if (result !== true) {
                      setPhoneError(result);
                    } else {
                      setPhoneError(null);
                    }
                  }}
                  error={!!phoneError}
                  helperText={phoneError ?? undefined}
                />
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <FormLabel>
                  이메일
                </FormLabel>
                <TextField 
                  name="email"
                  placeholder="future@future.co.kr"
                  size="small"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    if (emailError) {
                      setEmailError(null);
                    }
                  }}
                  onBlur={() => {
                    const result = ValidEmail(email);
                    if (result !== true) {
                      setEmailError(result);
                    } else {
                      setEmailError(null);
                    }
                  }}
                  error={!!emailError}
                  helperText={emailError ?? undefined}
                />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {mode === 'other' && (
                  <>
                    <FormLabel>
                      계정 활성화
                    </FormLabel>
                    <Switch
                      checked={status === 1}
                      onChange={handleStatusChange}
                    />
                    <input type="hidden" name="status" value={status || ""} />
                  </>
                )} 
              </Box>
            </Box>

            
            <Box display="flex" justifyContent="center" gap={0.5} mt={2}>
              <Button type="submit" className={disableSubmit ? "close-text-btn" : "default-btn"} disabled={disableSubmit}>
                {mode === 'add' ? '등록' : '수정'}
              </Button>

              <Button  className="close-text-btn" onClick={onClose}>취소</Button>
            </Box>
          </Box>

        </div>
{/* }
        <DialogContent>
          <Grid2 container rowSpacing={2} spacing={1} sx={{ pt: 3 }}>
            <Grid2 size={{ xs:12, md:2 }} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong>
              {mode === "add" ? (<><span style={{ color: 'red' }}>*</span> 아이디</>) : ("아이디")}
              </strong>
            </Grid2>

            <Grid2 size={{ xs:12, md:4 }} >
              {mode === "add" ? (
                <TextField
                  name="id"
                  // label="ID"
                  // variant="outlined"
                  size="small"
                  sx={{ width: "95%" }}
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    setIdFormatError(null);
                    setIdDupMessage(null);
                    setIsIdAvailable(null);
                  }}
                  onBlur={async () => {
                    if (id.trim() === "") {
                      setIdFormatError(null);
                      setIdDupMessage(null);
                      setIsIdAvailable(null);
                      return;
                    }
                    const format = ValidID(id);
                    if (format !== true) {
                      setIdFormatError(format);
                      setIsIdAvailable(false);
                      return;
                    }
                    const dupMsg = await checkIdDuplicate(id);
                    setIdDupMessage(dupMsg);
                    setIsIdAvailable(dupMsg === "사용 가능한 아이디입니다.");
                  }}
                  error={!!idFormatError || isIdAvailable === false}
                  helperText={
                    idFormatError ? (
                      <span style={{ color: "red" }}>{idFormatError}</span>
                    ) : idDupMessage ? (
                      <span style={{ color: isIdAvailable ? "green" : "red" }}>{idDupMessage}</span>
                    ) : (
                      "영문, 영문 숫자 혼합 4~32자"
                    )
                  }
                />
                ) : (
                  <>
                    <TextField
                      name="id"
                      // label="ID"
                      // variant="outlined"
                      size="small"
                      sx={{ width: "95%" }}
                      value={id}
                      disabled
                      />
                    <input type="hidden" name="id" value={id} />
                  </>
                )
              }
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong>
                {mode === 'add' ? (<><span>&nbsp;&nbsp;</span>관리자 유형</>) : ("관리자 유형")}
              </strong>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={handleAdminChange}
              >
                {role === 3
                  ? [<ToggleButton disabled value={3} size="small">슈퍼 관리자</ToggleButton>]
                  : [
                    <ToggleButton value={2} size="small">설정 관리자</ToggleButton>,
                    <ToggleButton value={1} size="small">모니터 관리자</ToggleButton>
                  ]
                }
              </ToggleButtonGroup>
              <input type="hidden" name="role" value={role} />
            </Grid2>
            
            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong>
              {mode === "add" ? (<><span style={{ color: 'red' }}>*</span> 비밀번호</>) : ("비밀번호")}
              </strong>
            </Grid2>

            <Grid2 size={{xs:12, md:4}} >
              <TextField 
                type="password" 
                name="passwd" 
                label="Password" 
                variant="outlined" 
                size="small" 
                sx={{ width: "95%" }}
                value={passwd}
                onChange={(e) => {
                  setPasswd(e.target.value);
                  if (passwdError) {
                    setPasswdError(null);
                  }
                }}
                onBlur={() => {
                  if (passwd.trim() === "") {
                    setPasswdError(null);
                    return;
                  }
                  const result = ValidPW(passwd);
                  setPasswdError(result === true ? null : result);
                }}
                error={!!passwdError}
                helperText={passwdError ?? "영문 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함, 8~32자"}
              />
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong>
              {mode === "add" ? (<><span style={{ color: 'red' }}>*</span> 비밀번호 확인</>) : ("비밀번호 확인")}
              </strong>
            </Grid2>
            
            <Grid2 size={{xs:12, md:4}} >
              <TextField
              type="password"
              name="confirmpasswd"
              label="Confirm Password"
              variant="outlined"
              size="small"
              sx={{ width: "95%" }}
              value={confirmPasswd}
              onChange={(e) => {
                const value = e.target.value;
                setConfirmPasswd(value);

                if (!value) {
                  setConfirmPasswdValid(null);
                  setConfirmPasswdMessage(null);
                  return;
                }

                if (value === passwd) {
                  setConfirmPasswdValid(true);
                  setConfirmPasswdMessage("비밀번호가 일치합니다.");
                } else {
                  setConfirmPasswdValid(false);
                  setConfirmPasswdMessage("비밀번호가 일치하지 않습니다.");
                }
              }}
              error={confirmPasswdValid === false}
              helperText={
                confirmPasswdMessage && (
                  <span style={{ color: confirmPasswdValid ? "green" : "red" }}>
                    {confirmPasswdMessage}
                  </span>
                )
              }
            />
            </Grid2>

            <Grid2 size={ 12 }>
              <Divider sx={{ my: 1 }} />
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span>&nbsp;&nbsp;</span>이름</strong>
            </Grid2>
            
            <Grid2 size={{xs:12, md:4}} >
              <TextField
                name="name"
                label="Name"
                placeholder="32자 이하" 
                variant="outlined" size="small"
                sx={{ width: "95%" }}
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);

                  if (nameError) {
                    setNameError(null);
                  }
                }}
                onBlur={() => {
                  const result = ValidName(name);
                  if (result !== true) {
                    setNameError(result);
                  } else {
                    setNameError(null);
                  }
                }}
                error={!!nameError}
                helperText={nameError ?? undefined}
              />
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span>&nbsp;&nbsp;</span>연락처</strong>
            </Grid2>

            <Grid2 size={{xs:12, md:4}} >
              <TextField 
                name="phone" 
                label="Phone Number" 
                placeholder="ex) 000-0000-0000" 
                variant="outlined" 
                size="small" 
                sx={{ width: "95%" }}
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  setPhone(value);

                  if (phoneError) {
                    setPhoneError(null);
                  }
                }}
                onBlur={() => {
                  const result = ValidPhone(phone);
                  if (result !== true) {
                    setPhoneError(result);
                  } else {
                    setPhoneError(null);
                  }
                }}
                error={!!phoneError}
                helperText={phoneError ?? undefined}
              />
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span>&nbsp;&nbsp;</span>이메일</strong>
            </Grid2>

            <Grid2 size={{xs:12, md:4}} >
              <TextField 
                name="email"
                label="E-mail"
                placeholder="future@future.co.kr"
                variant="outlined"
                size="small"
                sx={{ width: "95%" }}
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  if (emailError) {
                    setEmailError(null);
                  }
                }}
                onBlur={() => {
                  const result = ValidEmail(email);
                  if (result !== true) {
                    setEmailError(result);
                  } else {
                    setEmailError(null);
                  }
                }}
                error={!!emailError}
                helperText={emailError ?? undefined}
              />
            </Grid2>

            {mode === "other" && ( 
              <>
                <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
                  <strong><span>&nbsp;&nbsp;</span>계정 활성화</strong>
                </Grid2>
                <Grid2 size={{xs:12, md:4}} >
                  <Switch
                    checked={status === 1}
                    onChange={handleStatusChange}
                  />
                  <input type="hidden" name="status" value={status} />
                </Grid2>
              </>
            )} 
          </Grid2>

        </DialogContent>
        */}
      </Dialog>
    </React.Fragment>
  );
}