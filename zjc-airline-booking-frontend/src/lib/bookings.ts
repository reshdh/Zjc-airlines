import dayjs from "dayjs";
import apiClient from "./api";

export interface PassengerPayload {
  name: string;
  idNumber: string;
  phone: string;
}

export interface BookingRequest {
  flightId: number;
  userId: number;
  cabinClass: string;
  ticketCount: number;
  payLater?: boolean;
  selectedSeatColumns?: string[]; // 选择的座位列号，如 ["A", "B"] 或 ["C", "D"]（可选）
  passengers?: PassengerPayload[];
}

export interface BookingResponse {
  success?: boolean;
  code?: number;
  message?: string;
  data?: any;
}

export type BookingStatus = "待支付" | "已出票" | "已取消" | string;

export interface BookingItem {
  id: string;
  orderNo?: string;
  flightNumber: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime?: string;
  tickets: number;
  amount: number;
  status: BookingStatus;
  createdAt: string;
  cabinClass?: string;
  paymentDueAt?: string;
  refundReason?: string;
  refundRejectReason?: string;
  urgentSurchargeRate?: number;
  refundFeeRate?: number;
  refundFeeAmount?: number;
  originalBookingId?: number;
  changeFeeAmount?: number;
  changeReason?: string;
  originalFlightId?: number;
  originalCabinClass?: string;
  originalTotalAmount?: number;
  passengerSeats?: PassengerSeatInfo[];
}

export interface PassengerSeatInfo {
  passengerName?: string;
  seatNumber?: string;
  seatRow?: number;
  seatColumn?: string;
  cabinClass?: string;
}

export interface ChangeBookingRequest {
  newFlightId: number;
  newCabinClass: string;
  newTicketCount?: number;
  changeReason?: string;
}

export interface ChangePriceResponse {
  newAmount: number;
  refundAmount: number;
  changeFee: number;
  priceDifference: number; // 正数需补款，负数退款
}

export interface BookingListQuery {
  status?: string;
  userId?: number;
}

const statusLabelMap: Record<string, BookingStatus> = {
  CREATED: "待支付",
  PAID: "已出票",
  CANCELED: "已取消",
  REFUND_REVIEW: "退票待审",
  REFUND_REJECTED: "退票被拒",
};

interface BookingApiEntity {
  id?: number | string;
  orderNo?: string;
  cabinClass?: string;
  paymentDueAt?: string;
  refundReason?: string;
  refundRejectReason?: string;
  urgentSurchargeRate?: number;
  refundFeeRate?: number;
  refundFeeAmount?: number;
  originalBookingId?: number;
  changeFeeAmount?: number;
  changeReason?: string;
  originalFlightId?: number;
  originalCabinClass?: string;
  originalTotalAmount?: number;
  bookingSeats?: Array<{
    passengerName?: string;
    passengerIndex?: number;
    seat?: {
      seatNumber?: string;
      seatRow?: number;
      seatColumn?: string;
      cabinClass?: string;
    };
  }>;
  flight?: {
    id?: number | string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
    price?: number;
  };
  ticketCount?: number;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

function mapBooking(item: BookingApiEntity): BookingItem {
  const flight = item.flight || {};
  const status = statusLabelMap[item.status || ""] || item.status || "待支付";
  const passengerSeats: PassengerSeatInfo[] = Array.isArray(item.bookingSeats)
    ? item.bookingSeats.map((seat) => {
        const seatRowValue = seat?.seat?.seatRow;
        const seatRow =
          typeof seatRowValue === "number"
            ? seatRowValue
            : typeof seatRowValue === "string" && seatRowValue.trim() !== ""
            ? Number(seatRowValue)
            : undefined;
        return {
          passengerName: seat?.passengerName,
          seatNumber: seat?.seat?.seatNumber,
          seatRow: Number.isFinite(seatRow) ? seatRow : undefined,
          seatColumn: seat?.seat?.seatColumn,
          cabinClass: seat?.seat?.cabinClass || item.cabinClass,
        };
      })
    : [];

  const id = item.id ?? item.orderNo ?? `BK${Date.now()}`;
  const orderNo =
    item.orderNo || `BK${String(item.id ?? Date.now()).padStart(6, "0")}`;

  return {
    id: String(id),
    orderNo,
    flightNumber: flight.flightNumber || "未知航班",
    from: flight.origin || "未知出发地",
    to: flight.destination || "未知目的地",
    departTime: flight.departureTime || new Date().toISOString(),
    arriveTime: flight.arrivalTime || undefined,
    tickets: item.ticketCount ?? 0,
    amount: Number(item.totalAmount ?? flight.price ?? 0),
    status,
    createdAt: item.createdAt || flight.departureTime || new Date().toISOString(),
    cabinClass: item.cabinClass,
    paymentDueAt: item.paymentDueAt,
    refundReason: item.refundReason,
    refundRejectReason: item.refundRejectReason,
    urgentSurchargeRate:
      typeof item.urgentSurchargeRate === "number" ? item.urgentSurchargeRate : undefined,
    refundFeeRate:
      typeof item.refundFeeRate === "number" ? item.refundFeeRate : undefined,
    refundFeeAmount:
      typeof item.refundFeeAmount === "number" ? item.refundFeeAmount : undefined,
    originalBookingId: item.originalBookingId,
    changeFeeAmount:
      typeof item.changeFeeAmount === "number" ? item.changeFeeAmount : undefined,
    changeReason: item.changeReason,
    originalFlightId: item.originalFlightId,
    originalCabinClass: item.originalCabinClass,
    originalTotalAmount:
      typeof item.originalTotalAmount === "number" ? item.originalTotalAmount : undefined,
    passengerSeats: passengerSeats,
  };
}

export const bookingApi = {
  async create(payload: BookingRequest): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>("/api/bookings", payload);
    return response.data;
  },

  async list(query: BookingListQuery = {}): Promise<BookingItem[]> {
    const { userId, status } = query;
    const url =
      typeof userId === "number"
        ? `/api/bookings/user/${userId}`
        : "/api/bookings";
    const response = await apiClient.get(url);

    const payload = response.data;
    const candidateArrays: unknown[] = [
      payload?.data,
      payload?.data?.records,
      payload?.data?.list,
      payload?.data?.rows,
      payload?.data?.content,
      payload?.records,
      payload?.list,
      payload?.rows,
      payload?.content,
      payload,
    ];

    const raw = candidateArrays.find((item): item is BookingApiEntity[] => Array.isArray(item)) ?? [];
    const list = raw.map(mapBooking);

    const sorted = list.sort(
      (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );

    if (status && status !== "ALL") {
      return sorted.filter((item) => item.status === status);
    }
    return sorted;
  },

  async pay(bookingId: string | number, userId: number): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(
      `/api/bookings/${bookingId}/pay`,
      { userId }
    );
    return response.data;
  },

  async cancel(bookingId: string | number, userId: number): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(
      `/api/bookings/${bookingId}/cancel`,
      { userId }
    );
    return response.data;
  },

  async requestRefund(
    bookingId: string | number,
    payload: { userId: number; reason?: string }
  ): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(
      `/api/bookings/${bookingId}/refund-request`,
      payload
    );
    return response.data;
  },

  async reviewRefund(
    bookingId: string | number,
    payload: { approve: boolean; reason?: string }
  ): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(
      `/api/bookings/${bookingId}/refund-review`,
      payload
    );
    return response.data;
  },

  async checkCanChange(
    bookingId: string | number,
    userId: number
  ): Promise<boolean> {
    try {
      const url = `/api/bookings/${bookingId}/change/check`;
      console.log("[改签API] 请求URL:", url);
      console.log("[改签API] 参数:", { bookingId, userId });
      console.log("[改签API] API_BASE_URL:", apiClient.defaults.baseURL);
      const response = await apiClient.get<BookingResponse>(url, {
        params: { userId },
      });
      console.log("[改签API] 响应:", response.data);
      if (response.data?.success === false || (response.data?.code !== undefined && response.data?.code !== 200 && response.data?.code !== 0)) {
        throw new Error(response.data?.message || "检查改签状态失败");
      }
      return response.data?.data ?? false;
    } catch (error: any) {
      console.error("[改签API] 错误详情:", error);
      if (error?.response) {
        console.error("[改签API] 响应状态:", error.response.status);
        console.error("[改签API] 响应数据:", error.response.data);
        if (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('No static resource')) {
          console.error("[改签API] 错误：请求被发送到了Next.js服务器，请确保后端服务正在运行且已重启以加载新路由");
          console.error("[改签API] 当前API_BASE_URL:", apiClient.defaults.baseURL);
        }
      }
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async calculateChangePrice(
    bookingId: string | number,
    userId: number,
    request: ChangeBookingRequest
  ): Promise<ChangePriceResponse> {
    const response = await apiClient.post<{ data: ChangePriceResponse }>(
      `/api/bookings/${bookingId}/change/price`,
      request,
      { params: { userId } }
    );
    return response.data?.data ?? {
      newAmount: 0,
      refundAmount: 0,
      changeFee: 0,
      priceDifference: 0,
    };
  },

  async changeBooking(
    bookingId: string | number,
    userId: number,
    request: ChangeBookingRequest
  ): Promise<BookingResponse> {
    const response = await apiClient.post<BookingResponse>(
      `/api/bookings/${bookingId}/change`,
      request,
      { params: { userId } }
    );
    return response.data;
  },
};

// 座位选择相关接口
export interface SeatSelectionResponse {
  availableColumns?: string[];
  columnAvailability?: Array<{
    column: string;
    availableCount: number;
  }>;
  assignedSeats?: string[];
  unavailableColumns?: string[];
}

export interface SeatSelectionRequest {
  flightId: number;
  cabinClass: string;
  ticketCount: number;
  selectedColumns: string[];
}

export const seatApi = {
  async getAvailableSeatColumns(
    flightId: number,
    cabinClass: string
  ): Promise<SeatSelectionResponse> {
    try {
      const response = await apiClient.get<{ data?: SeatSelectionResponse; code?: number; message?: string } | SeatSelectionResponse>(
        "/api/seats/available",
        {
          params: { flightId, cabinClass },
        }
      );
      // 处理不同的响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有 data 字段（包装格式）
        if ('data' in response.data && response.data.data) {
          return response.data.data;
        }
        // 如果响应直接是 SeatSelectionResponse 格式
        if ('availableColumns' in response.data || 'columnAvailability' in response.data) {
          return response.data as SeatSelectionResponse;
        }
      }
      return { availableColumns: [], columnAvailability: [] };
    } catch (error: any) {
      console.error("获取可用座位列失败:", error);
      // 返回空数据而不是抛出错误，避免影响用户体验
      return { availableColumns: [], columnAvailability: [] };
    }
  },

  async selectSeats(request: SeatSelectionRequest): Promise<SeatSelectionResponse> {
    try {
      const response = await apiClient.post<{ data?: SeatSelectionResponse; code?: number; message?: string } | SeatSelectionResponse>(
        "/api/seats/select",
        request
      );
      // 处理不同的响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有 data 字段（包装格式）
        if ('data' in response.data && response.data.data) {
          return response.data.data;
        }
        // 如果响应直接是 SeatSelectionResponse 格式
        if ('assignedSeats' in response.data || 'unavailableColumns' in response.data) {
          return response.data as SeatSelectionResponse;
        }
      }
      return { assignedSeats: [], unavailableColumns: [] };
    } catch (error: any) {
      console.error("选择座位失败:", error);
      throw error;
    }
  },
};
