import axios from "axios";

// 优先使用环境变量中的后端地址，默认使用本地 Spring Boot 服务
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn(
    "[API] 未检测到 NEXT_PUBLIC_API_BASE_URL，默认使用 http://localhost:8080。可在 .env.local 中覆盖。"
  );
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000,
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 确保baseURL是绝对路径
    if (config.baseURL && !config.baseURL.startsWith('http://') && !config.baseURL.startsWith('https://')) {
      console.warn("API baseURL不是绝对路径:", config.baseURL);
    }
    // 添加 token 等认证信息
    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("zjc_airline_auth");
      if (authData) {
        try {
          const auth = JSON.parse(authData);
          if (auth.token) {
            config.headers.Authorization = `Bearer ${auth.token}`;
          }
        } catch (error) {
          console.error("解析认证信息失败:", error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      console.error("API Error:", error.response.data);
      // 检查是否是"No static resource"错误
      if (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('No static resource')) {
        console.error("错误：请求被发送到了Next.js服务器，请确保后端服务正在运行且API_BASE_URL配置正确");
        console.error("当前API_BASE_URL:", API_BASE_URL);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error("Network Error:", error.request);
    } else {
      // 其他错误
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// 用户注册接口
export interface RegisterRequest {
  username: string;
  password: string;
  fullName?: string; // 旅客姓名（前端字段）
  name?: string; // 兼容后端字段
  idNumber: string; // 身份证号
  phone: string; // 联系电话
  address: string; // 通讯地址
  email?: string;
  [key: string]: any; // 允许其他字段
}

export interface RegisterResponse {
  code?: number;
  message?: string;
  data?: any;
  [key: string]: any;
}

// 用户登录接口
export interface LoginRequest {
  username: string;
  password: string;
  [key: string]: any;
}

export interface LoginResponse {
  code?: number;
  message?: string;
  data?: {
    token?: string;
    user?: {
      id?: string;
      username?: string;
      email?: string;
      role?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface UserStatsResponse {
  totalUsers: number;
  adminUsers: number;
  activeUsers: number;
  disabledUsers: number;
  recentRegistrations: Array<{ date: string; count: number }>;
}

export const userApi = {
  // 用户注册
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const payload = {
      username: data.username,
      password: data.password,
      name: data.fullName || data.name || data.username,
      idNumber: data.idNumber,
      phone: data.phone,
      address: data.address,
    };
    const response = await apiClient.post<RegisterResponse>("/api/users/register", payload);
    return response.data;
  },
  
  // 用户登录
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/api/users/login", data);
    return response.data;
  },

  // 获取全部用户
  list: async () => {
    const response = await apiClient.get("/api/users");
    return response.data?.data || response.data || [];
  },

  stats: async () => {
    const response = await apiClient.get("/api/users/stats");
    return (response.data?.data || response.data) as UserStatsResponse;
  },

  resetPassword: async (id: number, newPassword?: string) => {
    const response = await apiClient.post(`/api/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data?.data || response.data;
  },

  updateStatus: async (id: number, status: number) => {
    const response = await apiClient.put(`/api/users/${id}/status`, { status });
    return response.data?.data || response.data;
  },
};

export default apiClient;

