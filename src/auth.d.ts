declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      role: string;
      email?: string;
      pw_expiry? : string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string;
    role: string;
  }
}