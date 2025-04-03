'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ValidID, ValidPW } from "../api/validation";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useToastState } from "../components/useToast";
import ToastAlert from "../components/toastAleat";

export default function SignIn() {
  // 라우터
  const router = useRouter();

  // (Client Only) 쿼리 파라미터에서 로그아웃/세션 만료 여부 확인
  const searchParams = useSearchParams();
  const loggedOut = searchParams.get('loggedout'); // 로그아웃
  const timedout = searchParams.get('timedout'); // 세션만료

  // toastAleat
  const { toastOpen, toastMsg, severity, showToast, toastClose } = useToastState();
  
  // 세션 만료 또는 로그아웃 등으로 로그인 페이지로 리다이렉트된 경우
  // 파라미터 기반 toastMsg 출력 및 이전 페이지로 돌아가기 막기
  useEffect(() => {
    // 뒤로가기 시 강제로 /login 경로 유지 (뒤로가기 방지)
    const handlePopState = () => {
      history.pushState(null, "", "/login");
    };
    // 로그아웃
    if (loggedOut === 'true') {
      showToast("로그아웃 되었습니다.", "success");
      router.replace("/login");
      history.replaceState(null, "", "/login");
      history.pushState(null, "", "/login");
      window.addEventListener("popstate", handlePopState);
    }
    // 세션 만료
    if (timedout === 'true') {
      showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'warning');
      router.replace("/login");
      history.replaceState(null, "", "/login");
      history.pushState(null, "", "/login");
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loggedOut, timedout, showToast]);

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

    // 입력값 유효성 검사
    const idCheck = ValidID(ID);
    const pwCheck = ValidPW(PW);

    // 유효성 검사 실패 시 에러 메시지
    if (idCheck !== true) {return showToast(idCheck, "warning")};
    if (pwCheck !== true) {return showToast(pwCheck, "warning")};

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
      return showToast("계정이 비활성화되어 있습니다.", "error");
    }

    // 로그인 성공 시 페이지 이동
    router.push("/main");
  };
  return (
    // 전체 레이아웃
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* ToastAlert */}
      <ToastAlert
        open={toastOpen}
        setOpen={toastClose}
        message={toastMsg}
        severity={severity}
      />
      {/* Login Form */}
      <Paper
        component="form"
        onSubmit={handleLogin}
        sx={{
          px: 6,
          py: 10,
          width: 450,
          textAlign: "center",
          borderRadius: 2,
          backgroundColor: "#333"
        }}
      >
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="WeGuardia License"
            sx={{ height: 40 }}
          />
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          label="ID"
          type="text"
          name="id"
          autoComplete="off"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#fff', // 기본 테두리
              },
              '&:hover fieldset': {
                borderColor: '#fff', // 마우스 호버 시
              },
              '&.Mui-focused fieldset': {
                borderColor: '#fff', // 포커스 시
              },
            },
            '& .MuiInputLabel-root': {
              color: '#fff', // 라벨 색
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#fff', // 포커스된 라벨 색
            },
            '& .MuiInputBase-input': {
              color: '#fff', // 입력 텍스트 색
            },
          }}
        />
        <TextField
          fullWidth
          variant="outlined"
          label="PASSWORD"
          type="password"
          name="password"
          autoComplete="new-password"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#fff', // 기본 테두리
              },
              '&:hover fieldset': {
                borderColor: '#fff', // 마우스 호버 시
              },
              '&.Mui-focused fieldset': {
                borderColor: '#fff', // 포커스 시
              },
            },
            '& .MuiInputLabel-root': {
              color: '#fff', // 라벨 색
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#fff', // 포커스된 라벨 색
            },
            '& .MuiInputBase-input': {
              color: '#fff', // 입력 텍스트 색
            },
          }}
        />
        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{ my: 3 }}
        >
          LOGIN
        </Button>
        <Typography variant="body2" gutterBottom sx={{ textAlign: "left", color: '#fff' }}>
          ※ 본 시스템은 허가된 사용자만 이용할 수 있습니다.<br/>
          부당한 방법으로 시스템에 접속하거나 정보를 삭제, 변경, 유출하는 사용자는 관련법령에 따라 처벌 받을 수 있으니 주의하시기 바랍니다.
        </Typography>
      </Paper>
    </Box>
  )
}