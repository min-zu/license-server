'use client';

import { useEffect } from "react";

// Next.js
import { useRouter } from "next/navigation";

// Auth.js (NextAuth.js v5)
import { getSession, signIn, signOut } from "next-auth/react";

// MUI
import { Box, Button, Paper, TextField, Typography } from "@mui/material";

// ToastAlert
import { useToastState } from "../components/useToast";


export default function SignIn() {
  // 라우터
  const router = useRouter();

  // toastAleat
  const { showToast, ToastComponent } = useToastState();
  
  useEffect(() => {
    // 로그아웃 시 unload발생 -> 오탐 방지로 제거
    if (localStorage.getItem('wasExternal') === 'true') {
      localStorage.removeItem('wasExternal');
    }

    // 토스트 플래그 확인
    const toastFlag = localStorage.getItem('loginToast');
    // 로그아웃
    if (toastFlag === 'loggedout') {
      showToast('로그아웃 되었습니다.', 'success');
      localStorage.removeItem('loginToast');
    }
    // 세션 만료
    if (toastFlag === 'timedout') {
      showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
      localStorage.removeItem('loginToast');
    }
    // 비정상 접근
    if (toastFlag === 'forced') {
      showToast('비정상적인 접근입니다. 다시 로그인해주세요.', 'error');
      localStorage.removeItem('loginToast');
    }
  }, []);

  // 로그인 처리 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    // 새로고침 막기
    e.preventDefault();

    // FormData를 통해 입력값 추출
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const ID = formData.get("id")?.toString() ?? "";
    const PW = formData.get("password")?.toString() ?? "";

    if (!ID) {return showToast("아이디를 입력해 주세요.","warning")}
    if (!PW) {return showToast("비밀번호를 입력해 주세요.", "warning")}

     // Auth.js(NextAuth v5)을 통한 로그인
    const result = await signIn("credentials", {
      id: ID,
      password: PW,
      redirect: false
    })

    // 로그인 실패 시 에러 메시지
    if (!result || result.error) {
      const errorMessage = result?.error === "CredentialsSignin"
        ? "아이디 또는 비밀번호가 올바르지 않습니다."
        : "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      return showToast(errorMessage, "error");
    }

    // 계정 비활성화 체크
    const session = await getSession();
    if (session?.user?.status === 0) {
      await signOut({ redirect: false }); // 세션 삭제
      return showToast("계정이 비활성화되어 있습니다.", "warning");
    }

    // 로그인 성공 시 페이지 이동
    document.cookie = "loginInit=true; max-age=10; path=/; SameSite=Lax";
    router.replace("/main");
  };
  return (
    // 전체 레이아웃
    <Box
      className="login-page"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* ToastAlert */}
      {ToastComponent}

      {/* Login Form */}
      <Paper
        className="login-form"
        component="form"
        onSubmit={handleLogin}
        sx={{
          px: 6,
          py: 10,
          width: 450,
          textAlign: "center",
          borderRadius: 2,
          backgroundColor: "#053345"
        }}
      >
        {/* 로고 */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="WeGuardia License"
            sx={{ height: 40 }}
          />
        </Box>

        {/* 아이디 */}
        <TextField
          fullWidth
          variant="outlined"
          label="ID"
          type="text"
          name="id"
          autoComplete="off"
        />

        {/* 비밀번호 */}
        <TextField
          fullWidth
          variant="outlined"
          label="PASSWORD"
          type="password"
          name="password"
          autoComplete="new-password"
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{ my: 3 }}
        >
          LOGIN
        </Button>

        <Typography variant="body2" className="text-12" gutterBottom sx={{ textAlign: "left", color: '#fff' }}>
          ※ 본 시스템은 허가된 사용자만 이용할 수 있습니다.<br/>
          부당한 방법으로 시스템에 접속하거나 정보를 삭제, 변경, 유출하는 사용자는 관련법령에 따라 처벌 받을 수 있으니 주의하시기 바랍니다.
        </Typography>
      </Paper>
    </Box>
  )
}