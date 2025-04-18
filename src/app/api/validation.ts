// 아이디 유효성 검사
export const ValidID = (id: unknown): string | true => {
  if (typeof id !== "string") return "아이디 형식 오류";
  if (id.length < 4 || id.length > 32) return "4자 이상 32자 이하";
  const idPattern = /^[a-zA-Z0-9]*[a-zA-Z][a-zA-Z0-9]*$/
  if (!idPattern.test(id)) return "영문과 숫자만 사용, 반드시 영문이 포함";
  return true;
  };

// 비밀번호 유효성 검사
export const ValidPW = (password: unknown): string | true => {
  if (typeof password !== "string") return "비밀번호 형식 오류";
  if (password.length < 8 || password.length > 32) return "8자 이상 32자 이하";
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).+$/
  if (!passwordPattern.test(password)) return "영문 대/소문자, 숫자, 특수문자 포함";
  return true;
};

// 이름 유효성 검사
export const ValidName = (name: unknown): string | true => {
  if (name === undefined || name === null || (typeof name === "string" && name.trim() === "")) return true;
  if (typeof name !== "string") return "이름 형식 오류";
  if (name.length > 32) return "32자 이내로 입력";
  return true;
};


// 연락처 유효성 검사
export const ValidPhone = (phone: unknown): string | true => {
  if (phone === undefined || phone === null || (typeof phone === "string" && phone.trim() === "")) return true;
  if (typeof phone !== "string") return "연락처 형식 오류";
  const phonePattern = /^\d{2,3}-\d{3,4}-\d{4}$/;
  if (!phonePattern.test(phone)) return "연락처 형식 오류";
  return true;
};

// 이메일 유효성 검사
export const ValidEmail = (email: unknown): string | true => {
  if (email === undefined || email === null || (typeof email === "string" && email.trim() === "")) return true;
  if (typeof email !== "string") return "이메일 형식 오류";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return "이메일 형식 오류";
  return true;
};

// 아이디 중복 검사
export const checkIdDuplicate = async (id: string): Promise<string> => {
  try {
    const res = await fetch(`/api/admin?id=${encodeURIComponent(id)}&mode=checkId`);
    if (!res.ok) throw new Error("서버 응답 실패");

    const isDuplicate = await res.json();

    if (isDuplicate) {
      return '1'; // 사용중
    }

    return '0'; // 사용가능
  } catch (error) {
    console.error("중복 검사 실패:", error);
    return "아이디 중복 확인 중 오류가 발생했습니다.";
  }
};



/* 라이센스 등록 유효성 검사 */
export const ValidHardwareCode = (hardwareCode: unknown): string | true => {
  if (hardwareCode === undefined || hardwareCode === null || (typeof hardwareCode === "string" && hardwareCode.trim() === "")) return "제품 시리얼 번호를 입력해 주세요.";
  if (typeof hardwareCode !== "string") return "제품 시리얼 번호 형식이 올바르지 않습니다.";
  const hardwareCodePattern = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
  if (!hardwareCodePattern.test(hardwareCode)) return "제품 시리얼 번호는 영문과 숫자를 각각 1개 이상 포함해야 합니다.";
  if (hardwareCode.length !== 24) return "제품 시리얼 번호는 24자 입니다.";
  return true;
};


export const checkHardwareCode = async (hardwareCode: string): Promise<string> => {
  try {
    const res = await fetch(`/api/license/add?hardwareCode=${encodeURIComponent(hardwareCode)}`);
    if (!res.ok) throw new Error("서버 응답 실패");

    const isDuplicate = await res.json();
    return isDuplicate[0].cnt;
  } catch (error) {
    console.error("DB 검사 실패:", error);
    return "시리얼 번호 중복 확인 중 오류가 발생했습니다.";
  }
};

export const ValidLimitTimeStart = (limitTimeStart: unknown): string | true => {
  if (limitTimeStart === undefined || limitTimeStart === null || (typeof limitTimeStart === "string" && limitTimeStart.trim() === "")) return "유효기간(시작)을 입력해 주세요.";
  return true;
};

export const ValidLimitTimeEnd = (limitTimeEnd: unknown): string | true => {
  if (limitTimeEnd === undefined || limitTimeEnd === null || (typeof limitTimeEnd === "string" && limitTimeEnd.trim() === "")) return "유효기간(만료)을 입력해 주세요.";
  return true;
}
