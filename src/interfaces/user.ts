export interface Users {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneCode: string | null;
  phoneNumber: string | null;
  emailAddress: string | null;
  password: string | null;
  role: string | null;
  status: string | null;
  emailVerified: string | null;
  emailVerifiedAt: Date | null;
  token: string | null;
  tokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
