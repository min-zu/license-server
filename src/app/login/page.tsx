'use client';

import * as React from 'react';
import { Box, Button, CssBaseline, FormLabel, FormControl, TextField, Typography, Stack } from '@mui/material';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ValidID, ValidPW } from "@/app/api/validation"
import { signIn } from "next-auth/react"

// 임시 로그인 페이지

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const ID = id.trim();
    const PW = password.trim();

    const idCheck = ValidID(ID);
    const pwCheck = ValidPW(PW);

    if (idCheck !== true) {return alert(idCheck)};
    if (pwCheck !== true) {return alert(pwCheck)};
    
    // const result = await signInAction({ id: ID, password: PW });
    const result = await signIn("credentials", {id: ID, password: PW, redirect: false})

    if (!result || result.error) {
      const errorMessage = result?.error === "CredentialsSignin" ? "아이디 또는 비밀번호가 일치하지 않습니다." : "로그인 중 오류가 발생했습니다.";
      return alert(errorMessage);
    }
    router.push("/main");
  };
  return (
    <div>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" alignItems="center">
        <Card
          variant="outlined"
          sx={{
            backgroundColor: '#D1D5DB',
            alignItems: 'center',
            justifyContent: 'center',
            width: 400,
            height: 600
          }}
        >
          <Box
            component="form"
            onSubmit={handleLogin}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <div className='logo mb-5 mx-auto' />
            <FormControl>
              <TextField
                id="id"
                type="text"
                name="id"
                label="ID"
                fullWidth
                variant="outlined"
                onChange={(e) => setId(e.target.value)}
                InputProps={{
                  sx: {
                    backgroundColor: '#f0f0f0'
                  }
                }}
              />
            </FormControl>
            <FormControl>
              <TextField
                id="password"
                type="password"
                name="password"
                label="PASSWORD"
                fullWidth
                variant="outlined"
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  sx: {
                    backgroundColor: '#f0f0f0'
                  }
                }}
              />
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              sx={{mt: 5}}
            >
              LOGIN
            </Button>
            <Typography variant="body2" gutterBottom sx={{mt: 2}}>
              ※ 본 시스템은 허가된 사용자만 이용할 수 있습니다.<br />
              부당한 방법으로 시스템에 접속하거나 정보를 삭제, 변경, 유출하는 사용자는 관련법령에 따라 처벌 받을 수 있으니 주의하시기 바랍니다.
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </div>
  );
}
