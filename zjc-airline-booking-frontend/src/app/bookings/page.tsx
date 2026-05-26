"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Tag,
  Button,
  SimpleGrid,
  Skeleton,
  Alert,
  AlertIcon,
  Divider,
  Flex,
  Badge,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { bookingApi, BookingItem } from "@/lib/bookings";
import { useRouter } from "next/navigation";
import { getAuth, isAuthenticated, saveAuth } from "@/lib/auth";
import { useLanguage, type LanguageKey } from "@/context/LanguageContext";
import { translateCity } from "@/lib/i18n/cities";

const STATUS_FILTERS = [
  { key: "ALL", value: "ALL" },
  { key: "CREATED", value: "待支付" },
  { key: "PAID", value: "已出票" },
  { key: "CANCELED", value: "已取消" },
  { key: "REFUND_REVIEW", value: "退票待审" },
  { key: "REFUND_REJECTED", value: "退票被拒" },
] as const;
const URGENT_SURCHARGE_RATE = 0.1;
const REFUND_FEE_RATE = 0.01;

const CABIN_LABELS: Record<LanguageKey, Record<string, string>> = {
  "zh-CN": {
    ECONOMY: "经济舱",
    BUSINESS: "商务舱",
    FIRST: "头等舱",
  },
  "en-US": {
    ECONOMY: "Economy",
    BUSINESS: "Business",
    FIRST: "First",
  },
};

type BookingStatusKey =
  | "CREATED"
  | "PAID"
  | "CANCELED"
  | "REFUND_REVIEW"
  | "REFUND_REJECTED"
  | "CHANGED"
  | "OTHER";

const statusColorByKey: Record<BookingStatusKey, string> = {
  CREATED: "orange",
  PAID: "green",
  CANCELED: "gray",
  REFUND_REVIEW: "purple",
  REFUND_REJECTED: "red",
  CHANGED: "teal",
  OTHER: "blue",
};

const resolveBookingStatus = (booking: { 
  id?: string | number | null; 
  status?: string | null; 
  originalBookingId?: number | null; 
  changeFeeAmount?: number | null; 
}): BookingStatusKey => {
  // 判断是否已改签：
  // 1. 原订单：originalBookingId 指向自己（已被改签），changeFeeAmount > 0
  // 2. 新订单：originalBookingId 指向原订单ID（不是自己），应该正常显示状态
  const bookingId = typeof booking.id === 'string' ? Number(booking.id) : booking.id;
  const originalBookingId = booking.originalBookingId;
  const changeFeeAmount = booking.changeFeeAmount ?? 0;
  
  // 如果 originalBookingId 等于当前订单ID，且 changeFeeAmount > 0，说明这是原订单且已被改签
  const isOriginalChanged = originalBookingId !== null && 
                            originalBookingId !== undefined && 
                            originalBookingId === bookingId && 
                            changeFeeAmount > 0;
  
  if (isOriginalChanged) {
    return "CHANGED";
  }
  
  if (!booking.status) return "OTHER";
  const status = booking.status;
  const normalized = status.toUpperCase();
  if (normalized === "CREATED" || status === "待支付") return "CREATED";
  if (normalized === "PAID" || status === "已出票") return "PAID";
  if (normalized === "CANCELED" || status === "已取消") return "CANCELED";
  if (normalized === "REFUND_REVIEW" || status === "退票待审") return "REFUND_REVIEW";
  if (normalized === "REFUND_REJECTED" || status === "退票被拒") {
    return "REFUND_REJECTED";
  }
  return "OTHER";
};

const formatDate = (date: dayjs.Dayjs, lang: LanguageKey) =>
  lang === "en-US" ? date.format("MMM DD") : date.format("MM月DD日");

const formatDateTime = (date: dayjs.Dayjs, lang: LanguageKey) =>
  lang === "en-US" ? date.format("MMM DD HH:mm") : date.format("MM月DD日 HH:mm");

const bookingsI18n = {
  "zh-CN": {
    title: "我的订票单",
    subtitle: "查看所有已提交的航班订单，支持按状态筛选",
    summary: {
      total: "总订单",
      pending: "待支付",
      issued: "已出票",
      amount: "有效金额（¥）",
    },
    filters: {
      ALL: "全部",
      CREATED: "待支付",
      PAID: "已出票",
      CANCELED: "已取消",
      REFUND_REVIEW: "退票待审",
      REFUND_REJECTED: "退票被拒",
      goBook: "去订票",
    },
    listTitle: "订单列表",
    empty: {
      title: "暂无订单记录",
      description: "完成第一次订票后，这里会展示订单详情。可以先浏览航班列表。",
      action: "去查看航班",
    },
    errors: {
      fetchFailed: "获取订单失败，请稍后重试",
      noUser: "无法获取用户信息，请重新登录",
    },
    statusLabels: {
      CREATED: "待支付",
      PAID: "已出票",
      CANCELED: "已取消",
      REFUND_REVIEW: "退票待审",
      REFUND_REJECTED: "退票被拒",
      CHANGED: "已改签",
      OTHER: "处理中",
    },
    bookingCard: {
      orderNo: "订单号",
      createdAt: "创建时间",
      refundReason: "退票原因",
      refundRejected: "驳回理由",
      urgentSurcharge: "该订单购票时距离起飞不足 12 小时，票价已包含 10% 加价。",
      refundFeePrefix: "已扣除退票手续费 ¥",
      refundFeeSuffix: "（按票款 1%）",
      passengers: "订票数",
      amount: "金额",
      actions: "操作",
      btnPay: "继续支付",
      btnRefund: "申请退票",
      btnChange: "改签",
      btnCancel: "取消订单",
    },
    refundModal: {
      title: "申请退票",
      policyLine1:
        "起飞 12 小时外可直接退票；起飞 12 小时内或 24 小时内已退票 ≥ 3 次，将进入管理员审核。",
      policyLine2:
        "距离起飞 12 小时内购票的订单已包含 10% 加价，退票将扣除票款 1% 作为手续费。",
      flightInfo: "航班信息",
      departPrefix: "出发",
      arrivePrefix: "抵达",
      ticketCount: "票数",
      amount: "金额",
      reasonLabel: "退票原因（选填）",
      reasonPlaceholder: "请简要描述退票原因，便于客服处理",
      cancel: "取消",
      submit: "提交退票申请",
    },
    payModal: {
      title: "继续支付",
      countdownFinished: "支付时间已用尽，请重新下单。",
      countdownPrefix: "剩余支付时间：",
      flightInfo: "航班信息",
      departPrefix: "出发",
      arrivePrefix: "抵达",
      tickets: "票数",
      amountToPay: "本次应付金额",
      walletBalance: "钱包可用余额",
      walletAfter: "支付后余额",
      countdownHint: "支付倒计时为 15 分钟，超时系统会自动取消订单并释放座位。",
      cancel: "暂不支付",
      confirm: "确认支付",
    },
    toasts: {
      accountDisabled: {
        title: "账号已被禁用",
        description: "禁用状态下无法支付待支付订单，请联系管理员",
      },
      missingPaymentInfo: {
        title: "暂无法支付",
        description: "该订单缺少支付有效期信息，请尝试刷新列表。",
      },
      paymentExpired: {
        title: "支付超时",
        description: "该订单支付时间已超时，请重新下单。",
      },
      paySuccess: {
        title: "支付成功",
        description: "订单已完成支付并出票。",
      },
      payFailed: {
        title: "支付失败",
        description: "暂无法支付该订单，请稍后再试。",
      },
      cancelSuccess: {
        title: "已取消订单",
        description: "座位已释放，欢迎重新选择航班。",
      },
      cancelFailed: {
        title: "取消失败",
        description: "暂无法取消该订单，请稍后再试。",
      },
      refundSubmitTitle: "退票请求已提交",
      refundPending: "退票申请已提交，等待管理员审核",
      refundSuccess: "退票成功，款项已退回钱包",
      refundFailed: {
        title: "退票失败",
        description: "暂无法退票，请稍后再试。",
      },
      payTimeout: {
        title: "支付已超时",
        description: "系统已自动取消该订单，请重新下单。",
      },
      changeSuccess: {
        title: "改签成功",
        description: "订单已成功改签。",
      },
      changeFailed: {
        title: "改签失败",
        description: "暂无法改签，请稍后再试。",
      },
    },
    changeModal: {
      title: "改签航班",
      policyLine1: "改签需在起飞前至少 2 小时进行。",
      policyLine2: "改签手续费为新订单金额的 5%。距离起飞 12 小时内购票的订单退票将扣除 1% 手续费。",
      originalFlight: "原航班",
      newFlight: "新航班",
      flightInfo: "航班信息",
      departPrefix: "出发",
      arrivePrefix: "抵达",
      ticketCount: "票数",
      amount: "金额",
      newTicketCount: "新票数",
      priceInfo: "费用明细",
      originalAmount: "原订单金额",
      refundAmount: "退款金额",
      newAmount: "新订单金额",
      changeFee: "改签手续费",
      priceDifference: "需补款/退款",
      needPay: "需补款",
      willRefund: "将退款",
      reasonLabel: "改签原因（选填）",
      reasonPlaceholder: "请简要描述改签原因",
      cancel: "取消",
      submit: "确认改签",
    },
    misc: {
      browseFlights: "去查看航班",
    },
  },
  "en-US": {
    title: "My Bookings",
    subtitle: "View all submitted flight orders, with quick status filters.",
    summary: {
      total: "Total orders",
      pending: "Pending payment",
      issued: "Ticket issued",
      amount: "Valid amount (¥)",
    },
    filters: {
      ALL: "All",
      CREATED: "Pending payment",
      PAID: "Ticket issued",
      CANCELED: "Cancelled",
      REFUND_REVIEW: "Refund review",
      REFUND_REJECTED: "Refund rejected",
      goBook: "Book flights",
    },
    listTitle: "Order list",
    empty: {
      title: "No orders yet",
      description: "Your bookings will appear here after you finish the first order.",
      action: "Browse flights",
    },
    errors: {
      fetchFailed: "Failed to fetch orders, please try again later.",
      noUser: "Unable to get user info, please sign in again.",
    },
    statusLabels: {
      CREATED: "Pending payment",
      PAID: "Ticket issued",
      CANCELED: "Cancelled",
      REFUND_REVIEW: "Refund review",
      REFUND_REJECTED: "Refund rejected",
      CHANGED: "Changed",
      OTHER: "In progress",
    },
    bookingCard: {
      orderNo: "Order No.",
      createdAt: "Created at",
      refundReason: "Refund reason",
      refundRejected: "Reject reason",
      urgentSurcharge:
        "This ticket was purchased within 12 hours before departure and includes a 10% surcharge.",
      refundFeePrefix: "Refund fee deducted ¥",
      refundFeeSuffix: " (1% of ticket price)",
      passengers: "Tickets",
      amount: "Amount",
      actions: "Actions",
      btnPay: "Pay now",
      btnRefund: "Request refund",
      btnChange: "Change Flight",
      btnCancel: "Cancel order",
    },
    refundModal: {
      title: "Request refund",
      policyLine1:
        "Refunds are auto-approved if more than 12h before departure. Within 12h or if ≥3 refunds within 24h, admin review is required.",
      policyLine2:
        "Orders placed within 12h before departure include a 10% surcharge. A 1% handling fee applies when refunding.",
      flightInfo: "Flight details",
      departPrefix: "Depart",
      arrivePrefix: "Arrive",
      ticketCount: "Tickets",
      amount: "Amount",
      reasonLabel: "Refund reason (optional)",
      reasonPlaceholder: "Describe briefly to help customer service.",
      cancel: "Cancel",
      submit: "Submit request",
    },
    payModal: {
      title: "Continue payment",
      countdownFinished: "Payment window expired. Please book again.",
      countdownPrefix: "Time left: ",
      flightInfo: "Flight details",
      departPrefix: "Depart",
      arrivePrefix: "Arrive",
      tickets: "Tickets",
      amountToPay: "Amount to pay",
      walletBalance: "Wallet balance",
      walletAfter: "Balance after payment",
      countdownHint:
        "Each payment window lasts 15 minutes. When it expires, the system cancels the booking automatically.",
      cancel: "Not now",
      confirm: "Confirm payment",
    },
    toasts: {
      accountDisabled: {
        title: "Account disabled",
        description: "Disabled accounts cannot pay pending orders. Contact admin.",
      },
      missingPaymentInfo: {
        title: "Payment unavailable",
        description: "This order is missing the payment window. Please refresh.",
      },
      paymentExpired: {
        title: "Payment expired",
        description: "The payment window expired. Please place a new order.",
      },
      paySuccess: {
        title: "Payment successful",
        description: "The order has been paid and ticketed.",
      },
      payFailed: {
        title: "Payment failed",
        description: "Unable to pay this order for now. Please try again later.",
      },
      cancelSuccess: {
        title: "Order cancelled",
        description: "Seats released. Feel free to book another flight.",
      },
      cancelFailed: {
        title: "Cancel failed",
        description: "Unable to cancel this order for now. Please retry later.",
      },
      refundSubmitTitle: "Refund request submitted",
      refundPending: "Refund submitted and waiting for admin review.",
      refundSuccess: "Refund succeeded. Funds returned to wallet.",
      refundFailed: {
        title: "Refund failed",
        description: "Unable to refund this order for now. Please retry later.",
      },
      payTimeout: {
        title: "Payment timeout",
        description: "System cancelled the order automatically. Please rebook.",
      },
      changeSuccess: {
        title: "Change successful",
        description: "Your booking has been successfully changed.",
      },
      changeFailed: {
        title: "Change failed",
        description: "Unable to change booking, please try again later.",
      },
    },
    changeModal: {
      title: "Change Flight",
      policyLine1: "Changes must be made at least 2 hours before departure.",
      policyLine2: "A 5% change fee applies based on the new ticket price. A 1% handling fee applies when refunding tickets purchased within 12 hours of departure.",
      originalFlight: "Original Flight",
      newFlight: "New Flight",
      flightInfo: "Flight Details",
      departPrefix: "Depart",
      arrivePrefix: "Arrive",
      ticketCount: "Tickets",
      amount: "Amount",
      newTicketCount: "New Ticket Count",
      priceInfo: "Price Details",
      originalAmount: "Original Amount",
      refundAmount: "Refund Amount",
      newAmount: "New Amount",
      changeFee: "Change Fee",
      priceDifference: "Additional Payment/Refund",
      needPay: "Additional Payment",
      willRefund: "Will Refund",
      reasonLabel: "Change Reason (Optional)",
      reasonPlaceholder: "Please briefly describe the reason",
      cancel: "Cancel",
      submit: "Confirm Change",
    },
    misc: {
      browseFlights: "Browse flights",
    },
  },
} as const;

export default function BookingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { language } = useLanguage();
  const t = bookingsI18n[language] || bookingsI18n["zh-CN"];
  const statusOptions = STATUS_FILTERS.map((item) => ({
    ...item,
    label: t.filters[item.key as keyof typeof t.filters] || item.key,
  }));
  const fetchErrorFallback = t.errors.fetchFailed;
  const noUserError = t.errors.noUser;
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const auth = getAuth();
    const value = Number(auth?.walletBalance);
    return Number.isFinite(value) ? value : 0;
  });
  const [payingBooking, setPayingBooking] = useState<BookingItem | null>(null);
  const payModal = useDisclosure();
  const [payLoading, setPayLoading] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [paySecondsLeft, setPaySecondsLeft] = useState(0);
  const [refundBooking, setRefundBooking] = useState<BookingItem | null>(null);
  const refundModal = useDisclosure();
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [changeBooking, setChangeBooking] = useState<BookingItem | null>(null);
  const changeModal = useDisclosure();
  const [changeLoading, setChangeLoading] = useState(false);
  const [canChange, setCanChange] = useState(false);

  const fetchBookings = useCallback(async (currentUserId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.list({
        userId: currentUserId,
        status: statusFilter,
      });
      setBookings(data);
    } catch (err: any) {
      setError(err.message || fetchErrorFallback);
    } finally {
      setLoading(false);
    }
  }, [fetchErrorFallback, statusFilter]);

  const refreshBookings = useCallback(() => {
    if (userId !== null) {
      fetchBookings(userId);
    }
  }, [fetchBookings, userId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    const auth = getAuth();
    if (auth?.id === undefined || auth?.id === null) {
      setError(noUserError);
      setLoading(false);
      return;
    }
    setUserId(Number(auth.id));
  }, [noUserError, router]);

  useEffect(() => {
    if (userId === null) return;
    fetchBookings(userId);
  }, [fetchBookings, userId]);

  const summary = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => resolveBookingStatus(b) === "CREATED")
      .length;
    const issued = bookings.filter((b) => resolveBookingStatus(b) === "PAID")
      .length;
    const amount = bookings
      .filter((b) => resolveBookingStatus(b) !== "CANCELED" && resolveBookingStatus(b) !== "CHANGED")
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    return { total, pending, issued, amount };
  }, [bookings]);

  const toastText = t.toasts;

  const handleOpenPay = (booking: BookingItem) => {
    if (resolveBookingStatus(booking) !== "CREATED") {
      return;
    }
    const auth = getAuth();
    if (auth?.status === 0) {
      toast({
        title: toastText.accountDisabled.title,
        description: toastText.accountDisabled.description,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    if (!booking.paymentDueAt) {
      toast({
        title: toastText.missingPaymentInfo.title,
        description: toastText.missingPaymentInfo.description,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      refreshBookings();
      return;
    }
    if (dayjs(booking.paymentDueAt).isBefore(dayjs())) {
      toast({
        title: toastText.paymentExpired.title,
        description: toastText.paymentExpired.description,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      refreshBookings();
      return;
    }
    setPayingBooking(booking);
    payModal.onOpen();
  };

  const handleClosePayModal = useCallback(() => {
    payModal.onClose();
    setPayingBooking(null);
    setPaySecondsLeft(0);
  }, [payModal]);

  const handleConfirmPay = async () => {
    if (!payingBooking || userId === null) {
      return;
    }
    const bookingId = Number(payingBooking.id);
    if (Number.isNaN(bookingId)) {
      toast({
        title: toastText.payFailed.title,
        description: toastText.payFailed.description,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setPayLoading(true);
    try {
      const response = await bookingApi.pay(bookingId, userId);
      if (response.success || response.code === 200 || response.code === 0 || !response.code) {
        const auth = getAuth();
        const walletFromAuth = Number(auth?.walletBalance);
        const currentBalance = Number.isFinite(walletFromAuth) ? walletFromAuth : walletBalance;
        const nextBalance = Math.max(0, currentBalance - payingBooking.amount);
        if (auth) {
          saveAuth({ ...auth, walletBalance: nextBalance });
        }
        setWalletBalance(nextBalance);
        toast({
          title: toastText.paySuccess.title,
          description: toastText.paySuccess.description,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
        handleClosePayModal();
        refreshBookings();
      } else {
        toast({
          title: toastText.payFailed.title,
          description: response.message || toastText.payFailed.description,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      toast({
        title: toastText.payFailed.title,
        description: serverMessage || err.message || toastText.payFailed.description,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      if (serverMessage?.includes("超时") || serverMessage?.includes("取消")) {
        refreshBookings();
        handleClosePayModal();
      }
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancelBooking = async (booking: BookingItem) => {
    if (resolveBookingStatus(booking) !== "CREATED" || userId === null) {
      return;
    }
    const bookingId = Number(booking.id);
    if (Number.isNaN(bookingId)) {
      toast({
        title: toastText.cancelFailed.title,
        description: toastText.cancelFailed.description,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setCancelLoadingId(booking.id);
    try {
      const response = await bookingApi.cancel(bookingId, userId);
      if (response.success || response.code === 200 || response.code === 0 || !response.code) {
        toast({
          title: toastText.cancelSuccess.title,
          description: toastText.cancelSuccess.description,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        refreshBookings();
      } else {
        toast({
          title: toastText.cancelFailed.title,
          description: response.message || toastText.cancelFailed.description,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      toast({
        title: toastText.cancelFailed.title,
        description:
          err?.response?.data?.message ||
          err.message ||
          toastText.cancelFailed.description,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleOpenRefund = (booking: BookingItem) => {
    if (resolveBookingStatus(booking) !== "PAID") {
      return;
    }
    setRefundBooking(booking);
    setRefundReason("");
    refundModal.onOpen();
  };

  const handleCloseRefundModal = () => {
    refundModal.onClose();
    setRefundBooking(null);
    setRefundReason("");
  };

  const handleOpenChangeModal = async (booking: BookingItem) => {
    const statusKey = resolveBookingStatus(booking);
    
    // 检查是否是已改签的原订单
    if (statusKey === "CHANGED") {
      toast({
        title: t.toasts.changeFailed.title,
        description: "该订单已改签，无法再次改签",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 检查是否是改签后的新订单（originalBookingId 不为 null 且不等于自己）
    const bookingId = typeof booking.id === 'string' ? Number(booking.id) : booking.id;
    if (booking.originalBookingId !== null && 
        booking.originalBookingId !== undefined && 
        booking.originalBookingId !== bookingId) {
      toast({
        title: t.toasts.changeFailed.title,
        description: "改签后的新订单不能再次改签",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (statusKey !== "PAID") {
      toast({
        title: t.toasts.changeFailed.title,
        description: "只有已出票的订单可以改签",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (userId === null) {
      toast({
        title: t.toasts.changeFailed.title,
        description: "请先登录",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // bookingId 已在上面定义
    if (Number.isNaN(bookingId)) {
      toast({
        title: t.toasts.changeFailed.title,
        description: "订单ID无效",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      console.log("[改签] 检查改签状态，bookingId:", bookingId, "userId:", userId);
      const canChangeBooking = await bookingApi.checkCanChange(bookingId, userId);
      console.log("[改签] 检查结果:", canChangeBooking);
      if (!canChangeBooking) {
        toast({
          title: t.toasts.changeFailed.title,
          description: "该订单不可改签（可能已超出改签时间限制或订单状态不允许）",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      setChangeBooking(booking);
      setCanChange(true);
      changeModal.onOpen();
    } catch (err: any) {
      console.error("[改签] 检查改签状态失败:", err);
      const errorMessage = err?.response?.data?.message || err?.message || t.toasts.changeFailed.description;
      toast({
        title: t.toasts.changeFailed.title,
        description: errorMessage,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleCloseChangeModal = () => {
    changeModal.onClose();
    setChangeBooking(null);
    setCanChange(false);
  };

  const handleSubmitRefund = async () => {
    if (!refundBooking || userId === null) {
      return;
    }
    const bookingId = Number(refundBooking.id);
    if (Number.isNaN(bookingId)) {
      toast({
        title: toastText.refundFailed.title,
        description: toastText.refundFailed.description,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setRefundLoading(true);
    try {
      const response = await bookingApi.requestRefund(bookingId, {
        userId,
        reason: refundReason.trim() || undefined,
      });
      const success =
        response.success || response.code === 200 || response.code === 0 || !response.code;
      if (success) {
        const isReview = response.data?.status === "REFUND_REVIEW";
        const message = isReview ? toastText.refundPending : toastText.refundSuccess;
        toast({
          title: toastText.refundSubmitTitle,
          description: message,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
        handleCloseRefundModal();
        refreshBookings();
      } else {
        toast({
          title: toastText.refundFailed.title,
          description: response.message || toastText.refundFailed.description,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      toast({
        title: toastText.refundFailed.title,
        description:
          err?.response?.data?.message ||
          err.message ||
          toastText.refundFailed.description,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setRefundLoading(false);
    }
  };

  useEffect(() => {
    if (!payModal.isOpen || !payingBooking?.paymentDueAt) {
      setPaySecondsLeft(0);
      return;
    }
    const calcRemaining = () =>
      Math.max(0, dayjs(payingBooking.paymentDueAt).diff(dayjs(), "second"));
    setPaySecondsLeft(calcRemaining());
    const timer = setInterval(() => {
      const remaining = calcRemaining();
      setPaySecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        toast({
          title: toastText.payTimeout.title,
          description: toastText.payTimeout.description,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        handleClosePayModal();
        refreshBookings();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [payModal.isOpen, payingBooking, toast, handleClosePayModal, refreshBookings]);

  return (
    <>
      <VStack spacing={8} align="stretch">
      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="md"
      >
        <Heading size="lg" mb={2}>
          {t.title}
        </Heading>
        <Text color="gray.500" mb={6}>
          {t.subtitle}
        </Text>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <SummaryCard label={t.summary.total} value={summary.total} />
          <SummaryCard label={t.summary.pending} value={summary.pending} color="orange.500" />
          <SummaryCard label={t.summary.issued} value={summary.issued} color="green.500" />
          <SummaryCard
            label={t.summary.amount}
            value={summary.amount.toLocaleString()}
            color="blue.500"
          />
        </SimpleGrid>

        <HStack mt={6} spacing={3} overflowX="auto">
          {statusOptions.map((item) => (
            <Button
              key={item.value}
              variant={statusFilter === item.value ? "solid" : "outline"}
              colorScheme="blue"
              size="sm"
              onClick={() => setStatusFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => router.push("/flights")}>
            {t.filters.goBook}
          </Button>
        </HStack>
      </Box>

      <Box>
        <Heading size="md" mb={4}>
          {t.listTitle}
        </Heading>

        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <VStack spacing={4} align="stretch">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} height="170px" borderRadius="lg" />
            ))}
          </VStack>
        ) : bookings.length === 0 ? (
          <Box
            p={10}
            textAlign="center"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.100"
            bg="white"
          >
            <Heading size="md" mb={2}>
              {t.empty.title}
            </Heading>
            <Text color="gray.500">
              {t.empty.description}
            </Text>
            <Button mt={4} colorScheme="blue" onClick={() => router.push("/flights")}>
              {t.empty.action}
            </Button>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPay={() => handleOpenPay(booking)}
                onCancel={() => handleCancelBooking(booking)}
                onRefund={() => handleOpenRefund(booking)}
                onChange={() => handleOpenChangeModal(booking)}
                cancelLoading={cancelLoadingId === booking.id}
                language={language}
                t={t}
              />
            ))}
          </VStack>
        )}
      </Box>
      </VStack>
      <ContinuePayModal
        booking={payingBooking}
        isOpen={payModal.isOpen}
        onClose={handleClosePayModal}
        onConfirm={handleConfirmPay}
        secondsLeft={paySecondsLeft}
        walletBalance={walletBalance}
        isLoading={payLoading}
        language={language}
        strings={t.payModal}
      />
      <RefundModal
        booking={refundBooking}
        isOpen={refundModal.isOpen}
        onClose={handleCloseRefundModal}
        onConfirm={handleSubmitRefund}
        reason={refundReason}
        onReasonChange={setRefundReason}
        isLoading={refundLoading}
        language={language}
        strings={t.refundModal}
      />
      <ChangeBookingModal
        booking={changeBooking}
        isOpen={changeModal.isOpen}
        onClose={handleCloseChangeModal}
        userId={userId}
        onSuccess={() => {
          handleCloseChangeModal();
          refreshBookings();
        }}
        language={language}
        strings={t.changeModal}
        toastText={t.toasts}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <Box
      p={4}
      borderRadius="lg"
      bg="gray.50"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Heading size="md" color={color || "gray.800"}>
        {value}
      </Heading>
    </Box>
  );
}

type RefundModalProps = {
  booking: BookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reason: string;
  onReasonChange: (value: string) => void;
  isLoading: boolean;
  language: LanguageKey;
  strings: (typeof bookingsI18n)["zh-CN"]["refundModal"];
};

function RefundModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
  reason,
  onReasonChange,
  isLoading,
  language,
  strings,
}: RefundModalProps) {
  if (!booking) {
    return null;
  }
  const depart = dayjs(booking.departTime);
  const arrive = booking.arriveTime ? dayjs(booking.arriveTime) : null;
  const amountText = booking.amount.toLocaleString();
  const fromLabel = translateCity(booking.from, language) || booking.from || "—";
  const toLabel = translateCity(booking.to, language) || booking.to || "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{strings.title}</ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text>{strings.policyLine1}</Text>
                <Text mt={1} color="gray.700">
                  {strings.policyLine2}
                </Text>
              </Box>
            </Alert>
            <Box>
              <Text fontSize="sm" color="gray.500">
                {strings.flightInfo}
              </Text>
              <Heading size="md" mt={1}>
                {booking.flightNumber}
              </Heading>
              <Text color="gray.600" mt={1}>
                {formatDateTime(depart, language)} {strings.departPrefix} · {fromLabel}
              </Text>
              {arrive && (
                <Text color="gray.600">
                  {formatDateTime(arrive, language)} {strings.arrivePrefix} · {toLabel}
                </Text>
              )}
              <Text color="gray.500" fontSize="sm" mt={1}>
                {strings.ticketCount}：{booking.tickets} · {strings.amount}：¥{amountText}
              </Text>
            </Box>
            <FormControl>
              <FormLabel fontSize="sm">{strings.reasonLabel}</FormLabel>
              <Textarea
                placeholder={strings.reasonPlaceholder}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            {strings.cancel}
          </Button>
          <Button colorScheme="purple" onClick={onConfirm} isLoading={isLoading}>
            {strings.submit}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

type ChangeBookingModalProps = {
  booking: BookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  onSuccess: () => void;
  language: LanguageKey;
  strings: (typeof bookingsI18n)["zh-CN"]["changeModal"];
  toastText: (typeof bookingsI18n)["zh-CN"]["toasts"];
};

function ChangeBookingModal({
  booking,
  isOpen,
  onClose,
  userId,
  onSuccess,
  language,
  strings,
  toastText,
}: ChangeBookingModalProps) {
  const toast = useToast();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!booking || !userId) {
    return null;
  }

  const handleGoToFlights = () => {
    const params = new URLSearchParams();
    if (booking.from) {
      params.append("from", booking.from);
    }
    if (booking.to) {
      params.append("to", booking.to);
    }
    onClose();
    router.push(`/flights?${params.toString()}&changeBookingId=${booking.id}`);
  };

  const depart = dayjs(booking.departTime);
  const arrive = booking.arriveTime ? dayjs(booking.arriveTime) : null;
  const fromLabel = translateCity(booking.from, language) || booking.from || "—";
  const toLabel = translateCity(booking.to, language) || booking.to || "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{strings.title}</ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text>{strings.policyLine1}</Text>
                <Text mt={1} color="gray.700">
                  {strings.policyLine2}
                </Text>
              </Box>
            </Alert>

            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {strings.originalFlight}
              </Text>
              <Heading size="md">{booking.flightNumber}</Heading>
              <Text color="gray.600" mt={1}>
                {formatDateTime(depart, language)} {strings.departPrefix} · {fromLabel}
              </Text>
              {arrive && (
                <Text color="gray.600">
                  {formatDateTime(arrive, language)} {strings.arrivePrefix} · {toLabel}
                </Text>
              )}
              <Text color="gray.500" fontSize="sm" mt={1}>
                {strings.ticketCount}：{booking.tickets} · {strings.amount}：¥{booking.amount.toLocaleString()}
              </Text>
            </Box>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Text>
                {language === "zh-CN"
                  ? "改签功能需要选择新航班。请点击下方按钮前往航班选择页面，选择新航班后系统将自动处理改签。"
                  : "Flight change requires selecting a new flight. Click the button below to go to the flight selection page. The system will automatically process the change after you select a new flight."}
              </Text>
            </Alert>

            <FormControl>
              <FormLabel fontSize="sm">{strings.reasonLabel}</FormLabel>
              <Textarea
                placeholder={strings.reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={loading}>
            {strings.cancel}
          </Button>
          <Button colorScheme="teal" onClick={handleGoToFlights} isDisabled={loading}>
            {language === "zh-CN" ? "去选择新航班" : "Select New Flight"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function BookingCard({
  booking,
  onPay,
  onCancel,
  onRefund,
  onChange,
  cancelLoading = false,
  language,
  t,
}: {
  booking: BookingItem;
  onPay: () => void;
  onCancel: () => void;
  onRefund: () => void;
  onChange: () => void;
  cancelLoading?: boolean;
  language: LanguageKey;
  t: (typeof bookingsI18n)["zh-CN"];
}) {
  const depart = dayjs(booking.departTime);
  const arrive = booking.arriveTime ? dayjs(booking.arriveTime) : null;
  const statusKey = resolveBookingStatus(booking);
  const statusColor = statusColorByKey[statusKey] || "blue";
  const isChanged = statusKey === "CHANGED";
  const cabinLabels = CABIN_LABELS[language] || CABIN_LABELS["zh-CN"];
  const cabinText = booking.cabinClass
    ? cabinLabels[booking.cabinClass] || booking.cabinClass
    : undefined;
  const passengerSeats = booking.passengerSeats ?? [];
  const hasPassengerSeats = passengerSeats.length > 0;
  
  // 判断是否是改签产生的新订单（originalBookingId 指向原订单但不是自己）
  const bookingId = typeof booking.id === 'string' ? Number(booking.id) : booking.id;
  const isNewFromChange = booking.originalBookingId !== null && 
                          booking.originalBookingId !== undefined && 
                          booking.originalBookingId !== bookingId;

  const fromLabel = translateCity(booking.from, language) || booking.from || "—";
  const toLabel = translateCity(booking.to, language) || booking.to || "—";

  return (
    <Box
      p={6}
      borderRadius="xl"
      bg="white"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="sm"
    >
      <Flex direction={{ base: "column", md: "row" }} gap={6}>
        <Box flex="2">
          <HStack spacing={3} mb={2} flexWrap="wrap">
            <Heading size="md">{booking.flightNumber}</Heading>
            <Tag colorScheme={statusColor}>{t.statusLabels[statusKey]}</Tag>
            {booking.orderNo && (
              <Badge colorScheme="gray" variant="subtle">
                {t.bookingCard.orderNo} {booking.orderNo}
              </Badge>
            )}
          </HStack>
          <Text color="gray.500" mb={4}>
            {t.bookingCard.createdAt}：{dayjs(booking.createdAt).format("YYYY-MM-DD HH:mm")}
          </Text>
          {cabinText && (
            <Text color="gray.600" mb={4}>
              {language === "zh-CN" ? "舱位" : "Cabin"}：{cabinText}
            </Text>
          )}
          {statusKey === "REFUND_REVIEW" && booking.refundReason && (
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              {t.bookingCard.refundReason}：{booking.refundReason}
            </Alert>
          )}
          {statusKey === "REFUND_REJECTED" && booking.refundRejectReason && (
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              {t.bookingCard.refundRejected}：{booking.refundRejectReason}
            </Alert>
          )}
          {booking.urgentSurchargeRate && booking.urgentSurchargeRate > 0 && (
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              {t.bookingCard.urgentSurcharge}
            </Alert>
          )}
          {booking.refundFeeAmount &&
            booking.refundFeeAmount > 0 &&
            statusKey === "CANCELED" && (
              <Alert status="info" borderRadius="md" mb={4}>
                <AlertIcon />
                {t.bookingCard.refundFeePrefix}
                {booking.refundFeeAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {t.bookingCard.refundFeeSuffix}
              </Alert>
            )}
          {isChanged && (
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold" mb={1}>
                  {language === "en-US" ? "Flight Changed" : "已改签"}
                </Text>
                {booking.changeFeeAmount && booking.changeFeeAmount > 0 && (
                  <Text fontSize="sm" mb={1}>
                    {language === "en-US"
                      ? `Change fee: ¥${booking.changeFeeAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : `改签手续费：¥${booking.changeFeeAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </Text>
                )}
                {booking.changeReason && (
                  <Text fontSize="sm" color="gray.600">
                    {language === "en-US"
                      ? `Reason: ${booking.changeReason}`
                      : `改签原因：${booking.changeReason}`}
                  </Text>
                )}
                {booking.originalFlightId && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {language === "en-US"
                      ? "This booking has been changed from the original flight."
                      : "此订单已从原航班改签。"}
                  </Text>
                )}
              </Box>
            </Alert>
          )}
          {isNewFromChange && (
            <Alert status="success" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold" mb={1}>
                  {language === "en-US" ? "Changed Flight" : "改签后订单"}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {language === "en-US"
                    ? "This booking was created from a flight change."
                    : "此订单由改签产生，显示改签后的新航班信息。"}
                </Text>
              </Box>
            </Alert>
          )}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box>
              <Heading size="lg">{depart.format("HH:mm")}</Heading>
              <Text color="gray.500">{formatDate(depart, language)}</Text>
              <Text mt={1}>{fromLabel}</Text>
            </Box>
            <Box textAlign="center">
              <Text fontWeight="bold">→</Text>
              {arrive && (
                <>
                  <Heading size="lg">{arrive.format("HH:mm")}</Heading>
                  <Text color="gray.500">{formatDate(arrive, language)}</Text>
                </>
              )}
              <Text mt={1}>{toLabel}</Text>
            </Box>
            <Box textAlign={{ base: "left", md: "right" }}>
              <Text color="gray.500">{t.bookingCard.passengers}</Text>
              <Heading size="lg">{booking.tickets}</Heading>
              <Text color="gray.500" mt={2}>
                {t.bookingCard.amount}：¥{booking.amount.toLocaleString()}
              </Text>
            </Box>
          </SimpleGrid>
          {hasPassengerSeats && (
            <Box
              mt={4}
              p={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.100"
              bg="gray.50"
            >
              <Text fontWeight="semibold" mb={2}>
                {language === "zh-CN" ? "乘客 / 座位" : "Passengers & Seats"}
              </Text>
              <VStack align="stretch" spacing={2}>
                {passengerSeats.map((seat, idx) => {
                  const row =
                    typeof seat.seatRow === "number" && !Number.isNaN(seat.seatRow)
                      ? seat.seatRow
                      : undefined;
                  const column = seat.seatColumn;
                  const seatCabin =
                    seat.cabinClass && cabinLabels[seat.cabinClass]
                      ? cabinLabels[seat.cabinClass]
                      : seat.cabinClass;
                  return (
                    <Flex
                      key={`${booking.id}-passenger-${idx}`}
                      justify="space-between"
                      align={{ base: "flex-start", md: "center" }}
                      flexWrap="wrap"
                      gap={2}
                    >
                      <Box>
                        <Text fontWeight="medium">
                          {seat.passengerName && seat.passengerName.trim().length > 0
                            ? seat.passengerName
                            : `${language === "zh-CN" ? "乘客" : "Passenger"} ${idx + 1}`}
                        </Text>
                        {seatCabin && (
                          <Text fontSize="sm" color="gray.500">
                            {language === "zh-CN" ? "舱位" : "Cabin"}：{seatCabin}
                          </Text>
                        )}
                      </Box>
                      <Box textAlign={{ base: "left", md: "right" }}>
                        <Badge colorScheme="blue">
                          {seat.seatNumber
                            ? `${language === "zh-CN" ? "座位" : "Seat"} ${seat.seatNumber}`
                            : language === "zh-CN"
                            ? "未分配"
                            : "Pending"}
                        </Badge>
                        {row && column && (
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            {language === "zh-CN"
                              ? `第${row}排 ${column}列`
                              : `Row ${row} · Col ${column}`}
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  );
                })}
              </VStack>
            </Box>
          )}
        </Box>

        <Divider display={{ base: "block", md: "none" }} />

        <Flex
          flex="1"
          direction="column"
          justify="space-between"
          align={{ base: "flex-start", md: "flex-end" }}
        >
          <Text color="gray.500">{t.bookingCard.actions}</Text>
          <HStack spacing={3} mt={2}>
            <Button
              size="sm"
              colorScheme="blue"
              variant="solid"
              onClick={onPay}
              isDisabled={statusKey !== "CREATED"}
            >
              {t.bookingCard.btnPay}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="purple"
              onClick={onRefund}
              isDisabled={statusKey !== "PAID" || isChanged}
            >
              {t.bookingCard.btnRefund}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="teal"
              onClick={onChange}
              isDisabled={statusKey !== "PAID" || isChanged || isNewFromChange}
            >
              {t.bookingCard.btnChange}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={onCancel}
              isDisabled={statusKey !== "CREATED"}
              isLoading={cancelLoading}
            >
              {t.bookingCard.btnCancel}
            </Button>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
}

type ContinuePayModalProps = {
  booking: BookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  secondsLeft: number;
  walletBalance: number;
  isLoading: boolean;
  language: LanguageKey;
  strings: (typeof bookingsI18n)["zh-CN"]["payModal"];
};

function ContinuePayModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
  secondsLeft,
  walletBalance,
  isLoading,
  language,
  strings,
}: ContinuePayModalProps) {
  if (!booking) {
    return null;
  }
  const depart = dayjs(booking.departTime);
  const arrive = booking.arriveTime ? dayjs(booking.arriveTime) : null;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const countdownFinished = secondsLeft <= 0;
  const balance = Number.isFinite(walletBalance) ? walletBalance : 0;
  const walletAfter = Math.max(0, balance - booking.amount);
  const fromLabel = translateCity(booking.from, language) || booking.from || "—";
  const toLabel = translateCity(booking.to, language) || booking.to || "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{strings.title}</ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status={countdownFinished ? "warning" : "info"} borderRadius="md">
              <AlertIcon />
              {countdownFinished
                ? strings.countdownFinished
                : `${strings.countdownPrefix}${minutes}:${seconds}`}
            </Alert>
            <Box>
              <Text fontSize="sm" color="gray.500">
                {strings.flightInfo}
              </Text>
              <Heading size="md" mt={1}>
                {booking.flightNumber}
              </Heading>
              <Text color="gray.600" mt={1}>
                {formatDateTime(depart, language)} {strings.departPrefix} · {fromLabel}
              </Text>
              {arrive && (
                <Text color="gray.600">
                  {formatDateTime(arrive, language)} {strings.arrivePrefix} · {toLabel}
                </Text>
              )}
              <Text color="gray.500" fontSize="sm" mt={1}>
                {strings.tickets}：{booking.tickets}
              </Text>
            </Box>
            <Box
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.100"
              bg="gray.50"
            >
              <Text color="gray.500" fontSize="sm">
                {strings.amountToPay}
              </Text>
              <Heading size="lg" color="blue.600" mt={1}>
                ¥{booking.amount.toLocaleString()}
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {strings.walletBalance}：¥
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {strings.walletAfter}：¥
                {walletAfter.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Box>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              {strings.countdownHint}
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            {strings.cancel}
          </Button>
          <Button
            colorScheme="blue"
            onClick={onConfirm}
            isLoading={isLoading}
            isDisabled={countdownFinished}
          >
            {strings.confirm}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

