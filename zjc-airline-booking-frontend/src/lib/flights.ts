import apiClient from "./api";

export interface FlightQuery {
  date?: string;
  from?: string;
  to?: string;
}

export interface FlightSeat {
  id?: number;
  cabinClass: string;
  price: number;
  remainingSeats: number;
  totalSeats: number;
}

export interface Flight {
  id: string;
  flightId: number;
  flightNumber: string;
  airline: string;
  aircraftType?: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  price: number;
  seatsLeft: number;
  seats?: FlightSeat[];  // 新增：各舱位详细信息
  planeType?: string;
  status?: "ON_TIME" | "DELAYED" | "CANCELLED" | string;
  remarks?: string;
}

interface FlightSeatEntity {
  id?: number;
  cabinClass?: string;
  price?: number;
  remainingSeats?: number;
  totalSeats?: number;
}

interface FlightApiEntity {
  id?: number | string;
  flightNumber?: string;
  airline?: string;
  aircraftType?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  price?: number;
  seatsAvailable?: number;
  remainingSeats?: number;
  seats?: FlightSeatEntity[];  // 新增：舱位数组
  planeType?: string;
  status?: string;
  remarks?: string;
}

const statusMap: Record<string, Flight["status"]> = {
  ON_TIME: "ON_TIME",
  DELAYED: "DELAYED",
  CANCELLED: "CANCELLED",
  CANCEL: "CANCELLED",
};

const toDuration = (depart?: string, arrive?: string, fallback?: string) => {
  if (!depart || !arrive) return fallback || "--";
  const start = new Date(depart).getTime();
  const end = new Date(arrive).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return fallback || "--";
  }
  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins}m`;
};

const mapFlight = (data: FlightApiEntity): Flight => {
  try {
    const departTime = data.departureTime || new Date().toISOString();
    const arriveTime = data.arrivalTime || departTime;
    // 区分航空公司和机型
    const airline = data.airline || "";
    const planeType = data.aircraftType || data.planeType || "";
    
    // 从 seats 数组计算总剩余座位数和最低价格
    let totalRemainingSeats = 0;
    let minPrice = 0;
    
    if (data.seats && Array.isArray(data.seats) && data.seats.length > 0) {
      // 计算总剩余座位数（所有舱位相加）
      totalRemainingSeats = data.seats.reduce((sum, seat) => {
        return sum + (Number(seat.remainingSeats) || 0);
      }, 0);
      
      // 计算最低价格（所有舱位中的最低价）
      const prices = data.seats
        .map(seat => Number(seat.price || 0))
        .filter(price => price > 0);
      minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      
      console.log(`Flight ${data.flightNumber}: seats=${data.seats.length}, totalRemaining=${totalRemainingSeats}, minPrice=${minPrice}`);
    } else {
      // 兼容旧数据结构（如果没有 seats 数组，使用原有字段）
      totalRemainingSeats = Number(data.seatsAvailable ?? data.remainingSeats ?? 0);
      minPrice = Number(data.price ?? 0);
      console.log(`Flight ${data.flightNumber}: using legacy fields, seatsLeft=${totalRemainingSeats}, price=${minPrice}`);
    }
    
    // 转换 seats 数组格式
    const seats: FlightSeat[] | undefined = data.seats && Array.isArray(data.seats) 
      ? data.seats.map(seat => ({
          id: seat.id,
          cabinClass: seat.cabinClass || "",
          price: Number(seat.price || 0),
          remainingSeats: Number(seat.remainingSeats || 0),
          totalSeats: Number(seat.totalSeats || 0),
        }))
      : undefined;
    
    return {
      id: data.flightNumber || String(data.id ?? Date.now()),
      flightId: Number(data.id ?? 0),
      flightNumber: data.flightNumber || "未知航班",
      airline,
      aircraftType: planeType,
      from: data.origin || "未知出发地",
      to: data.destination || "未知目的地",
      departTime,
      arriveTime,
      duration: data.duration || toDuration(departTime, arriveTime),
      price: minPrice,
      seatsLeft: totalRemainingSeats,
      seats,  // 保存各舱位详细信息
      planeType,
      status: statusMap[data.status || ""] || data.status || "ON_TIME",
      remarks: data.remarks,
    };
  } catch (error) {
    console.error("Error mapping flight data:", error, data);
    throw error;
  }
};

const formatDateTime = (date?: string) => {
  if (!date) return undefined;
  // 处理 yyyy-MM-dd 格式
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `${date}T00:00:00`;
  }
  // 如果已经包含时间，直接返回
  if (date.includes("T")) {
    return date;
  }
  // 处理其他格式
  return date;
};

const normalizeResponse = (data: any) => {
  console.log("normalizeResponse input:", data);
  
  // 如果直接是数组，直接返回
  if (Array.isArray(data)) {
    console.log("Data is already an array, length:", data.length);
    return data;
  }
  
  const candidateArrays: Array<{ arr?: any[]; label: string }> = [
    { arr: data?.data, label: "data.data" },
    { arr: data?.data?.records, label: "data.data.records" },
    { arr: data?.data?.list, label: "data.data.list" },
    { arr: data?.data?.rows, label: "data.data.rows" },
    { arr: data?.data?.content, label: "data.data.content" },
    { arr: data?.records, label: "data.records" },
    { arr: data?.list, label: "data.list" },
    { arr: data?.rows, label: "data.rows" },
    { arr: data?.content, label: "data.content" },
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate.arr)) {
      console.log(`Data found in ${candidate.label}, length:`, candidate.arr.length);
      return candidate.arr;
    }
  }
  
  console.warn("No array found in response data, returning empty array");
  return [];
};

const normalizeEntity = (data: any) => {
  if (data?.data) return data.data;
  return data;
};

const ensureDateTime = (value?: string) => {
  if (!value) return value;
  // if already has seconds
  if (value.length === 16) {
    return `${value}:00`;
  }
  return value;
};

export interface FlightSeatPayload {
  cabinClass: string;
  price: number;
  totalSeats: number;
  remainingSeats: number;
}

export interface FlightPayload {
  flightNumber: string;
  aircraftType: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  remarks?: string;
  seats: FlightSeatPayload[];
}

type FlightListOptions = {
  includePast?: boolean;
};

export const flightApi = {
  async listAll(options: FlightListOptions = {}): Promise<Flight[]> {
    const params = options.includePast ? { includePast: options.includePast } : undefined;
    const resp = await apiClient.get("/api/flights", { params });
    return normalizeResponse(resp.data).map(mapFlight);
  },

  async listAvailable(): Promise<Flight[]> {
    const resp = await apiClient.get("/api/flights/available");
    return normalizeResponse(resp.data).map(mapFlight);
  },

  async recommendations(options: { limit?: number; includePast?: boolean } = {}): Promise<Flight[]> {
    const params: Record<string, number | boolean> = {};
    if (typeof options.limit === "number") {
      params.limit = options.limit;
    }
    if (typeof options.includePast === "boolean") {
      params.includePast = options.includePast;
    }
    const resp = await apiClient.get("/api/flights/recommendations", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return normalizeResponse(resp.data).map(mapFlight);
  },

  async searchCities(keyword = "", limit = 20): Promise<string[]> {
    const params: Record<string, string | number> = { limit };
    const trimmed = keyword.trim();
    if (trimmed.length > 0) {
      params.keyword = trimmed;
    }
    const resp = await apiClient.get("/api/flights/cities", { params });
    return normalizeResponse(resp.data);
  },

  async search(query: FlightQuery = {}): Promise<Flight[]> {
    const hasFilters = !!(query.from || query.to || query.date);
    // 构建请求体，只包含有值的字段
    const payload: Record<string, string> = {};
    if (query.from?.trim()) {
      payload.origin = query.from.trim();
    }
    if (query.to?.trim()) {
      payload.destination = query.to.trim();
    }
    const formattedDate = formatDateTime(query.date);
    if (formattedDate) {
      payload.departureDate = formattedDate;
    }

    try {
      console.log("Search flights payload:", payload);
      const response = await apiClient.post("/api/flights/search", payload);
      const normalized = normalizeResponse(response.data);
      console.log("Search flights response:", {
        raw: response.data,
        normalized,
        count: normalized.length,
      });
      return normalized.map(mapFlight);
    } catch (error: any) {
      console.warn("Search API failed, fallback to listAll when possible", error);
      if (!hasFilters) {
        try {
          const resp = await apiClient.get("/api/flights");
          const normalized = normalizeResponse(resp.data);
          console.log("Fallback flights response:", {
            raw: resp.data,
            normalized,
            count: normalized.length,
          });
          return normalized.map(mapFlight);
        } catch (fallbackError) {
          console.error("Fallback listAll failed:", fallbackError);
        }
      }
      console.error("获取航班数据失败：", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });

      let friendlyMessage = "";
      if (error?.response?.data?.message) {
        friendlyMessage = error.response.data.message;
      } else if (error?.response?.status) {
        const status = error.response.status;
        if (status >= 500) {
          friendlyMessage = "服务器暂时不可用，请稍后重试";
        } else if (status === 404) {
          friendlyMessage = "未找到航班数据，请确认接口地址";
        }
      } else if (error?.message?.toLowerCase().includes("network")) {
        friendlyMessage = "无法连接到后端服务，请确认 http://localhost:8080 已启动";
      }

      const err = new Error(friendlyMessage || error?.message || "获取航班数据失败");
      throw err;
    }
  },

  async create(payload: FlightPayload): Promise<Flight> {
    const body = {
      ...payload,
      departureTime: ensureDateTime(payload.departureTime),
      arrivalTime: ensureDateTime(payload.arrivalTime),
      seats: payload.seats?.map((seat) => ({
        cabinClass: seat.cabinClass,
        price: seat.price,
        totalSeats: seat.totalSeats,
        remainingSeats: seat.remainingSeats,
      })) ?? [],
    };
    const resp = await apiClient.post("/api/flights", body);
    return mapFlight(normalizeEntity(resp.data));
  },

  async update(id: number, payload: FlightPayload): Promise<Flight> {
    const body = {
      ...payload,
      departureTime: ensureDateTime(payload.departureTime),
      arrivalTime: ensureDateTime(payload.arrivalTime),
      seats: payload.seats?.map((seat) => ({
        cabinClass: seat.cabinClass,
        price: seat.price,
        totalSeats: seat.totalSeats,
        remainingSeats: seat.remainingSeats,
      })) ?? [],
    };
    const resp = await apiClient.put(`/api/flights/${id}`, body);
    return mapFlight(normalizeEntity(resp.data));
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/api/flights/${id}`);
  },
};
