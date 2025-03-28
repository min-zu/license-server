export const ValidID = (id: unknown): string | true => {
  if (typeof id !== "string") return "아이디 형식이 올바르지 않습니다.";
  if (id.length < 4 || id.length > 32) return "아이디는 4자 이상 32자 이하여야 합니다.";
  const idPattern = /^[a-zA-Z0-9]*[a-zA-Z][a-zA-Z0-9]*$/
  if (!idPattern.test(id)) return "아이디는 영문(대소문자)과 숫자만 사용할 수 있으며, 반드시 영문이 포함되어야 합니다.";
  return true;
  };

export const ValidPW = (password: unknown): string | true => {
  if (typeof password !== "string") return "비밀번호 형식이 올바르지 않습니다.";
  if (password.length < 8 || password.length > 32) return "비밀번호는 8자 이상 32자 이하여야 합니다.";
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).+$/
  if (!passwordPattern.test(password)) return "비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
  return true;
};

export const ValidName = (name: unknown): string | true => {
  if (name === undefined || name === null || (typeof name === "string" && name.trim() === "")) return true;
  if (typeof name !== "string") return "이름 형식이 올바르지 않습니다.";
  if (name.length > 32) return "이름은 32자 이내로 입력해주세요.";
  return true;
};

export const ValidPhone = (phone: unknown): string | true => {
  if (phone === undefined || phone === null || (typeof phone === "string" && phone.trim() === "")) return true;
  if (typeof phone !== "string") return "연락처 형식이 올바르지 않습니다. 예: 010-1234-5678";
  const phonePattern = /^\d{2,3}-\d{3,4}-\d{4}$/;
  if (!phonePattern.test(phone)) return "연락처 형식이 올바르지 않습니다. 예: 010-1234-5678";
  return true;
};

export const ValidEmail = (email: unknown): string | true => {
  if (email === undefined || email === null || (typeof email === "string" && email.trim() === "")) return true;
  if (typeof email !== "string") return "이메일 형식이 올바르지 않습니다. 예: future@domain.com";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return "이메일 형식이 올바르지 않습니다. 예: future@domain.com";
  return true;
};

// 아이디 중복 검사 (비동기)
export const checkIdDuplicate = async (id: string): Promise<string> => {
  try {
    const res = await fetch(`/api/admin?id=${encodeURIComponent(id)}&mode=check-id`);
    if (!res.ok) throw new Error("서버 응답 실패");

    const isDuplicate = await res.json();

    if (isDuplicate) {
      return "이미 사용 중인 아이디입니다.";
    }

    return "사용 가능한 아이디입니다.";
  } catch (error) {
    console.error("중복 검사 실패:", error);
    return "아이디 중복 확인 중 오류가 발생했습니다.";
  }
};