import apiClient from "./api";
import { UserInfo } from "./auth";

export interface UserEntity {
  id?: number | string;
  username?: string;
  name?: string; // 数据库字段名
  fullName?: string; // 兼容字段
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  role?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
  walletBalance?: number;
}

export interface ProfileStat {
  label: string;
  value: number;
  help?: string;
}

export interface BookingSummary {
  id: string;
  flightNumber: string;
  from?: string;
  to?: string;
  route?: string;
  tickets?: number;
  amount?: number;
  status?: string;
  createdAt?: string;
}

const unwrap = <T = any>(response: any): T => {
  if (!response) return {} as T;
  if (response.data && response.data.data !== undefined) {
    return response.data.data as T;
  }
  if (response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
};

const mapUser = (data: UserEntity): UserInfo => {
  // 优先使用 name 字段（数据库字段名），如果没有则使用 fullName
  const fullName = data.name || data.fullName;
  console.log("mapUser - raw data:", data, "mapped fullName:", fullName);
  
  return {
    id: data.id ? String(data.id) : undefined,
    username: data.username,
    fullName: fullName,
    name: data.name, // 同时保存 name 字段，确保兼容性
    email: data.email,
    phone: data.phone,
    address: data.address,
    idNumber: data.idNumber,
    role: data.role,
    status: data.status,
    walletBalance:
      data.walletBalance !== undefined && data.walletBalance !== null
        ? Number(data.walletBalance)
        : undefined,
  };
};

export const profileApi = {
  async getProfile(): Promise<UserInfo | null> {
    try {
      // 从本地存储获取用户ID
      const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zjc_airline_auth') || '{}') : null;
      if (!auth?.id) {
        console.warn("无法获取用户ID");
        return null;
      }
      const response = await apiClient.get(`/api/users/${auth.id}`);
      console.log("getProfile - raw response:", response.data);
      const data = unwrap<UserEntity>(response);
      console.log("getProfile - unwrapped data:", data);
      const mapped = data ? mapUser(data) : null;
      console.log("getProfile - mapped user:", mapped);
      return mapped;
    } catch (error) {
      console.warn("获取用户信息失败：", error);
      throw error;
    }
  },
  async getUserById(userId: string | number): Promise<UserInfo | null> {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      const data = unwrap<UserEntity>(response);
      return data ? mapUser(data) : null;
    } catch (error) {
      console.warn("获取用户详情失败：", error);
      throw error;
    }
  },
  async listUsers(): Promise<UserInfo[]> {
    try {
      const response = await apiClient.get("/api/users");
      const data = unwrap<UserEntity[]>(response);
      if (Array.isArray(data)) {
        return data.map(mapUser);
      }
      return [];
    } catch (error) {
      console.warn("获取用户列表失败：", error);
      throw error;
    }
  },
  async getStats(): Promise<ProfileStat[]> {
    try {
      const response = await apiClient.get("/api/bookings/stats");
      const data = unwrap<ProfileStat[]>(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("获取用户统计失败：", error);
      throw error;
    }
  },
  // 获取全部订单（用于统计）
  async getAllBookings(userId?: string | number): Promise<BookingSummary[]> {
    try {
      // 如果没有提供userId，从本地存储获取
      let currentUserId = userId;
      if (!currentUserId) {
        const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zjc_airline_auth') || '{}') : null;
        currentUserId = auth?.id;
      }
      
      if (!currentUserId) {
        console.warn("无法获取用户ID，无法获取订单");
        return [];
      }
      
      // 调用用户订单接口，获取该用户的所有订单
      const response = await apiClient.get(`/api/bookings/user/${currentUserId}`);
      const data = unwrap<any[]>(response);
      if (!Array.isArray(data)) {
        return [];
      }
      
      // 按创建时间降序排序
      const sortedData = data.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      // 映射后端返回的Booking实体数据
      return sortedData.map((item: any) => {
        const flight = item.flight || {};
        const status = item.status || "CREATED";
        // 状态映射
        const statusMap: Record<string, string> = {
          CREATED: "待支付",
          PAID: "已出票",
          CANCELED: "已取消",
        };
        
        return {
          id: String(item.id || ""),
          flightNumber: flight.flightNumber || "未知航班",
          from: flight.origin || "",
          to: flight.destination || "",
          route: flight.origin && flight.destination 
            ? `${flight.origin} → ${flight.destination}` 
            : undefined,
          tickets: item.ticketCount || 0,
          amount: item.totalAmount ? Number(item.totalAmount) : 0,
          status: statusMap[status] || status,
          createdAt: item.createdAt || "",
        };
      });
    } catch (error) {
      console.warn("获取全部订单信息失败：", error);
      throw error;
    }
  },

  // 获取最近订单（用于显示）
  async getRecentBookings(userId?: string | number, limit: number = 6): Promise<BookingSummary[]> {
    try {
      // 如果没有提供userId，从本地存储获取
      let currentUserId = userId;
      if (!currentUserId) {
        const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('zjc_airline_auth') || '{}') : null;
        currentUserId = auth?.id;
      }
      
      if (!currentUserId) {
        console.warn("无法获取用户ID，无法获取订单");
        return [];
      }
      
      // 调用用户订单接口，获取该用户的所有订单
      const response = await apiClient.get(`/api/bookings/user/${currentUserId}`);
      const data = unwrap<any[]>(response);
      if (!Array.isArray(data)) {
        return [];
      }
      
      // 按创建时间降序排序，取前limit条
      const sortedData = data
        .sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, limit);
      
      // 映射后端返回的Booking实体数据
      return sortedData.map((item: any) => {
        const flight = item.flight || {};
        const status = item.status || "CREATED";
        // 状态映射
        const statusMap: Record<string, string> = {
          CREATED: "待支付",
          PAID: "已出票",
          CANCELED: "已取消",
        };
        
        return {
          id: String(item.id || ""),
          flightNumber: flight.flightNumber || "未知航班",
          from: flight.origin || "",
          to: flight.destination || "",
          route: flight.origin && flight.destination 
            ? `${flight.origin} → ${flight.destination}` 
            : undefined,
          tickets: item.ticketCount || 0,
          amount: item.totalAmount ? Number(item.totalAmount) : 0,
          status: statusMap[status] || status,
          createdAt: item.createdAt || "",
        };
      });
    } catch (error) {
      console.warn("获取订单信息失败：", error);
      throw error;
    }
  },
  async updateProfile(userId: string | number, payload: Partial<UserEntity>): Promise<UserInfo> {
    try {
      const response = await apiClient.put(`/api/users/${userId}`, payload);
      const data = unwrap<UserEntity>(response);
      return mapUser(data);
    } catch (error) {
      console.warn("更新用户信息失败：", error);
      throw error;
    }
  },
  async changePassword(userId: string | number, oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.put(`/api/users/${userId}/change-password`, {
        oldPassword,
        newPassword,
      });
    } catch (error) {
      console.warn("修改密码失败：", error);
      throw error;
    }
  },
  async rechargeWallet(amount: number): Promise<UserInfo> {
    if (!amount || amount <= 0) {
      throw new Error("充值金额必须大于 0");
    }
    const auth =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("zjc_airline_auth") || "{}")
        : null;
    if (!auth?.id) {
      throw new Error("未找到登录信息，请重新登录");
    }
    const response = await apiClient.post(`/api/users/${auth.id}/wallet/recharge`, {
      amount,
    });
    const data = unwrap<UserEntity>(response);
    const mapped = data ? mapUser(data) : null;
    if (!mapped) {
      throw new Error("充值失败，请稍后再试");
    }
    const mergedUser = { ...auth, ...mapped };
    if (typeof window !== "undefined") {
      localStorage.setItem("zjc_airline_auth", JSON.stringify(mergedUser));
    }
    return mergedUser;
  },
  async withdrawWallet(amount: number): Promise<UserInfo> {
    if (!amount || amount <= 0) {
      throw new Error("提现金额必须大于 0");
    }
    const auth =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("zjc_airline_auth") || "{}")
        : null;
    if (!auth?.id) {
      throw new Error("未找到登录信息，请重新登录");
    }
    const currentBalance = auth.walletBalance || 0;
    if (amount > currentBalance) {
      throw new Error("提现金额不能大于钱包余额");
    }
    try {
      const url = `/api/users/${auth.id}/wallet/withdraw`;
      console.log("[提现API] 请求URL:", url);
      console.log("[提现API] API_BASE_URL:", apiClient.defaults.baseURL);
      const response = await apiClient.post(url, {
        amount,
      });
      const data = unwrap<UserEntity>(response);
      const mapped = data ? mapUser(data) : null;
      if (!mapped) {
        throw new Error("提现失败，请稍后再试");
      }
      const mergedUser = { ...auth, ...mapped };
      if (typeof window !== "undefined") {
        localStorage.setItem("zjc_airline_auth", JSON.stringify(mergedUser));
      }
      return mergedUser;
    } catch (error: any) {
      console.error("[提现API] 错误详情:", error);
      if (error?.response) {
        console.error("[提现API] 响应状态:", error.response.status);
        console.error("[提现API] 响应数据:", error.response.data);
      }
      if (error?.request) {
        console.error("[提现API] 请求URL:", error.request.responseURL || error.config?.url);
      }
      throw error;
    }
  },
};

