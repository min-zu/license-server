import { Box, Button, FormControl, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";


export default function LicenseAddModal({ close }: { close: () => void }) {
  return (
    <div className="w-full h-full flex justify-center items-center text-13">
      <div className="w-1/2 bg-white rounded-md">
        <div className="flex justify-between items-center p-4 border-b bg-gray-300">
          <h2 className="text-xl font-semibold text-white">라이센스 등록</h2>
          <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
        </div>
        <div className="flex flex-col gap-4 p-10 text-13">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              fontSize: '13px'
            }}
          >
            <Box display="flex" alignItems="center">
              <FormLabel style={{width: 120, textAlign: "left"}}>
                <span className="text-red-500">*</span> 장비 선택
              </FormLabel>
              <ToggleButtonGroup exclusive size="small">
                <ToggleButton value="ITU">ITU</ToggleButton>
                <ToggleButton value="ITM">ITM</ToggleButton>
                <ToggleButton value="XTM">XTM</ToggleButton>
                <ToggleButton value="SMC">SMC</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                <span className="text-red-500">*</span> 제품 시리얼 번호
              </FormLabel>
              <TextField fullWidth size="small" />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 120, textAlign: "left"}}>
                소프트웨어 옵션
              </FormLabel>
              <ToggleButtonGroup size="small">
                <ToggleButton value="FW">FW</ToggleButton>
                <ToggleButton value="VPN">VPN</ToggleButton>
                <ToggleButton value="SSL">SSL</ToggleButton>
                <ToggleButton value="IPS">IPS</ToggleButton>
                <ToggleButton value="WAF">WAF</ToggleButton>
                <ToggleButton value="AV">AV</ToggleButton>
                <ToggleButton value="AS">AS</ToggleButton>
                <ToggleButton value="Tracker">Tracker</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                <span className="text-red-500">*</span> 발급일자(시작)
              </FormLabel>
              <TextField
                fullWidth 
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                <span className="text-red-500">*</span> 발급일자(종료)
              </FormLabel>
              <TextField 
                fullWidth 
                size="small"
                type="date" 
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                  발급자
              </FormLabel>
              <TextField fullWidth size="small" />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                고객사명
              </FormLabel>
              <TextField fullWidth size="small" />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                고객사 E-mail
              </FormLabel>
              <TextField fullWidth size="small" type="email" />
            </Box>

            <Box display="flex" alignItems="center">
              <FormLabel sx={{width: 140, textAlign: "left"}}>
                하드웨어 번호
              </FormLabel>
              <TextField fullWidth size="small" />
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Button variant="contained" color="primary">
                계속 등록
              </Button>
              <Button variant="contained" color="primary">
                등록
              </Button>
              <Button variant="contained" color="inherit" onClick={close}>
                취소
              </Button>
            </Box>
          </Box>
        </div>
      </div>
    </div>
  )
}