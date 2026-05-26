import apiClient from "./api";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type SupportTicket = {
  id: number;
  subject: string;
  content: string;
  userName: string;
  contactInfo: string;
  status: TicketStatus;
  priority: TicketPriority;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketPage = {
  content: SupportTicket[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type SupportTicketRequest = {
  subject: string;
  content: string;
  userName: string;
  contactInfo: string;
  priority?: TicketPriority;
};

export type SupportTicketReplyRequest = {
  status?: TicketStatus;
  adminReply?: string;
};

export const ticketApi = {
  submit(data: SupportTicketRequest) {
    return apiClient.post("/api/tickets", data).then((res) => res.data?.data);
  },
  list(params?: { page?: number; size?: number; status?: TicketStatus }) {
    return apiClient
      .get("/api/tickets", { params })
      .then((res) => res.data?.data as SupportTicketPage);
  },
  get(id: number) {
    return apiClient
      .get(`/api/tickets/${id}`)
      .then((res) => res.data?.data as SupportTicket);
  },
  update(id: number, payload: SupportTicketReplyRequest) {
    return apiClient
      .put(`/api/tickets/${id}`, payload)
      .then((res) => res.data?.data as SupportTicket);
  },
  remove(id: number) {
    return apiClient.delete(`/api/tickets/${id}`);
  },
};

