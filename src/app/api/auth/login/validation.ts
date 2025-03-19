export const ValidID = (id: unknown): string | true => {
    if (!id || typeof id !== "string") return "아이디를 입력해주세요.";
    if (id.length < 4 || id.length > 20) return "아이디는 4자 이상 20자 이하여야 합니다.";
    if (!/^[a-zA-Z0-9]+$/.test(id)) return "아이디는 영문 대소문자와 숫자만 사용할 수 있습니다.";
    return true;
  };

export const ValidPW = (password: unknown): string | true => {
    if (!password || typeof password !== "string") return "비밀번호를 입력해주세요.";
    if (password.length < 8 || password.length > 20) return "비밀번호는 8자 이상 20자 이하여야 합니다.";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,20}$/.test(password)) {
        return "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
    }
    return true;
};