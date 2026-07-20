const BASE_URL = 'http://10.0.2.2:3000/api/v1';

export const login = `${BASE_URL}/auth/login`;
// export const registerUrl = `${BASE_URL}/auth/register`;
// export const forgotPasswordUrl = `${BASE_URL}/auth/forgot-password`;
export const resetPassword = `${BASE_URL}/auth/reset-password`;
export const requestOtp = `${BASE_URL}/auth/request-otp`;
export const signInWithOtp = `${BASE_URL}/auth/otp-login`;
export const changePassword = `${BASE_URL}/auth/change-password`;

//Profile
export const profileDetails = `${BASE_URL}/users/me/profile`;


//listings
export const listings = `${BASE_URL}/listings`;

//projects (local for now; wire to backend later)
export const projects = `${BASE_URL}/projects`;
export const projectById = (id: string) => `${BASE_URL}/projects/${id}`;

//location apis
export const states = `${BASE_URL}/states`;
export const stateDistricts = (stateId: number) =>
  `${BASE_URL}/states/${stateId}/districts`;
export const subDistrictsSearch = `${BASE_URL}/sub-districts/search`;
export const villagesSearch = `${BASE_URL}/villages/search`;

