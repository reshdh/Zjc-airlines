import apiClient from "./api";
import { UserInfo } from "./auth";

export interface UserPayload {
  username: string;
  password?: string;
  fullName: string;
  idNumber: string;
  phone: string;
  address: string;
  email?: string;
  role?: string;
}

const mapUser = (data: any): UserInfo => ({
  id: data.id ? String(data.id) : undefined,
  username: data.username,
  fullName: data.fullName,
  email: data.email,
  phone: data.phone,
  address: data.address,
  idNumber: data.idNumber,
  role: data.role,
});

const unwrap = (response: any) => {
  if (!response) return null;
  if (response.data && response.data.data !== undefined) {
    return response.data.data;
  }
  if (response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const userApiV2 = {
  async list(): Promise<UserInfo[]> {
    const response = await apiClient.get("/api/users");
    const data = unwrap(response);
    if (Array.isArray(data)) {
      return data.map(mapUser);
    }
    if (Array.isArray(data?.records)) {
      return data.records.map(mapUser);
    }
    return [];
  },
  async get(id: string | number): Promise<UserInfo | null> {
    const response = await apiClient.get(`/api/users/${id}`);
    const data = unwrap(response);
    return data ? mapUser(data) : null;
  },
  async create(payload: UserPayload): Promise<UserInfo> {
    const response = await apiClient.post("/api/users", payload);
    const data = unwrap(response);
    return mapUser(data);
  },
  async update(id: string | number, payload: Partial<UserPayload>): Promise<UserInfo> {
    const response = await apiClient.put(`/api/users/${id}`, payload);
    const data = unwrap(response);
    return mapUser(data);
  },
  async remove(id: string | number): Promise<void> {
    await apiClient.delete(`/api/users/${id}`);
  },
};








