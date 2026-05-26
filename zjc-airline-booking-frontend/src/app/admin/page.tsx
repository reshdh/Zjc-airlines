"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  SimpleGrid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Skeleton,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  Switch,
  useDisclosure,
  useToast,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import apiClient, { userApi, UserStatsResponse } from "@/lib/api";
import { clearAuth, getAuth, isAuthenticated } from "@/lib/auth";
import { flightApi, Flight, FlightPayload } from "@/lib/flights";
import { CityPicker } from "@/components/common/CityPicker";
import {
  SupportTicket,
  SupportTicketPage,
  TicketStatus,
  ticketApi,
} from "@/lib/tickets";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type AdminSection = "dashboard" | "flights" | "bookings" | "users" | "tickets";

type BookingEntity = {
  id: number;
  status: string;
  totalAmount: number;
  ticketCount: number;
  createdAt: string;
  paymentDueAt?: string;
  refundReason?: string;
  refundRejectReason?: string;
  urgentSurchargeRate?: number;
  refundFeeRate?: number;
  refundFeeAmount?: number;
  flight?: {
    id: number;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
  };
  user?: {
    name?: string;
    username?: string;
  };
};

type UserEntity = {
  id: number;
  name: string;
  username: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  status?: number;
};

type CabinClassKey = "ECONOMY" | "BUSINESS" | "FIRST";

type AircraftPresetKey = "SMALL" | "MEDIUM" | "LARGE";

type CabinFormValues = {
  enabled: boolean;
  price: string;
  totalSeats: string;
  remainingSeats: string;
};

const CABIN_CLASS_CONFIG: Record<CabinClassKey, { label: string; helper: string }> = {
  ECONOMY: { label: "经济舱", helper: "适合大众出行的基础舱位" },
  BUSINESS: { label: "商务舱", helper: "商务旅客的舒适空间" },
  FIRST: { label: "头等舱", helper: "尊享私密服务体验" },
};

const CABIN_CLASS_ORDER: CabinClassKey[] = ["ECONOMY", "BUSINESS", "FIRST"];

const AIRCRAFT_PRESETS: Record<
  AircraftPresetKey,
  {
    label: string;
    model: string;
    code: string;
    description: string;
    seats: Record<
      CabinClassKey,
      {
        total: number;
        price: number;
      }
    >;
  }
> = {
  SMALL: {
    label: "小型 · SkyWing 100",
    model: "SkyWing 100",
    code: "SW100",
    description: "短途支线机型，经济舱为主，商务舱少量座位",
    seats: {
      ECONOMY: { total: 102, price: 600 },
      BUSINESS: { total: 12, price: 1800 },
      FIRST: { total: 0, price: 0 },
    },
  },
  MEDIUM: {
    label: "中型 · SkyWing 300",
    model: "SkyWing 300",
    code: "SW300",
    description: "中长途骨干机型，三舱配置均衡",
    seats: {
      ECONOMY: { total: 181, price: 800 },
      BUSINESS: { total: 8, price: 2400 },
      FIRST: { total: 2, price: 5000 },
    },
  },
  LARGE: {
    label: "大型 · SkyWing 700",
    model: "SkyWing 700",
    code: "SW700",
    description: "远程宽体旗舰，三舱座位充足",
    seats: {
      ECONOMY: { total: 315, price: 1200 },
      BUSINESS: { total: 42, price: 3600 },
      FIRST: { total: 8, price: 8000 },
    },
  },
};

const createEmptyCabins = (): Record<CabinClassKey, CabinFormValues> => ({
  ECONOMY: { enabled: true, price: "", totalSeats: "", remainingSeats: "" },
  BUSINESS: { enabled: false, price: "", totalSeats: "", remainingSeats: "" },
  FIRST: { enabled: false, price: "", totalSeats: "", remainingSeats: "" },
});

type FlightFormValues = {
  flightNumber: string;
  aircraftType: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  remarks: string;
  cabins: Record<CabinClassKey, CabinFormValues>;
  aircraftPresetKey: AircraftPresetKey | null;
};

const createEmptyFlightForm = (): FlightFormValues => ({
  flightNumber: "",
  aircraftType: "",
  origin: "",
  destination: "",
  departureTime: "",
  arrivalTime: "",
  remarks: "",
  cabins: createEmptyCabins(),
  aircraftPresetKey: null,
});

const toInputDate = (value?: string) => {
  if (!value) return "";
  return dayjs(value).format("YYYY-MM-DDTHH:mm");
};

const buildFlightPayload = (values: FlightFormValues): FlightPayload => {
  const seats = CABIN_CLASS_ORDER.filter((key) => values.cabins[key].enabled).map((key) => {
    const seat = values.cabins[key];
    const total = Math.max(Number(seat.totalSeats) || 0, 0);
    const remainingRaw = seat.remainingSeats === ""
      ? total
      : Math.max(Number(seat.remainingSeats) || 0, 0);
    const remaining = Math.min(remainingRaw, total);
    return {
      cabinClass: key,
      price: Number(seat.price),
      totalSeats: total,
      remainingSeats: remaining,
    };
  });
  return {
    flightNumber: values.flightNumber.trim(),
    aircraftType: values.aircraftType.trim(),
    origin: values.origin.trim(),
    destination: values.destination.trim(),
    departureTime: values.departureTime,
    arrivalTime: values.arrivalTime,
    remarks: values.remarks.trim() || undefined,
    seats,
  };
};

const detectAircraftPresetKey = (typeName?: string): AircraftPresetKey | null => {
  if (!typeName) return null;
  const normalized = typeName.trim().toLowerCase();
  for (const [key, preset] of Object.entries(AIRCRAFT_PRESETS) as [AircraftPresetKey, typeof AIRCRAFT_PRESETS[AircraftPresetKey]][]) {
    if (
      preset.model.toLowerCase() === normalized ||
      preset.code.toLowerCase() === normalized ||
      preset.label.toLowerCase() === normalized
    ) {
      return key;
    }
  }
  return null;
};

const mapFlightCabins = (flight?: Flight): Record<CabinClassKey, CabinFormValues> => {
  const base = createEmptyCabins();
  if (!flight?.seats || flight.seats.length === 0) {
    return base;
  }
  flight.seats.forEach((seat) => {
    const key = (seat.cabinClass?.toUpperCase() || "") as CabinClassKey;
    if (!CABIN_CLASS_ORDER.includes(key)) {
      return;
    }
    base[key] = {
      enabled: true,
      price: seat.price !== undefined && seat.price !== null ? String(seat.price) : "",
      totalSeats: seat.totalSeats !== undefined && seat.totalSeats !== null ? String(seat.totalSeats) : "",
      remainingSeats:
        seat.remainingSeats !== undefined && seat.remainingSeats !== null
          ? String(seat.remainingSeats)
          : "",
    };
  });
  return base;
};

const sections: { id: AdminSection; label: string }[] = [
  { id: "dashboard", label: "概览仪表盘" },
  { id: "flights", label: "航班管理" },
  { id: "bookings", label: "订单管理" },
  { id: "users", label: "用户管理" },
  { id: "tickets", label: "工单中心" },
];

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  const formDisclosure = useDisclosure();
  const ticketDrawer = useDisclosure();
  const flightBookingDrawer = useDisclosure();

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [chartMode, setChartMode] = useState<"bar" | "line" | "pie">("bar");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingEntity[]>([]);
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [ticketPage, setTicketPage] = useState<SupportTicketPage | null>(null);
  const [ticketFilter, setTicketFilter] = useState<TicketStatus | "ALL">("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState({
    status: "",
    adminReply: "",
  });
  const refundReviewModal = useDisclosure();
  const [reviewBooking, setReviewBooking] = useState<BookingEntity | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject">("approve");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [flightBookingFlight, setFlightBookingFlight] = useState<Flight | null>(null);
  const [flightBookingsByFlight, setFlightBookingsByFlight] = useState<BookingEntity[]>([]);
  const [flightBookingLoading, setFlightBookingLoading] = useState(false);
  const [flightBookingError, setFlightBookingError] = useState<string | null>(null);
  const flightBookingStats = useMemo(() => {
    const totalOrders = flightBookingsByFlight.length;
    const totalTickets = flightBookingsByFlight.reduce((sum, booking) => sum + (booking.ticketCount || 0), 0);
    const paidOrders = flightBookingsByFlight.filter((booking) => booking.status === "PAID").length;
    const totalRevenue = flightBookingsByFlight.reduce((sum, booking) => {
      if (booking.status === "PAID") {
        return sum + Number(booking.totalAmount || 0);
      }
      return sum;
    }, 0);
    return { totalOrders, totalTickets, paidOrders, totalRevenue };
  }, [flightBookingsByFlight]);

  const [formValues, setFormValues] = useState<FlightFormValues>(createEmptyFlightForm());
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingFlightId, setEditingFlightId] = useState<number | null>(null);
  const [savingFlight, setSavingFlight] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [userActionLoadingId, setUserActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!isAuthenticated() || auth?.role?.toUpperCase() !== "ADMIN") {
      setAuthorized(false);
      setCheckingAuth(false);
      router.replace("/login");
      return;
    }
    setAuthorized(true);
    setCheckingAuth(false);
  }, [router]);

  const sortFlightsByNewest = (list: Flight[]) => {
    return [...list].sort((a, b) => {
      // 只按创建时间排序（最新的在最上面），不再使用出发时间作为备选
      const timeA = a.createdAt ? dayjs(a.createdAt).valueOf() : 0;
      const timeB = b.createdAt ? dayjs(b.createdAt).valueOf() : 0;
      // 如果创建时间相同或都不存在，按ID降序排列（ID越大说明越新）
      if (timeA === timeB && timeA === 0) {
        return (b.flightId || 0) - (a.flightId || 0);
      }
      return timeB - timeA;
    });
  };

  const loadFlights = async () => {
    const data = await flightApi.listAll({ includePast: true });
    setFlights(sortFlightsByNewest(data));
  };
  const handleFlightCityChange = useCallback(
    (field: "origin" | "destination") => (value: string) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: value?.trim() || "",
      }));
    },
    []
  );

  const loadBookings = async () => {
    const resp = await apiClient.get("/api/bookings");
    const bookingsData = resp.data?.data || resp.data || [];
    const sorted = [...bookingsData].sort((a: BookingEntity, b: BookingEntity) => {
      const timeA = a?.createdAt ? dayjs(a.createdAt).valueOf() : 0;
      const timeB = b?.createdAt ? dayjs(b.createdAt).valueOf() : 0;
      return timeB - timeA;
    });
    setBookings(sorted);
  };

  const loadUsers = async () => {
    const list = await userApi.list();
    setUsers(list);
  };

  const loadUserStats = async () => {
    try {
      const stats = await userApi.stats();
      setUserStats(stats);
    } catch (err) {
      console.warn("获取用户统计失败", err);
    }
  };

  const loadTickets = async (status = ticketFilter, page = 0) => {
    try {
      const pageData = await ticketApi.list({
        status: status === "ALL" ? undefined : status,
        page,
        size: 10,
      });
      setTicketPage(pageData);
    } catch (err: any) {
      console.warn("加载工单失败:", err);
      toast({
        status: "warning",
        description: err.response?.data?.message || err.message || "暂时无法获取工单列表",
      });
    }
  };

  const fetchFlightBookingsForFlight = async (flight: Flight, options: { silent?: boolean } = {}) => {
    setFlightBookingLoading(true);
    setFlightBookingError(null);
    try {
      const resp = await apiClient.get(`/api/bookings/flight/${flight.flightId}`);
      const raw = resp.data?.data || resp.data || [];
      const sorted = Array.isArray(raw)
        ? [...raw].sort((a: BookingEntity, b: BookingEntity) => {
            const timeA = a?.createdAt ? dayjs(a.createdAt).valueOf() : 0;
            const timeB = b?.createdAt ? dayjs(b.createdAt).valueOf() : 0;
            return timeB - timeA;
          })
        : [];
      setFlightBookingsByFlight(sorted);
      if (!options.silent) {
        toast({
          status: "success",
          description: "航班订单已刷新",
        });
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "加载航班订单失败";
      setFlightBookingError(message);
      toast({
        status: "error",
        title: "加载失败",
        description: message,
      });
    } finally {
      setFlightBookingLoading(false);
    }
  };

  const openFlightBookingsDrawer = (flight: Flight) => {
    setFlightBookingFlight(flight);
    setFlightBookingsByFlight([]);
    setFlightBookingError(null);
    flightBookingDrawer.onOpen();
    fetchFlightBookingsForFlight(flight, { silent: true });
  };

  const closeFlightBookingDrawer = () => {
    flightBookingDrawer.onClose();
    setFlightBookingFlight(null);
    setFlightBookingsByFlight([]);
    setFlightBookingError(null);
  };

  const handleRefreshFlightBookings = () => {
    if (flightBookingFlight) {
      fetchFlightBookingsForFlight(flightBookingFlight);
    }
  };

  const openRefundReview = (booking: BookingEntity, decision: "approve" | "reject") => {
    setReviewBooking(booking);
    setReviewDecision(decision);
    setReviewReason("");
    refundReviewModal.onOpen();
  };

  const handleSubmitRefundReview = async () => {
    if (!reviewBooking) return;
    if (reviewDecision === "reject" && !reviewReason.trim()) {
      toast({
        status: "warning",
        title: "请输入驳回理由",
      });
      return;
    }
    setReviewLoading(true);
    try {
      await apiClient.post(`/api/bookings/${reviewBooking.id}/refund-review`, {
        approve: reviewDecision === "approve",
        reason: reviewDecision === "reject" ? reviewReason.trim() : undefined,
      });
      toast({
        status: "success",
        title: reviewDecision === "approve" ? "已同意退票" : "已驳回退票",
      });
      refundReviewModal.onClose();
      setReviewBooking(null);
      setReviewReason("");
      await loadBookings();
    } catch (err: any) {
      toast({
        status: "error",
        title: "审核失败",
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadFlights(), loadBookings(), loadUsers(), loadUserStats(), loadTickets()]);
      } catch (err: any) {
        console.error("加载管理数据失败：", err);
        setError(err.response?.data?.message || err.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authorized]);

  const sortedBookings = useMemo(() => {
    const list = [...bookings];
    return list.sort((a, b) => {
      const timeA = a?.createdAt ? dayjs(a.createdAt).valueOf() : 0;
      const timeB = b?.createdAt ? dayjs(b.createdAt).valueOf() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [bookings]);

  const stats = useMemo(() => {
    const totalFlights = flights.length;
    const totalBookings = bookings.length;
    const totalUsers = users.length;
    const paidBookings = bookings.filter((b) => b.status === "PAID");
    const revenue = paidBookings.reduce(
      (sum, b) => sum + Number(b.totalAmount || 0),
      0
    );
    return { totalFlights, totalBookings, totalUsers, paidBookings: paidBookings.length, revenue };
  }, [flights, bookings, users]);

  const bookingStatusOrder: Array<{ key: string; label: string }> = [
    { key: "PAID", label: "已出票" },
    { key: "CREATED", label: "待支付" },
    { key: "CANCELED", label: "已取消" },
    { key: "REFUND_REVIEW", label: "退票待审" },
    { key: "REFUND_REJECTED", label: "退票驳回" },
  ];

  const bookingStatusLabelMap: Record<string, string> = {
    PAID: "已出票",
    CREATED: "待支付",
    CANCELED: "已取消",
    REFUND_REVIEW: "退票待审",
    REFUND_REJECTED: "退票被驳回",
  };

  const bookingChartData = useMemo(() => {
    const statusCount = bookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
    return bookingStatusOrder.map((item) => ({
      name: item.label,
      status: item.key,
      value: statusCount[item.key] || 0,
    }));
  }, [bookings]);

  const chartOptions = useMemo(() => {
    if (chartMode === "pie") {
      return {
        tooltip: { trigger: "item" },
        legend: { top: "bottom" },
        series: [
          {
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            label: { formatter: "{b}: {c}单 ({d}%)" },
            emphasis: { scale: true },
            data: bookingChartData,
          },
        ],
      };
    }
    const categories = bookingChartData.map((item) => item.name);
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 12, top: 20, bottom: 40 },
      xAxis: {
        type: "category",
        data: categories,
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { formatter: "{value} 单" },
      },
      series: [
        {
          type: chartMode,
          smooth: chartMode === "line",
          data: bookingChartData.map((item) => item.value),
          itemStyle: { color: chartMode === "bar" ? "#3182CE" : "#805AD5" },
          areaStyle: chartMode === "line" ? { opacity: 0.2 } : undefined,
        },
      ],
    };
  }, [chartMode, bookingChartData]);

  const openCreateFlight = () => {
    setFormMode("create");
    setEditingFlightId(null);
    setFormValues(createEmptyFlightForm());
    formDisclosure.onOpen();
  };

  const openEditFlight = (flight: Flight) => {
    setFormMode("edit");
    setEditingFlightId(flight.flightId);
    const cabins = mapFlightCabins(flight);
    setFormValues({
      flightNumber: flight.flightNumber,
      aircraftType: flight.planeType || flight.aircraftType || "",
      origin: flight.from,
      destination: flight.to,
      departureTime: toInputDate(flight.departTime),
      arrivalTime: toInputDate(flight.arriveTime),
      remarks: flight.remarks || "",
      cabins,
      aircraftPresetKey: detectAircraftPresetKey(flight.planeType || flight.aircraftType || ""),
    });
    formDisclosure.onOpen();
  };

  const validateFlightForm = (values: FlightFormValues) => {
    const required: Array<keyof FlightFormValues> = [
      "flightNumber",
      "aircraftType",
      "origin",
      "destination",
      "departureTime",
      "arrivalTime",
    ];
    for (const key of required) {
      if (!values[key]) {
        return "请完整填写所有必填项";
      }
    }
    const origin = values.origin.trim();
    const destination = values.destination.trim();
    if (origin && destination && origin === destination) {
      return "出发地和目的地不能相同，请重新选择";
    }
    const departTime = dayjs(values.departureTime);
    const arriveTime = dayjs(values.arrivalTime);
    if (!departTime.isValid() || !arriveTime.isValid()) {
      return "请填写有效的起飞与到达时间";
    }
    if (!arriveTime.isAfter(departTime)) {
      return "到达时间必须晚于起飞时间，请重新确认";
    }
    const enabledCabins = CABIN_CLASS_ORDER.filter((key) => values.cabins[key].enabled);
    if (enabledCabins.length === 0) {
      return "请至少启用一个舱位并填写票价/座位信息";
    }
    for (const key of enabledCabins) {
      const seat = values.cabins[key];
      const label = CABIN_CLASS_CONFIG[key].label;
      if (!seat.price || Number(seat.price) <= 0) {
        return `${label}票价必须大于 0`;
      }
      if (!seat.totalSeats || !Number.isInteger(Number(seat.totalSeats)) || Number(seat.totalSeats) <= 0) {
        return `${label}总座位数必须为正整数`;
      }
      if (
        seat.remainingSeats &&
        (!Number.isInteger(Number(seat.remainingSeats)) || Number(seat.remainingSeats) < 0)
      ) {
        return `${label}余票必须为非负整数`;
      }
      if (
        seat.remainingSeats &&
        Number(seat.remainingSeats) > Number(seat.totalSeats)
      ) {
        return `${label}余票不能大于总座位数`;
      }
    }
    return null;
  };

  const handleSaveFlight = async () => {
    const msg = validateFlightForm(formValues);
    if (msg) {
      toast({ status: "warning", description: msg });
      return;
    }
    const payload = buildFlightPayload(formValues);
    if (payload.seats.length === 0) {
      toast({ status: "warning", description: "请至少启用一个舱位" });
      return;
    }
    setSavingFlight(true);
    try {
      if (formMode === "create") {
        await flightApi.create(payload);
        toast({ status: "success", description: "航班创建成功" });
      } else if (editingFlightId) {
        await flightApi.update(editingFlightId, payload);
        toast({ status: "success", description: "航班更新成功" });
      }
      await loadFlights();
      formDisclosure.onClose();
    } catch (err: any) {
      toast({
        status: "error",
        description: err.response?.data?.message || err.message || "操作失败",
      });
    } finally {
      setSavingFlight(false);
    }
  };

  const handleDeleteFlight = async (flight: Flight) => {
    if (!window.confirm(`确定删除航班 ${flight.flightNumber} 吗？`)) return;
    setActionLoadingId(flight.flightId);
    try {
      await flightApi.remove(flight.flightId);
      toast({ status: "success", description: "航班已删除" });
      await loadFlights();
    } catch (err: any) {
      toast({
        status: "error",
        description: err.response?.data?.message || err.message || "删除失败",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setTicketReply({
      status: ticket.status,
      adminReply: ticket.adminReply || "",
    });
    ticketDrawer.onOpen();
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    try {
      await ticketApi.update(selectedTicket.id, ticketReply);
      toast({ status: "success", description: "工单已更新" });
      ticketDrawer.onClose();
      await loadTickets();
    } catch (err: any) {
      toast({
        status: "error",
        description: err.response?.data?.message || err.message || "更新失败",
      });
    }
  };

  const renderDashboard = () => (
    <VStack align="stretch" spacing={6}>
      <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
        <StatCard title="航班总数" value={stats.totalFlights} helper="当前数据库中的航班" />
        <StatCard title="订单总数" value={stats.totalBookings} helper="所有状态" />
        <StatCard title="注册用户" value={stats.totalUsers} helper="包含管理员" />
        <StatCard
          title="累计营收"
          value={`¥${stats.revenue.toLocaleString()}`}
          helper={`已出票订单 ${stats.paidBookings} 单`}
        />
      </Grid>

      <Box borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm" p={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">近期订单</Heading>
          <IconButton
            aria-label="刷新订单"
            icon={<RepeatIcon />}
            size="sm"
            onClick={() => loadBookings()}
          />
        </Flex>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th whiteSpace="nowrap">订单号</Th>
              <Th>乘客</Th>
              <Th>航班</Th>
              <Th>金额</Th>
              <Th>状态</Th>
              <Th>创建时间</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={6}>
                  <Skeleton height="18px" />
                </Td>
              </Tr>
            ) : (
              sortedBookings.slice(0, 7).map((booking) => (
                <Tr key={booking.id}>
                  <Td>#{booking.id}</Td>
                  <Td>{booking.user?.name || booking.user?.username || "—"}</Td>
                  <Td>{booking.flight?.flightNumber || "—"}</Td>
                  <Td>¥{Number(booking.totalAmount || 0).toLocaleString()}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        booking.status === "PAID"
                          ? "green"
                          : booking.status === "CANCELED"
                          ? "gray"
                          : "orange"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </Td>
                  <Td>{dayjs(booking.createdAt).format("YYYY-MM-DD HH:mm")}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );

  const renderFlights = () => (
    <VStack align="stretch" spacing={6}>
      <Flex justify="space-between" align="center">
        <Heading size="md">航班管理</Heading>
        <HStack>
          <Button variant="ghost" size="sm" onClick={loadFlights}>
            刷新
          </Button>
          <Button colorScheme="blue" size="sm" onClick={openCreateFlight}>
            新增航班
          </Button>
        </HStack>
      </Flex>
      <Box borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm" overflowX="auto">
        <Table size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>航班号</Th>
              <Th>航线</Th>
              <Th>时间</Th>
              <Th>票价</Th>
              <Th>余票</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {flights.map((flight) => (
              <Tr key={flight.flightId}>
                <Td fontWeight="semibold">{flight.flightNumber}</Td>
                <Td>
                  {flight.from} → {flight.to}
                </Td>
                <Td>
                  {dayjs(flight.departTime).format("MM/DD HH:mm")} -{" "}
                  {dayjs(flight.arriveTime).format("MM/DD HH:mm")}
                </Td>
                <Td>¥{Number(flight.price || 0).toLocaleString()}</Td>
                <Td>
                  <Badge colorScheme={flight.seatsLeft > 10 ? "green" : "orange"}>
                    {flight.seatsLeft}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="xs" variant="outline" onClick={() => openFlightBookingsDrawer(flight)}>
                      查看订单
                    </Button>
                    <Button size="xs" onClick={() => openEditFlight(flight)}>
                      编辑
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      isLoading={actionLoadingId === flight.flightId}
                      onClick={() => handleDeleteFlight(flight)}
                    >
                      删除
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
            {flights.length === 0 && !loading && (
              <Tr>
                <Td colSpan={6}>
                  <Text textAlign="center" color="gray.500">
                    暂无航班
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );

  const renderBookings = () => (
    <VStack align="stretch" spacing={6}>
      <Flex justify="space-between" align="center">
        <Heading size="md">订单管理</Heading>
        <Button variant="ghost" size="sm" leftIcon={<RepeatIcon />} onClick={loadBookings}>
          刷新
        </Button>
      </Flex>
      <Box borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm" overflowX="auto">
        <Table size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th whiteSpace="nowrap">订单号</Th>
              <Th whiteSpace="nowrap">乘客</Th>
              <Th whiteSpace="nowrap">航班</Th>
              <Th whiteSpace="nowrap">票数</Th>
              <Th whiteSpace="nowrap">金额</Th>
              <Th whiteSpace="nowrap">状态</Th>
              <Th whiteSpace="nowrap">创建时间</Th>
              <Th whiteSpace="nowrap">退票信息</Th>
              <Th whiteSpace="nowrap">操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedBookings.map((booking) => (
              <Tr key={booking.id}>
                <Td>#{booking.id}</Td>
                <Td whiteSpace="nowrap">
                  {booking.user?.name || booking.user?.username || "—"}
                </Td>
                <Td>{booking.flight?.flightNumber || "—"}</Td>
                <Td>{booking.ticketCount}</Td>
                <Td whiteSpace="nowrap">
                  <HStack spacing={2} align="center">
                    <Text fontWeight="semibold">
                      ¥{Number(booking.totalAmount || 0).toLocaleString()}
                    </Text>
                    {booking.urgentSurchargeRate && booking.urgentSurchargeRate > 0 && (
                      <Badge colorScheme="red" variant="subtle" whiteSpace="nowrap">
                        含临近起飞加价 10%
                      </Badge>
                    )}
                  </HStack>
                </Td>
                <Td>
                  <Badge
                    colorScheme={
                      booking.status === "PAID"
                        ? "green"
                        : booking.status === "CANCELED"
                        ? "gray"
                        : booking.status === "REFUND_REVIEW"
                        ? "purple"
                        : booking.status === "REFUND_REJECTED"
                        ? "red"
                        : "orange"
                    }
                  >
                    {bookingStatusLabelMap[booking.status] || booking.status}
                  </Badge>
                </Td>
                <Td>{dayjs(booking.createdAt).format("YYYY-MM-DD HH:mm")}</Td>
                <Td>
                  <VStack spacing={1} align="flex-start">
                    {booking.refundReason ? (
                      <Text fontSize="sm" color="gray.700">
                        原因：{booking.refundReason}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color="gray.400">
                        —
                      </Text>
                    )}
                    {booking.refundRejectReason && (
                      <Text fontSize="sm" color="red.500">
                        驳回：{booking.refundRejectReason}
                      </Text>
                    )}
                    {booking.refundFeeAmount && booking.refundFeeAmount > 0 && (
                      <Text fontSize="sm" color="purple.600">
                        手续费：¥
                        {Number(booking.refundFeeAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    )}
                  </VStack>
                </Td>
                <Td>
                  {booking.status === "REFUND_REVIEW" ? (
                    <ButtonGroup size="xs" variant="outline">
                      <Button
                        colorScheme="green"
                        onClick={() => openRefundReview(booking, "approve")}
                      >
                        同意
                      </Button>
                      <Button
                        colorScheme="red"
                        onClick={() => openRefundReview(booking, "reject")}
                      >
                        驳回
                      </Button>
                    </ButtonGroup>
                  ) : (
                    <Text fontSize="sm" color="gray.400">
                      —
                    </Text>
                  )}
                </Td>
              </Tr>
            ))}
            {bookings.length === 0 && !loading && (
              <Tr>
                <Td colSpan={9}>
                  <Text textAlign="center" color="gray.500">
                    暂无订单数据
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );

  const renderUsers = () => (
    <VStack align="stretch" spacing={6}>
      <Flex justify="space-between" align="center">
        <Heading size="md">用户管理</Heading>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            loadUsers();
            loadUserStats();
          }}
        >
          刷新
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <StatCard
          title="总用户"
          value={userStats?.totalUsers ?? "--"}
          helper={`管理员 ${userStats?.adminUsers ?? 0} 人`}
        />
        <StatCard title="激活账户" value={userStats?.activeUsers ?? "--"} helper="可正常登录" />
        <StatCard title="已禁用" value={userStats?.disabledUsers ?? "--"} helper="含风控/停用账号" />
        <Box borderWidth="1px" borderRadius="lg" p={4} bg="white" boxShadow="sm">
          <Text fontWeight="semibold" fontSize="sm" mb={2}>
            近 7 日注册
          </Text>
          {userRegistrationChart ? (
            <ReactECharts option={userRegistrationChart} style={{ height: 140 }} notMerge lazyUpdate />
          ) : (
            <Skeleton height="140px" />
          )}
        </Box>
      </SimpleGrid>
      <Box borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm" overflowX="auto">
        <Table size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>ID</Th>
              <Th>姓名</Th>
              <Th>用户名</Th>
              <Th>联系方式</Th>
              <Th>角色</Th>
              <Th>状态</Th>
              <Th>注册时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{user.id}</Td>
                <Td>{user.name}</Td>
                <Td>{user.username}</Td>
                <Td>{user.phone || "—"}</Td>
                <Td>
                  <Badge colorScheme={user.role === "ADMIN" ? "purple" : "blue"}>
                    {user.role || "USER"}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={user.status === 1 ? "green" : "red"}>
                    {user.status === 1 ? "启用" : "禁用"}
                  </Badge>
                </Td>
                <Td>
                  {user.createdAt ? dayjs(user.createdAt).format("YYYY-MM-DD") : "—"}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      isLoading={userActionLoadingId === user.id}
                      onClick={() => handleResetUserPassword(user)}
                    >
                      重置密码
                    </Button>
                    <Button
                      size="xs"
                      colorScheme={user.status === 1 ? "red" : "green"}
                      variant="outline"
                      isLoading={userActionLoadingId === user.id}
                      onClick={() => handleToggleUserStatus(user)}
                    >
                      {user.status === 1 ? "禁用" : "启用"}
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
            {users.length === 0 && !loading && (
              <Tr>
                <Td colSpan={8}>
                  <Text textAlign="center" color="gray.500">
                    暂无用户数据
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );

  const renderTickets = () => (
    <VStack align="stretch" spacing={6}>
      <Flex justify="space-between" align="center">
        <Heading size="md">工单中心</Heading>
        <HStack>
          <Select
            size="sm"
            value={ticketFilter}
            onChange={(e) => {
              const value = e.target.value as TicketStatus | "ALL";
              setTicketFilter(value);
              loadTickets(value, 0);
            }}
          >
            <option value="ALL">全部状态</option>
            <option value="OPEN">未处理</option>
            <option value="IN_PROGRESS">处理中</option>
            <option value="RESOLVED">已解决</option>
            <option value="CLOSED">已关闭</option>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => loadTickets()}>
            刷新
          </Button>
        </HStack>
      </Flex>
      <Box borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm">
        <Table size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>工单号</Th>
              <Th>主题</Th>
              <Th>提交人</Th>
              <Th>优先级</Th>
              <Th>状态</Th>
              <Th>提交时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {ticketPage?.content?.map((ticket) => (
              <Tr key={ticket.id}>
                <Td>#{ticket.id}</Td>
                <Td>{ticket.subject}</Td>
                <Td>
                  <VStack spacing={0} align="flex-start">
                    <Text>{ticket.userName}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {ticket.contactInfo}
                    </Text>
                  </VStack>
                </Td>
                <Td>
                  <Badge colorScheme={priorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={statusColor(ticket.status)}>{ticket.status}</Badge>
                </Td>
                <Td>{dayjs(ticket.createdAt).format("YYYY-MM-DD HH:mm")}</Td>
                <Td>
                  <Button size="xs" onClick={() => openTicketDetail(ticket)}>
                    查看
                  </Button>
                </Td>
              </Tr>
            ))}
            {(!ticketPage || ticketPage.content.length === 0) && !loading && (
              <Tr>
                <Td colSpan={7}>
                  <Text textAlign="center" color="gray.500">
                    暂无工单
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        <Flex justify="flex-end" align="center" p={3} borderTopWidth="1px">
          <Text fontSize="sm" color="gray.500">
            第 {ticketPage ? ticketPage.number + 1 : 1} / {ticketPage?.totalPages ?? 1} 页
          </Text>
          <HStack ml={4} spacing={2}>
            <Button
              size="xs"
              onClick={() => loadTickets(ticketFilter, Math.max((ticketPage?.number ?? 0) - 1, 0))}
              isDisabled={!ticketPage || ticketPage.number === 0}
            >
              上一页
            </Button>
            <Button
              size="xs"
              onClick={() =>
                loadTickets(
                  ticketFilter,
                  Math.min(
                    (ticketPage?.number ?? 0) + 1,
                    Math.max((ticketPage?.totalPages ?? 1) - 1, 0)
                  )
                )
              }
              isDisabled={
                !ticketPage || ticketPage.number >= (ticketPage.totalPages ?? 1) - 1
              }
            >
              下一页
            </Button>
          </HStack>
        </Flex>
      </Box>
    </VStack>
  );

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "orange";
      case "URGENT":
        return "red";
      case "LOW":
        return "gray";
      default:
        return "blue";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "orange";
      case "IN_PROGRESS":
        return "purple";
      case "RESOLVED":
        return "green";
      case "CLOSED":
        return "gray";
      default:
        return "blue";
    }
  };

  const handleResetUserPassword = async (user: UserEntity) => {
    if (!window.confirm(`确认将用户 ${user.username} 的密码重置为默认值？`)) return;
    setUserActionLoadingId(user.id);
    try {
      await userApi.resetPassword(user.id);
      toast({ status: "success", description: "密码已重置为默认值：123456" });
    } catch (err: any) {
      toast({
        status: "error",
        description: err.response?.data?.message || err.message || "重置失败",
      });
    } finally {
      setUserActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (user: UserEntity) => {
    const targetStatus = user.status === 1 ? 0 : 1;
    setUserActionLoadingId(user.id);
    try {
      await userApi.updateStatus(user.id, targetStatus);
      toast({
        status: "success",
        description: `用户状态已设置为${targetStatus ? "启用" : "禁用"}`,
      });
      await Promise.all([loadUsers(), loadUserStats()]);
    } catch (err: any) {
      toast({
        status: "error",
        description: err.response?.data?.message || err.message || "更新失败",
      });
    } finally {
      setUserActionLoadingId(null);
    }
  };

  const userRegistrationChart = useMemo(() => {
    if (!userStats?.recentRegistrations) return null;
    return {
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 12, top: 20, bottom: 30 },
      xAxis: {
        type: "category",
        data: userStats.recentRegistrations.map((item) => item.date.slice(5)),
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
      },
      series: [
        {
          type: "line",
          smooth: true,
          areaStyle: { opacity: 0.2 },
          itemStyle: { color: "#2b6cb0" },
          data: userStats.recentRegistrations.map((item) => item.count),
        },
      ],
    };
  }, [userStats]);

  if (checkingAuth) {
    return (
      <VStack spacing={4} align="stretch" p={8}>
        <Skeleton height="100px" borderRadius="lg" />
        <Skeleton height="400px" borderRadius="lg" />
      </VStack>
    );
  }

  if (!authorized) {
    return (
      <Box p={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>访问受限</AlertTitle>
            <AlertDescription>您没有权限访问管理员面板，请使用管理员账号登录。</AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Flex gap={6} align="flex-start" direction={{ base: "column", lg: "row" }}>
      <Stack
        spacing={2}
        w={{ base: "100%", lg: "260px" }}
        borderWidth="1px"
        borderRadius="xl"
        bg="white"
        boxShadow="sm"
        p={4}
        position={{ lg: "sticky" }}
        top="20"
        align="stretch"
      >
        <Heading size="md" mb={2}>
          管理中心
        </Heading>
        {sections.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "solid" : "ghost"}
            colorScheme={activeSection === item.id ? "blue" : undefined}
            justifyContent="flex-start"
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </Button>
        ))}
        <Divider my={2} />
        <Button
          colorScheme="red"
          onClick={() => {
            clearAuth();
            router.push("/login");
          }}
        >
          退出登录
        </Button>
      </Stack>

      <Box flex="1" borderRadius="xl" bg="transparent">
        {error && (
          <Alert status="error" borderRadius="md" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>加载失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}
        {activeSection === "dashboard" && (
          <VStack align="stretch" spacing={6}>
            <Box borderWidth="1px" borderRadius="xl" bg="white" boxShadow="sm" p={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="sm">订单状态概览</Heading>
                <ButtonGroup size="sm" variant="outline" isAttached>
                  {[
                    { key: "bar", label: "柱状" },
                    { key: "line", label: "折线" },
                    { key: "pie", label: "饼图" },
                  ].map((item) => (
                    <Button
                      key={item.key}
                      variant={chartMode === item.key ? "solid" : "outline"}
                      colorScheme={chartMode === item.key ? "blue" : "gray"}
                      onClick={() => setChartMode(item.key as "bar" | "line" | "pie")}
                    >
                      {item.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Flex>
              <Box minH="280px">
                <ReactECharts option={chartOptions} style={{ height: 280 }} notMerge lazyUpdate />
              </Box>
            </Box>
            {renderDashboard()}
          </VStack>
        )}
        {activeSection === "flights" && renderFlights()}
        {activeSection === "bookings" && renderBookings()}
        {activeSection === "users" && renderUsers()}
        {activeSection === "tickets" && renderTickets()}
      </Box>

      <ModalForm
        isOpen={formDisclosure.isOpen}
        onClose={formDisclosure.onClose}
        values={formValues}
        setValues={setFormValues}
        mode={formMode}
        onSubmit={handleSaveFlight}
        isSubmitting={savingFlight}
      />

      <Modal isOpen={refundReviewModal.isOpen} onClose={refundReviewModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{reviewDecision === "approve" ? "同意退票" : "驳回退票"}</ModalHeader>
          <ModalBody>
            {reviewBooking ? (
              <VStack align="stretch" spacing={4}>
                <Alert
                  status={reviewDecision === "approve" ? "success" : "warning"}
                  borderRadius="md"
                >
                  <AlertIcon />
                  {reviewDecision === "approve"
                    ? "确认后将自动退还金额并释放座位。"
                    : "请填写驳回理由，用户将收到通知。"}
                </Alert>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    订单号
                  </Text>
                  <Text fontWeight="semibold">#{reviewBooking.id}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    航班
                  </Text>
                  <Text>
                    {reviewBooking.flight?.flightNumber || "—"} · {reviewBooking.flight?.origin} →
                    {reviewBooking.flight?.destination}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    退票原因
                  </Text>
                  <Text color="gray.700">{reviewBooking.refundReason || "用户未填写"}</Text>
                </Box>
                {reviewDecision === "reject" && (
                  <FormControl>
                    <FormLabel>驳回理由</FormLabel>
                    <Textarea
                      placeholder="请输入需要反馈给用户的理由"
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      rows={4}
                    />
                  </FormControl>
                )}
              </VStack>
            ) : (
              <Text>未找到订单信息</Text>
            )}
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={refundReviewModal.onClose} isDisabled={reviewLoading}>
              取消
            </Button>
            <Button
              colorScheme={reviewDecision === "approve" ? "green" : "red"}
              onClick={handleSubmitRefundReview}
              isLoading={reviewLoading}
            >
              确认
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer
        isOpen={flightBookingDrawer.isOpen}
        placement="right"
        size="lg"
        onClose={closeFlightBookingDrawer}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {flightBookingFlight
              ? `航班 ${flightBookingFlight.flightNumber} 的订单`
              : "航班订单"}
          </DrawerHeader>
          <DrawerBody>
            {flightBookingFlight && (
              <Box borderWidth="1px" borderRadius="md" p={4} mb={4}>
                <Heading size="sm" mb={1}>
                  {flightBookingFlight.flightNumber} · {flightBookingFlight.from} →{" "}
                  {flightBookingFlight.to}
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  {dayjs(flightBookingFlight.departTime).format("YYYY-MM-DD HH:mm")} 起飞 ·{" "}
                  {dayjs(flightBookingFlight.arriveTime).format("YYYY-MM-DD HH:mm")} 抵达
                </Text>
              </Box>
            )}

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={4}>
              <Box borderWidth="1px" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">
                  总订单
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {flightBookingStats.totalOrders}
                </Text>
              </Box>
              <Box borderWidth="1px" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">
                  已出票
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {flightBookingStats.paidOrders}
                </Text>
              </Box>
              <Box borderWidth="1px" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">
                  总票数
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {flightBookingStats.totalTickets}
                </Text>
              </Box>
              <Box borderWidth="1px" borderRadius="md" p={3}>
                <Text fontSize="xs" color="gray.500">
                  已出票收益
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  ¥{flightBookingStats.totalRevenue.toLocaleString()}
                </Text>
              </Box>
            </SimpleGrid>

            {flightBookingError && (
              <Alert status="error" borderRadius="md" mb={4}>
                <AlertIcon />
                <Text>{flightBookingError}</Text>
              </Alert>
            )}

            {flightBookingLoading ? (
              <VStack align="stretch" spacing={3}>
                {[...Array(5)].map((_, idx) => (
                  <Skeleton key={idx} height="20px" />
                ))}
              </VStack>
            ) : flightBookingsByFlight.length > 0 ? (
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>订单号</Th>
                    <Th>乘客</Th>
                    <Th>票数</Th>
                    <Th>金额</Th>
                    <Th>状态</Th>
                    <Th>创建时间</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {flightBookingsByFlight.map((booking) => (
                    <Tr key={booking.id}>
                      <Td>#{booking.id}</Td>
                      <Td>{booking.user?.name || booking.user?.username || "—"}</Td>
                      <Td>{booking.ticketCount}</Td>
                      <Td>¥{Number(booking.totalAmount || 0).toLocaleString()}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            booking.status === "PAID"
                              ? "green"
                              : booking.status === "CANCELED"
                              ? "gray"
                              : booking.status === "REFUND_REVIEW"
                              ? "purple"
                              : booking.status === "REFUND_REJECTED"
                              ? "red"
                              : "orange"
                          }
                        >
                          {bookingStatusLabelMap[booking.status] || booking.status}
                        </Badge>
                      </Td>
                      <Td>{dayjs(booking.createdAt).format("YYYY-MM-DD HH:mm")}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Text color="gray.500" textAlign="center" mt={8}>
                暂无该航班的订单数据
              </Text>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" mr={3} onClick={closeFlightBookingDrawer}>
              关闭
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleRefreshFlightBookings}
              isDisabled={!flightBookingFlight}
              isLoading={flightBookingLoading}
            >
              刷新
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer isOpen={ticketDrawer.isOpen} placement="right" size="md" onClose={ticketDrawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>工单详情</DrawerHeader>
          <DrawerBody>
            {selectedTicket ? (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    工单号
                  </Text>
                  <Text fontWeight="bold">#{selectedTicket.id}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    主题
                  </Text>
                  <Text>{selectedTicket.subject}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    提交人
                  </Text>
                  <Text>
                    {selectedTicket.userName}（{selectedTicket.contactInfo}）
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    正文
                  </Text>
                  <Text whiteSpace="pre-wrap">{selectedTicket.content}</Text>
                </Box>
                <FormControl>
                  <FormLabel>状态</FormLabel>
                  <Select
                    value={ticketReply.status}
                    onChange={(e) =>
                      setTicketReply((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>管理员回复</FormLabel>
                  <Textarea
                    minH="160px"
                    value={ticketReply.adminReply}
                    onChange={(e) =>
                      setTicketReply((prev) => ({ ...prev, adminReply: e.target.value }))
                    }
                    placeholder="填写需要反馈给用户的信息"
                  />
                </FormControl>
              </VStack>
            ) : (
              <Text>请选择一条工单查看详情。</Text>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button mr={3} variant="ghost" onClick={ticketDrawer.onClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateTicket} isDisabled={!selectedTicket}>
              保存
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

function StatCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Stat
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      boxShadow="sm"
      minH="120px"
    >
      <StatLabel>{title}</StatLabel>
      <StatNumber>{value}</StatNumber>
      {helper && <StatHelpText>{helper}</StatHelpText>}
    </Stat>
  );
}

function ModalForm({
  isOpen,
  onClose,
  values,
  setValues,
  mode,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  values: FlightFormValues;
  setValues: Dispatch<SetStateAction<FlightFormValues>>;
  mode: "create" | "edit";
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const seatLocked = Boolean(values.aircraftPresetKey);

  const handleCabinToggle = (key: CabinClassKey, enabled: boolean) => {
    if (seatLocked) {
      return;
    }
    setValues((prev) => ({
      ...prev,
      cabins: {
        ...prev.cabins,
        [key]: {
          ...prev.cabins[key],
          enabled,
        },
      },
    }));
  };

  const handleCabinFieldChange = (
    key: CabinClassKey,
    field: Exclude<keyof CabinFormValues, "enabled">,
    value: string
  ) => {
    if (seatLocked && field !== "price") {
      return;
    }
    setValues((prev) => ({
      ...prev,
      cabins: {
        ...prev.cabins,
        [key]: {
          ...prev.cabins[key],
          [field]: value,
        },
      },
    }));
  };

  const handleAircraftPresetChange = (presetKey: AircraftPresetKey) => {
    const preset = AIRCRAFT_PRESETS[presetKey];
    setValues((prev) => {
      const nextCabins: Record<CabinClassKey, CabinFormValues> = { ...prev.cabins };
      CABIN_CLASS_ORDER.forEach((cabinKey) => {
        const config = preset.seats[cabinKey];
        const enabled = config.total > 0;
        nextCabins[cabinKey] = {
          enabled,
          price: config.price > 0 ? String(config.price) : "",
          totalSeats: enabled ? String(config.total) : "",
          remainingSeats: enabled ? String(config.total) : "",
        };
      });
      return {
        ...prev,
        aircraftPresetKey: presetKey,
        aircraftType: preset.model,
        cabins: nextCabins,
      };
    });
  };

  const handleFlightCityChange = useCallback(
    (field: "origin" | "destination") => (value: string) => {
      setValues((prev) => ({
        ...prev,
        [field]: value?.trim() || "",
      }));
    },
    [setValues]
  );

  return (
    <Drawer isOpen={isOpen} placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{mode === "create" ? "新增航班" : "编辑航班"}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>航班号</FormLabel>
              <Input
                value={values.flightNumber}
                onChange={(e) => setValues((prev) => ({ ...prev, flightNumber: e.target.value }))}
                placeholder="如 CA1234"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>机型</FormLabel>
              <Select
                placeholder="请选择机型"
                value={values.aircraftPresetKey ?? ""}
                onChange={(e) => {
                  const key = e.target.value as AircraftPresetKey;
                  if (key) {
                    handleAircraftPresetChange(key);
                  }
                }}
              >
                {Object.entries(AIRCRAFT_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </Select>
              {values.aircraftPresetKey && (
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {AIRCRAFT_PRESETS[values.aircraftPresetKey].description}。票价可调整，舱位座位已锁定
                </Text>
              )}
            </FormControl>
            <FormControl isRequired>
              <FormLabel>出发城市</FormLabel>
              <CityPicker
                value={values.origin}
                placeholder="请选择出发城市"
                icon={<Text color="gray.300">📍</Text>}
                onChange={handleFlightCityChange("origin")}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>到达城市</FormLabel>
              <CityPicker
                value={values.destination}
                placeholder="请选择到达城市"
                icon={<Text color="gray.300">📍</Text>}
                onChange={handleFlightCityChange("destination")}
              />
            </FormControl>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>起飞时间</FormLabel>
                <Input
                  type="datetime-local"
                  value={values.departureTime}
                  onChange={(e) => setValues((prev) => ({ ...prev, departureTime: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>到达时间</FormLabel>
                <Input
                  type="datetime-local"
                  value={values.arrivalTime}
                  onChange={(e) => setValues((prev) => ({ ...prev, arrivalTime: e.target.value }))}
                />
              </FormControl>
            </HStack>
            <Divider />
            <VStack align="stretch" spacing={4}>
              <Heading size="sm">舱位与票价设置</Heading>
              {CABIN_CLASS_ORDER.map((key) => {
                const cabin = values.cabins[key];
                return (
                  <Box key={key} borderWidth="1px" borderRadius="md" p={4}>
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      justify="space-between"
                      align={{ base: "flex-start", md: "center" }}
                      gap={3}
                    >
                      <Box>
                        <Text fontWeight="semibold">{CABIN_CLASS_CONFIG[key].label}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {CABIN_CLASS_CONFIG[key].helper}
                        </Text>
                      </Box>
                      <HStack>
                        <Text fontSize="sm" color="gray.500">
                          {cabin.enabled ? "已启用" : "未启用"}
                        </Text>
                        <Switch
                          colorScheme="blue"
                          isChecked={cabin.enabled}
                          onChange={(e) => handleCabinToggle(key, e.target.checked)}
                          isDisabled={seatLocked}
                        />
                      </HStack>
                    </Flex>
                    {cabin.enabled && (
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                        <FormControl isRequired>
                          <FormLabel>票价（元）</FormLabel>
                          <Input
                            type="number"
                            min="0"
                            value={cabin.price}
                            onChange={(e) => handleCabinFieldChange(key, "price", e.target.value)}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>总座位数</FormLabel>
                          <Input
                            type="number"
                            min="1"
                            value={cabin.totalSeats}
                            onChange={(e) => handleCabinFieldChange(key, "totalSeats", e.target.value)}
                            isReadOnly={seatLocked}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>当前余票</FormLabel>
                          <Input
                            type="number"
                            min="0"
                            value={cabin.remainingSeats}
                            placeholder="留空则等于总座位数"
                            onChange={(e) =>
                              handleCabinFieldChange(key, "remainingSeats", e.target.value)
                            }
                            isReadOnly={seatLocked}
                          />
                        </FormControl>
                      </SimpleGrid>
                    )}
                  </Box>
                );
              })}
            </VStack>
            <FormControl>
              <FormLabel>备注</FormLabel>
              <Textarea
                value={values.remarks}
                onChange={(e) => setValues((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="如 仅限直飞航班"
              />
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            取消
          </Button>
          <Button colorScheme="blue" onClick={onSubmit} isLoading={isSubmitting}>
            保存
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
