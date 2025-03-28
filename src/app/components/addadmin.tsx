'use client'

import React from "react";
import { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid2, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { checkIdDuplicate, ValidEmail, ValidID, ValidName, ValidPhone, ValidPW } from "@/app/api/validation";


interface ModalProps {
    open: boolean;
    onClose: () => void;
  }

export default function Addadmin({ open, onClose }: ModalProps) {
  const [id, setId] = useState("");
  const [idFormatError, setIdFormatError] = useState<string | null>(null);
  const [idDupMessage, setIdDupMessage] = useState<string | null>(null);
  const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
  
  const [role, setRole] = useState(2);

  const [passwd, setPasswd] = useState("");
  const [passwdError, setPasswdError] = useState<string | null>(null);

  const [confirmPasswd, setConfirmPasswd] = useState("");
  const [confirmPasswdMessage, setConfirmPasswdMessage] = useState<string | null>(null);
  const [confirmPasswdValid, setConfirmPasswdValid] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const disableSubmit =
  id.trim() === "" ||
  passwd.trim() === "" ||
  confirmPasswd.trim() === "" ||
  !!idFormatError ||
  isIdAvailable !== true ||
  !!passwdError ||
  confirmPasswdValid === false ||
  !!nameError ||
  !!phoneError ||
  !!emailError;

  const handleAdminChange = (
    event: React.MouseEvent<HTMLElement>,
    newRole: number
  ) => {
      setRole(newRole);
  };
  
  useEffect(() => {
    if (open) {
      setId("");
      setIdFormatError(null);
      setIdDupMessage(null);
      setIsIdAvailable(null);
  
      setRole(2);
  
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
    }
  }, [open]);

  return (
    <React.Fragment>
      <Dialog
        open={open}
        maxWidth={false}
        slotProps={{
          paper: {
            component: 'form',
            sx: { maxWidth: "900px", minWidth: "300px" },
            onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries((formData as any).entries());
              const body = {...formJson, mode: "add-admin"};
              try {
                const res = await fetch("/api/admin", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(body),
                });
            
                const result = await res.json();
            
                if (result.success) {
                  alert("관리자 추가 완료!");
                  onClose();
                } else {
                  alert("추가 실패: " + result.error);
                }
              } catch (e) {
                console.error("전송 실패:", e);
                alert("네트워크 오류가 발생했습니다.");
              }
              // setTimeout(() => {
              //   onClose();
              // }, 0);
            },
          },
        }}
      >
        <DialogTitle className="bg-gray-500 text-white">계정 추가</DialogTitle>

        <DialogContent>
          <Grid2 container rowSpacing={2} spacing={1} sx={{ pt: 3 }}>
            <Grid2 size={{ xs:12, md:2 }} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span style={{ color: 'red' }}>*</span> 아이디</strong>
            </Grid2>
            <Grid2 size={{ xs:12, md:4 }} >
              <TextField
                name="id"
                label="ID"
                variant="outlined"
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
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span>&nbsp;&nbsp;</span>관리자 유형</strong>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={handleAdminChange}
                sx={{
                  "& .MuiToggleButton-root": { height: "40px" }
                }}
              >
                <ToggleButton value={2} size="small">설정 관리자</ToggleButton>
                <ToggleButton value={1} size="small">모니터 관리자</ToggleButton>
              </ToggleButtonGroup>
              <input type="hidden" name="role" value={role} />
            </Grid2>
            
            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span style={{ color: 'red' }}>*</span> 비밀번호</strong>
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
                  const result = ValidPW(passwd);
                  setPasswdError(result === true ? null : result);
                }}
                error={!!passwdError}
                helperText={passwdError ?? "영문 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함, 8~32자"}
              />
            </Grid2>

            <Grid2 size={{xs:12, md:2}} sx={{ display: 'flex', alignItems: 'flex-start', pt: '10px' }}>
              <strong><span style={{ color: 'red' }}>*</span> 비밀번호 확인</strong>
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
          </Grid2>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center" }}>
          <Button type="submit" variant="contained" disabled={disableSubmit}>추가</Button>
          <Button variant="contained" onClick={onClose}>취소</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}