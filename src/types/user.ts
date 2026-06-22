export type UserProfileData = {
  avatar: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneCode: string;
  phoneNumber: string;
  profession: string;
  userName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  role: string;
};

export type UpdateUserProfileData = Partial<{
  avatar: string | null;
  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  profession: string;
  userName: string;
  dateOfBirth: string;
  address: string;
  country: string;
}>;
