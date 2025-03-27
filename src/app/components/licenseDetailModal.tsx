import { Box, Button, Checkbox, FormControl, FormLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import '../style/common.css';
import '../style/license.css';

interface LicenseDetailModalProps {
  close: () => void; // close prop 추가
  license: any; // license prop 추가
}

const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({ close, license }) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);

  return (
    <div className="w-full h-full flex justify-center items-center license-detail-modal-wrap">
      <div className="w-1/2 bg-white rounded-md">
        <div className="flex justify-between items-center p-4 border-b bg-gray-500">
          <h2 className="text-xl font-semibold text-white">상세보기</h2>
          <Button className="close-btn" onClick={close}><span style={{color:'#fff'}}>X</span></Button>
        </div>
        <div className="flex flex-col gap-4 p-10 text-13" style={{ fontSize: '13px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box className="detail-line-box">
                {[
                  { label: '등록일', value: new Date(license.reg_date).toISOString().split('T')[0] },
                  { label: '라이센스 발급일', value: new Date(license.license_date).toISOString().split('T')[0] },
                  { label: '발급이력', value: license.reissuance === 1 ? '재발급' : '초기발급' }
                ].map(({ label, value }) => (
                  <Box className="detail-line-box-item" key={label}>
                    <FormLabel className="detail-line-box-item-label">{label} :</FormLabel>
                    <p className="detail-line-box-item-value">{value}</p>
                  </Box>
                ))}
            </Box>
            
            <Box className="detail-line-box">
              {Object.keys(license)
                .filter(key => key.startsWith('license_') && !key.includes('date') && !key.includes('webfilter'))
                .map(key => (
                  <FormControl key={key} sx={{alignItems: 'center'}}>
                    <Typography>{key.replace('license_', '').toUpperCase()}</Typography>
                    <Checkbox checked={license[key] === '1'} />
                  </FormControl>
              ))}
            </Box>

            <Box className="detail-line-box">
                {[
                  { label: 'PROCESS', value: license.process },
                  { label: 'CPU명', value: license.cpu_name },
                  { label: 'CF ID', value: license.cfid }
                ].map(({ label, value }) => (
                  <Box className="detail-line-box-item" key={label}>
                    <FormLabel className="detail-line-box-item-label">{label} :</FormLabel>
                    <p className="detail-line-box-item-value">{value}</p>
                  </Box>
                ))}
            </Box>

            <Box className="detail-line-box">
              {[
                { label: 'IP', value: license.ip },
                { label: '유효기간(시작)', value: license.limit_time_st.slice(0, 4) + '-' + license.limit_time_st.slice(4, 6) + '-' + license.limit_time_st.slice(6, 8), isEditable: true },
                { label: '유효기간(만료)', value: license.limit_time_end.slice(0, 4) + '-' + license.limit_time_end.slice(4, 6) + '-' + license.limit_time_end.slice(6, 8), isEditable: true }
              ].map(({ label, value, isEditable }) => (
                <Box className="detail-line-box-item" key={label}>
                  <FormLabel className="detail-line-box-item-label">{label} :</FormLabel>
                  {isEditable && isEdit ? (
                    <TextField
                      className="detail-line-box-item-edit"
                      value={value}
                      onChange={(e) => {
                        // 여기에 유효기간(시작) 및 유효기간(만료) 수정 로직 추가
                      }}
                      type="date"
                    />
                  ) : (
                    <p className="detail-line-box-item-value">{value}</p>
                  )}
                </Box>
              ))}
            </Box>

            <Box className="detail-line-box">
              {[
                { label: '발급자', value: license.issuer, isEditable: true },
                { label: '담당자', value: license.manager, isEditable: true },
                { label: '사이트', value: license.sete_nm, isEditable: true }
              ].map(({ label, value, isEditable }) => (
                <Box className="detail-line-box-item" key={label}>
                  <FormLabel className="detail-line-box-item-label">{label} :</FormLabel>
                  {isEditable && isEdit ? (
                    <TextField
                      className="detail-line-box-item-edit"
                      value={value}
                      onChange={(e) => {
                        // 여기에 발급자, 담당자, 사이트 수정 로직 추가
                      }}
                    />
                  ) : (
                    <p className="detail-line-box-item-value">{value}</p>
                  )}
                </Box>
              ))}
            </Box>
            
            <Box display="flex" alignItems="center">
              <FormLabel className="detail-line-box-item-label">
                제품 시리얼번호 :
              </FormLabel>
              <p>{license.hardware_code}</p>
            </Box>
            <Box display="flex" alignItems="center">
              <FormLabel className="detail-line-box-item-label">
                하드웨어 인증키 :
              </FormLabel>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', maxWidth: '100%' }}>
                {license.init_code.length > 60 ? `${license.init_code.slice(0, 60)}\n${license.init_code.slice(60)}` : license.init_code}
              </p>
            </Box>
            <Box display="flex" alignItems="center">
              <FormLabel className="detail-line-box-item-label">
                사이트 :
              </FormLabel>
              <p>{license.auth_code}</p>
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mt={2}>
              <Button variant="contained" color="primary" onClick={() => setIsEdit(!isEdit)}>
                {isEdit ? '저장' : '수정'}
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

export default LicenseDetailModal;