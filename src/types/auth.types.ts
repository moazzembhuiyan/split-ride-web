export type UserRole = "user" | "provider" | "admin";
export type Gender = "male" | "female";
export type OtpType = "signup" | "forgot" | "login" | "changeEmail" | "changePhone";

export interface RegisterPayload {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  role: UserRole;
  fcmToken?: string;
}

export interface LoginWithPhonePayload {
  countryCode: string;
  phone: string;
  fcmToken?: string;
}

export interface LoginWithEmailPayload {
  email: string;
  password: string;
  fcmToken?: string;
}

export interface SocialLoginPayload {
  name: string;
  email: string;
  role: UserRole;
  token: string;
  profileImage?: string;
  fcmToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  role: UserRole;
  status: string;
  isEmailVerified: boolean;
  isKycVerified: boolean;
  isResetPassword: boolean;
  failedLoginAttempts: number;
  profileImage?: string | null;
  dateOfBirth?: string;
  gender?: Gender;
  latitude?: number;
  longitude?: number;
  address?: string;
  language?: string;
  userNo?: string;
  documents?: string[];
  isDeleted: boolean;
  isOnline?: boolean;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  // provider-only
  completedRides?: number;
  totalEarning?: number;
  lifetimeEarnings?: number;
  avgRating?: number;
  totalRating?: number;
  vehicles?: Array<{
    _id: string;
    name: string;
    number: string;
    year: number;
    seats: number;
    isDefault: boolean;
  }>;
}

export interface LoginUser {
  name: string;
  email: string;
  role: UserRole;
  isProfileComplete: boolean;
  status: string;
  isKycSubmitted: boolean;
  hasVehicle: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

export interface OtpTokenResponse {
  verificationToken: string
  otp?: string
  mock?: boolean
}
