// 简单的认证状态管理工具

export interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  token?: string;
  status?: number;
  walletBalance?: number;
  [key: string]: any;
}

const AUTH_STORAGE_KEY = 'zjc_airline_auth';

// 保存用户信息到 localStorage
export const saveAuth = (userInfo: UserInfo) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userInfo));
  }
};

// 从 localStorage 获取用户信息
export const getAuth = (): UserInfo | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('获取认证信息失败:', error);
    return null;
  }
};

// 清除认证信息
export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  const auth = getAuth();
  return auth !== null && !!auth.token;
};

// 获取 token
export const getToken = (): string | null => {
  const auth = getAuth();
  return auth?.token || null;
};

