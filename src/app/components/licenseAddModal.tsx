import { Button, FormControl, FormLabel, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function LicenseAddModal({ close }: { close: () => void }) {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-1/2 bg-white rounded-md">
        <div className="flex justify-between items-center p-4 border-b bg-gray-300">
          <h2 className="text-xl font-semibold text-white">라이센스 등록</h2>
          <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
        </div>
        <div className="flex flex-col gap-4 p-10">
          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>장비선택</FormLabel>
            <ToggleButtonGroup
              color="primary"
              exclusive
              size="small"
              fullWidth
            >
              <ToggleButton value="ITU">ITU</ToggleButton>
              <ToggleButton value="ITM">ITM</ToggleButton>
              <ToggleButton value="XTM">XTM</ToggleButton>
              <ToggleButton value="SMC">SMC</ToggleButton>
            </ToggleButtonGroup>
          </div> 
          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>제품시리얼 번호</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>
          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>소프트웨어 옵션</FormLabel>
            <div className="flex flex-wrap gap-4">
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="FW" />
                  <label htmlFor="FW">FW</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="VPN" />
                  <label htmlFor="VPN">VPN</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="SSL" />
                  <label htmlFor="SSL">SSL</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="IPS" />
                  <label htmlFor="IPS">IPS</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="WAF" />
                  <label htmlFor="WAF">WAF</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="AV" />
                  <label htmlFor="AV">AV</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="AS" />
                  <label htmlFor="AS">AS</label>
                </div>
              </FormControl>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="Tracker" />
                  <label htmlFor="Tracker">Tracker</label>
                </div>
              </FormControl>
            </div>
          </div>



          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>유효기간(시작)</FormLabel>
            <TextField
              type="date"
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>유효기간(만료)</FormLabel>
            <TextField
              type="date"
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>발급자</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>발급요청사(총판사)</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>프로젝트명</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>고객사명명</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>고객사 E-mail</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>

          <div className="flex items-center gap-4">
            <FormLabel sx={{ minWidth: '150px' }}>하드웨어 인증키</FormLabel>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
            />
          </div>
        </div>

        </div>
      </div>
  )
}