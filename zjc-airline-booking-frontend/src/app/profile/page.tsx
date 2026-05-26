"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  HStack,
  Flex,
  Avatar,
  Badge,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  Alert,
  AlertIcon,
  Skeleton,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Image,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, isAuthenticated, UserInfo } from "@/lib/auth";
import { profileApi, ProfileStat, BookingSummary } from "@/lib/profile";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { translateCity, parseRouteString } from "@/lib/i18n/cities";
import dayjs from "dayjs";

type LanguageKey = "zh-CN" | "en-US";

const profileI18n = {
  "zh-CN": {
    defaultName: "旅客",
    loadingRedirect: "请先登录后再访问个人中心，系统正在为您跳转...",
    loginAccount: "登录账号",
    lastLogin: "最近登录",
    btnBook: "继续订票",
    btnOrders: "查看我的订票单",
    btnLogout: "退出登录",
    walletTitle: "航旅钱包余额",
    walletCharge: "充值",
    walletWithdraw: "提现",
    walletAdminNote: "管理员账号无需使用钱包",
    statsEmpty: "暂无统计数据，完成订单后将自动更新",
    infoTitle: "旅客信息",
    edit: "编辑",
    infoFields: {
      username: "用户名",
      phone: "联系电话",
      address: "通讯地址",
      idNumber: "身份证号",
    },
    notSet: "未设置",
    notFilled: "未填写",
    ordersTitle: "最近订单",
    orderHeaders: ["订单号", "航班", "航线", "订票数", "金额（¥）", "状态", "创建时间"],
    statusMap: {
      CREATED: "待支付",
      PAID: "已出票",
      CANCELED: "已取消",
      OTHER: "—",
    },
    ordersEmpty: "暂无订单记录，完成第一次订票后即会展示。",
    viewAll: "查看全部订单",
  },
  "en-US": {
    defaultName: "Passenger",
    loadingRedirect: "Please sign in before accessing your profile. Redirecting...",
    loginAccount: "Account",
    lastLogin: "Last login",
    btnBook: "Book flights",
    btnOrders: "My bookings",
    btnLogout: "Sign out",
    walletTitle: "Travel Wallet Balance",
    walletCharge: "Top up",
    walletWithdraw: "Withdraw",
    walletAdminNote: "Admin users do not need the wallet.",
    statsEmpty: "No stats yet. They will update after completing an order.",
    infoTitle: "Passenger Details",
    edit: "Edit",
    infoFields: {
      username: "Username",
      phone: "Phone",
      address: "Address",
      idNumber: "ID number",
    },
    notSet: "Not set",
    notFilled: "Not provided",
    ordersTitle: "Recent Orders",
    orderHeaders: ["Order ID", "Flight", "Route", "Tickets", "Amount (¥)", "Status", "Created at"],
    statusMap: {
      CREATED: "Pending payment",
      PAID: "Ticket issued",
      CANCELED: "Cancelled",
      OTHER: "—",
    },
    ordersEmpty: "No orders yet. Your first booking will appear here.",
    viewAll: "View all orders",
  },
} as const;

const walletModalI18n = {
  "zh-CN": {
    title: "充值航旅钱包",
    inputDesc: "请输入本次需要充值的金额，系统将生成模拟二维码供你扫码完成操作。",
    placeholder: "请输入金额，例如 200",
    hint: "温馨提示：此为模拟充值流程，点击\"我已充值\"后将自动为您的钱包增加相应余额。",
    qrInstruction: "请使用手机银行 / 支付App 扫描下方二维码完成充值",
    qrHint: "扫码完成后点击\"我已充值\"即可完成模拟。",
    successTitle: "充值成功",
    successDesc: (amount: string, balance: string) =>
      `已为您入账 ¥${amount}，当前余额：¥${balance}`,
    successHint: "资金可用于今后的订票支付、改签或退票抵扣。",
    btnCancel: "取消",
    btnGenerate: "生成充值码",
    btnBack: "返回修改金额",
    btnConfirm: "我已充值",
    btnContinue: "继续充值",
    btnDone: "完成",
    warnPositive: "请输入大于 0 的充值金额",
    toastSuccess: (amt: number) => `成功充值 ¥${amt.toFixed(2)}，资金已实时入账`,
    toastErrorDefault: "充值失败，请稍后再试",
  },
  "en-US": {
    title: "Top Up Wallet",
    inputDesc: "Enter the amount to top up. A simulated QR code will be generated for scanning.",
    placeholder: "Enter amount, e.g. 200",
    hint: 'Note: this is a simulated flow. Click "I have paid" to add the balance automatically.',
    qrInstruction: "Use your banking / payment app to scan the QR code below.",
    qrHint: 'After scanning, click "I have paid" to finish.',
    successTitle: "Top-up Successful",
    successDesc: (amount: string, balance: string) =>
      `¥${amount} has been added. Current balance: ¥${balance}`,
    successHint: "Funds can be used for future ticketing, changes, or refunds.",
    btnCancel: "Cancel",
    btnGenerate: "Generate QR",
    btnBack: "Back to edit",
    btnConfirm: "I have paid",
    btnContinue: "Top up again",
    btnDone: "Done",
    warnPositive: "Please enter an amount greater than 0",
    toastSuccess: (amt: number) => `Successfully topped up ¥${amt.toFixed(2)}.`,
    toastErrorDefault: "Top-up failed, please try again later",
  },
} as const;

const withdrawModalI18n = {
  "zh-CN": {
    title: "提现到原账户",
    inputDesc: "请输入需要提现的金额，提现后资金将自动退回原账户。",
    placeholder: "请输入金额",
    hint: "温馨提示：提现金额不能大于钱包余额，提现后资金将自动退回原账户。",
    confirmTitle: "确认提现",
    confirmDesc: (amount: string) =>
      `您确定要提现 ¥${amount} 吗？提现后资金将自动退回原账户。`,
    successTitle: "提现成功",
    successDesc: (amount: string, balance: string) =>
      `已成功提现 ¥${amount}，资金将自动退回原账户。当前余额：¥${balance}`,
    successHint: "提现资金将在1-3个工作日内退回您的原账户。",
    btnCancel: "取消",
    btnConfirm: "确认提现",
    btnBack: "返回修改金额",
    btnDone: "完成",
    warnPositive: "请输入大于 0 的提现金额",
    warnExceed: "提现金额不能大于钱包余额",
    currentBalance: "当前钱包余额",
    toastSuccess: (amt: number) => `成功提现 ¥${amt.toFixed(2)}，资金将自动退回原账户`,
    toastErrorDefault: "提现失败，请稍后再试",
  },
  "en-US": {
    title: "Withdraw to Original Account",
    inputDesc: "Enter the amount to withdraw. Funds will be automatically returned to your original account.",
    placeholder: "Enter amount",
    hint: "Note: Withdrawal amount cannot exceed wallet balance. Funds will be automatically returned to your original account.",
    confirmTitle: "Confirm Withdrawal",
    confirmDesc: (amount: string) =>
      `Are you sure you want to withdraw ¥${amount}? Funds will be automatically returned to your original account.`,
    successTitle: "Withdrawal Successful",
    successDesc: (amount: string, balance: string) =>
      `Successfully withdrew ¥${amount}. Funds will be automatically returned to your original account. Current balance: ¥${balance}`,
    successHint: "Withdrawn funds will be returned to your original account within 1-3 business days.",
    btnCancel: "Cancel",
    btnConfirm: "Confirm Withdrawal",
    btnBack: "Back to edit",
    btnDone: "Done",
    warnPositive: "Please enter an amount greater than 0",
    warnExceed: "Withdrawal amount cannot exceed wallet balance",
    currentBalance: "Current Wallet Balance",
    toastSuccess: (amt: number) => `Successfully withdrew ¥${amt.toFixed(2)}. Funds will be automatically returned to your original account.`,
    toastErrorDefault: "Withdrawal failed, please try again later",
  },
} as const;

const buildRouteLabel = (
  order: BookingSummary,
  lang: Language
): string | undefined => {
  const joinRoute = (from?: string, to?: string) => {
    if (!from && !to) return undefined;
    const fromLabel = from ? translateCity(from, lang) : undefined;
    const toLabel = to ? translateCity(to, lang) : undefined;
    if (fromLabel && toLabel) {
      return `${fromLabel} → ${toLabel}`;
    }
    if (fromLabel) return fromLabel;
    if (toLabel) return toLabel;
    return undefined;
  };

  const fromToLabel = joinRoute(order.from, order.to);
  if (fromToLabel) return fromToLabel;

  if (order.route) {
    const { from, to } = parseRouteString(order.route);
    const parsedLabel = joinRoute(from, to);
    if (parsedLabel) return parsedLabel;
    if (lang === "en-US") {
      const translated = translateCity(order.route, lang);
      if (translated && translated !== order.route) {
        return translated;
      }
    }
    return order.route;
  }

  return undefined;
};

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = profileI18n[language as keyof typeof profileI18n] || profileI18n["zh-CN"];
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<ProfileStat[]>([]);
  const [orders, setOrders] = useState<BookingSummary[]>([]);
  const walletModal = useDisclosure();
  const withdrawModal = useDisclosure();

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      // 先使用本地存储的数据快速显示（包括最新保存的数据）
      const cached = getAuth();
      if (cached) {
        setUser(cached);
      }
      setLoading(true);
      try {
        const [profileRes, statsRes, allOrdersRes, recentOrdersRes] = await Promise.allSettled([
          profileApi.getProfile(),
          profileApi.getStats(),
          profileApi.getAllBookings(), // 获取全部订单用于统计
          profileApi.getRecentBookings(), // 获取最近6条订单用于显示
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value) {
          // 合并缓存和API数据，优先使用API数据
          const updatedUser = { ...cached, ...profileRes.value };
          setUser(updatedUser);
          // 更新本地存储
          if (typeof window !== 'undefined') {
            localStorage.setItem('zjc_airline_auth', JSON.stringify(updatedUser));
          }
        } else if (cached) {
          // 如果API失败，使用缓存数据（可能包含最新保存的数据）
          setUser(cached);
        }
        // 计算统计数据的辅助函数
        const calculateStatsFromOrders = (orders: BookingSummary[]): ProfileStat[] => {
          if (orders.length === 0) return [];
          const totalOrders = orders.length;
          const totalAmount = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
          const paidOrders = orders.filter(order => {
            const status = order.status?.toUpperCase() || "";
            return status === "已出票" || status === "PAID";
          }).length;
          
          return [
            {
              label: language === "en-US" ? "Total Orders" : "总订单数",
              value: totalOrders,
            },
            {
              label: language === "en-US" ? "Total Amount" : "总消费金额",
              value: totalAmount,
              help: language === "en-US" ? "¥" : "¥",
            },
            {
              label: language === "en-US" ? "Paid Orders" : "已出票订单",
              value: paidOrders,
            },
          ];
        };

        // 处理最近订单数据（用于显示）
        if (recentOrdersRes.status === "fulfilled") {
          setOrders(recentOrdersRes.value);
        }

        // 处理全部订单数据（用于统计）
        let allOrders: BookingSummary[] = [];
        if (allOrdersRes.status === "fulfilled") {
          allOrders = allOrdersRes.value;
        }

        // 处理统计数据
        let finalStats: ProfileStat[] = [];
        if (statsRes.status === "fulfilled") {
          const apiStats = statsRes.value;
          // 如果统计接口返回了数据，使用API数据
          if (apiStats.length > 0) {
            finalStats = apiStats;
          }
        }
        
        // 如果统计数据为空（API返回空或失败），但有全部订单数据，则从全部订单数据计算统计
        if (finalStats.length === 0 && allOrders.length > 0) {
          finalStats = calculateStatsFromOrders(allOrders);
        }
        
        setStats(finalStats);
      } catch (error: any) {
        console.warn("加载个人数据失败：", error);
        // 出错时使用缓存数据
        if (cached) {
          setUser(cached);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    
    // 监听storage事件，当其他标签页或页面更新了localStorage时，同步更新
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zjc_airline_auth' && e.newValue) {
        try {
          const updatedAuth = JSON.parse(e.newValue);
          setUser(updatedAuth);
        } catch (err) {
          console.warn("解析存储数据失败:", err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查本地存储是否有更新（用于同一标签页内的更新）
    const checkStorageInterval = setInterval(() => {
      const latestAuth = getAuth();
      if (latestAuth) {
        setUser((currentUser) => {
          // 只在数据真正变化时更新
          if (!currentUser || JSON.stringify(latestAuth) !== JSON.stringify(currentUser)) {
            return latestAuth;
          }
          return currentUser;
        });
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkStorageInterval);
    };
  }, [router]);

  // 监听页面可见性变化，当页面重新可见时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated()) {
        const cached = getAuth();
        if (cached) {
          setUser(cached);
          // 后台刷新数据
          profileApi.getProfile().then((userData) => {
            if (userData) {
              const updatedUser = { ...cached, ...userData };
              setUser(updatedUser);
              if (typeof window !== 'undefined') {
                localStorage.setItem('zjc_airline_auth', JSON.stringify(updatedUser));
              }
            }
          }).catch(console.warn);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="180px" borderRadius="lg" />
        <Skeleton height="300px" borderRadius="lg" />
      </VStack>
    );
  }

  if (!user) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        {t.loadingRedirect}
      </Alert>
    );
  }

  const isAdmin = (user.role || "").toUpperCase() === "ADMIN";
  const walletBalanceDisplay = formatCurrency(user.walletBalance, language);

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
        <HStack spacing={6} align="center">
          <Avatar
            size="xl"
            name={user.name || user.fullName || user.username || t.defaultName}
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${
              user.username || "passenger"
            }`}
          />
          <VStack align="flex-start" spacing={1} flex="1">
            <Heading size="lg">
              {user.name || user.fullName || user.username || t.defaultName}
              {user.role && (
                <Badge ml={3} colorScheme={user.role === "ADMIN" ? "purple" : "blue"}>
                  {user.role}
                </Badge>
              )}
            </Heading>
            <Text color="gray.500">
              {t.loginAccount}：{user.username || t.notSet} · {t.lastLogin}：
              {dayjs().format("YYYY-MM-DD HH:mm")}
            </Text>
            <HStack spacing={3} mt={2}>
              <Button colorScheme="blue" onClick={() => router.push("/flights")}>
                {t.btnBook}
              </Button>
              <Button variant="outline" onClick={() => router.push("/bookings")}>
                {t.btnOrders}
              </Button>
              <Button variant="ghost" colorScheme="red" onClick={handleLogout}>
                {t.btnLogout}
              </Button>
            </HStack>
          </VStack>
        </HStack>
      </Box>

      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="sm"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap={6}
        >
          <Box>
            <Text color="gray.500" fontSize="sm">
              {t.walletTitle}
            </Text>
            <Heading size="lg" mt={2}>
              ¥{walletBalanceDisplay}
            </Heading>
          </Box>
          <VStack align="flex-end" spacing={2}>
            <HStack spacing={3}>
              <Button
                colorScheme="teal"
                onClick={walletModal.onOpen}
                size="md"
                isDisabled={isAdmin}
              >
                {t.walletCharge}
              </Button>
              <Button
                colorScheme="orange"
                variant="outline"
                onClick={withdrawModal.onOpen}
                size="md"
                isDisabled={isAdmin || (user.walletBalance || 0) <= 0}
              >
                {t.walletWithdraw}
              </Button>
            </HStack>
            {isAdmin && (
              <Text fontSize="xs" color="gray.500">
                {t.walletAdminNote}
              </Text>
            )}
          </VStack>
        </Flex>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {stats.length > 0 ? (
          stats.map((item) => (
            <Stat
              key={item.label}
              p={5}
              borderRadius="lg"
              bg="white"
              borderWidth="1px"
              borderColor="gray.100"
              boxShadow="sm"
            >
              <StatLabel>{item.label}</StatLabel>
              <StatNumber>{item.value}</StatNumber>
              {item.help && <StatHelpText>{item.help}</StatHelpText>}
            </Stat>
          ))
        ) : (
          <Box
            p={5}
            borderRadius="lg"
            bg="white"
            borderWidth="1px"
            borderColor="gray.100"
            boxShadow="sm"
          >
            <Text color="gray.500">{t.statsEmpty}</Text>
          </Box>
        )}
      </SimpleGrid>

      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">{t.infoTitle}</Heading>
          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => router.push("/profile/edit")}
          >
            {t.edit}
          </Button>
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <InfoItem
            label={t.infoFields.username}
            value={user.username || t.notSet}
          />
          <InfoItem label={t.infoFields.phone} value={user.phone || t.notFilled} />
          <InfoItem
            label={t.infoFields.address}
            value={user.address || t.notFilled}
          />
          <InfoItem
            label={t.infoFields.idNumber}
            value={user.idNumber || t.notFilled}
          />
        </SimpleGrid>
      </Box>

      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="sm"
      >
        <Heading size="md" mb={4}>
          {t.ordersTitle}
        </Heading>
        {orders.length > 0 ? (
          <>
            <Table variant="simple">
              <Thead>
                <Tr>
                  {t.orderHeaders.map((header) => (
                    <Th key={header}>{header}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>{order.id}</Td>
                    <Td>{order.flightNumber}</Td>
                    <Td>{buildRouteLabel(order, language) || "—"}</Td>
                    <Td>{order.tickets ?? "—"}</Td>
                    <Td>
                      {order.amount !== undefined
                        ? order.amount.toLocaleString()
                        : "—"}
                    </Td>
                    <Td>
                      {(() => {
                        const statusType = resolveStatusType(order.status);
                        const color =
                          statusType === "PAID"
                            ? "green"
                            : statusType === "CREATED"
                            ? "orange"
                            : statusType === "CANCELED"
                            ? "gray"
                            : "gray";
                        return (
                          <Tag colorScheme={color}>
                            {t.statusMap[statusType] ?? t.statusMap.OTHER}
                          </Tag>
                        );
                      })()}
                    </Td>
                    <Td>{order.createdAt || "—"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Button mt={4} variant="outline" onClick={() => router.push("/bookings")}>
              {t.viewAll}
            </Button>
          </>
        ) : (
          <Text color="gray.500">{t.ordersEmpty}</Text>
        )}
      </Box>
    </VStack>
      <WalletRechargeModal
        isOpen={walletModal.isOpen}
        onClose={walletModal.onClose}
        currentUser={user}
        onSuccess={(updated) => setUser(updated)}
        language={language}
      />
      <WalletWithdrawModal
        isOpen={withdrawModal.isOpen}
        onClose={withdrawModal.onClose}
        currentUser={user}
        onSuccess={(updated) => setUser(updated)}
        language={language}
      />
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.100"
      bg="gray.50"
    >
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontWeight="semibold">{value}</Text>
    </Box>
  );
}

const formatCurrency = (value?: number, lang: Language = "zh-CN") =>
  Number(value ?? 0).toLocaleString(lang === "en-US" ? "en-US" : "zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type OrderStatusType = "CREATED" | "PAID" | "CANCELED" | "OTHER";

const resolveStatusType = (status?: string | null): OrderStatusType => {
  if (!status) return "OTHER";
  const normalized = status.toUpperCase();
  if (normalized === "CREATED" || status === "待支付") return "CREATED";
  if (normalized === "PAID" || status === "已出票") return "PAID";
  if (normalized === "CANCELED" || status === "已取消") return "CANCELED";
  return "OTHER";
};

type WalletRechargeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserInfo;
  onSuccess: (nextUser: UserInfo) => void;
  language: Language;
};

function WalletRechargeModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  language,
}: WalletRechargeModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<"input" | "qr" | "success">("input");
  const [amount, setAmount] = useState("200");
  const [loading, setLoading] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const text =
    walletModalI18n[language as keyof typeof walletModalI18n] ||
    walletModalI18n["zh-CN"];

  useEffect(() => {
    if (!isOpen) {
      setStep("input");
      setAmount("200");
      setLoading(false);
      setConfirmedAmount(0);
    }
  }, [isOpen]);

  const parsedAmount = Math.max(Number(amount) || 0, 0);

  const remindAmountPositive = () => {
    toast({
      status: "warning",
      description: text.warnPositive,
    });
  };

  const handleNext = () => {
    if (parsedAmount <= 0) {
      remindAmountPositive();
      return;
    }
    setStep("qr");
  };

  const handleRecharge = async () => {
    if (parsedAmount <= 0) {
      remindAmountPositive();
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await profileApi.rechargeWallet(parsedAmount);
      setConfirmedAmount(parsedAmount);
      onSuccess(updatedUser);
      setStep("success");
      toast({
        status: "success",
        description: text.toastSuccess(parsedAmount),
      });
    } catch (error: any) {
      toast({
        status: "error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          text.toastErrorDefault,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{text.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {step === "input" && (
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                {text.inputDesc}
              </Text>
              <NumberInput
                min={1}
                precision={2}
                step={50}
                value={amount}
                onChange={(value) => setAmount(value)}
              >
                <NumberInputField placeholder={text.placeholder} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="xs" color="gray.500">
                {text.hint}
              </Text>
            </VStack>
          )}
          {step === "qr" && (
            <VStack spacing={4} align="center">
              <Text color="gray.600">{text.qrInstruction}</Text>
              <Image
                src="/globe.svg"
                alt="充值二维码"
                boxSize="220px"
                objectFit="cover"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.100"
                boxShadow="lg"
              />
              <Text fontWeight="semibold">
                ¥{parsedAmount.toFixed(2)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {text.qrHint}
              </Text>
            </VStack>
          )}
          {step === "success" && (
            <VStack spacing={3} align="center" py={6}>
              <CheckCircleIcon color="green.400" boxSize={12} />
              <Heading size="md">{text.successTitle}</Heading>
              <Text color="gray.600" textAlign="center">
                {text.successDesc(
                  confirmedAmount.toFixed(2),
                  formatCurrency(currentUser?.walletBalance, language)
                )}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {text.successHint}
              </Text>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          {step === "input" && (
            <>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                {text.btnCancel}
              </Button>
              <Button colorScheme="blue" onClick={handleNext}>
                {text.btnGenerate}
              </Button>
            </>
          )}
          {step === "qr" && (
            <>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => setStep("input")}
                isDisabled={loading}
              >
                {text.btnBack}
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleRecharge}
                isLoading={loading}
              >
                {text.btnConfirm}
              </Button>
            </>
          )}
          {step === "success" && (
            <>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => {
                  setStep("input");
                  setAmount("200");
                  setConfirmedAmount(0);
                }}
              >
                {text.btnContinue}
              </Button>
              <Button colorScheme="blue" onClick={handleClose}>
                {text.btnDone}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

type WalletWithdrawModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserInfo;
  onSuccess: (nextUser: UserInfo) => void;
  language: Language;
};

function WalletWithdrawModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  language,
}: WalletWithdrawModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const text =
    withdrawModalI18n[language as keyof typeof withdrawModalI18n] ||
    withdrawModalI18n["zh-CN"];

  const walletBalance = currentUser?.walletBalance || 0;

  useEffect(() => {
    if (!isOpen) {
      setStep("input");
      setAmount("");
      setLoading(false);
      setConfirmedAmount(0);
    }
  }, [isOpen]);

  const parsedAmount = Math.max(Number(amount) || 0, 0);

  const remindAmountPositive = () => {
    toast({
      status: "warning",
      description: text.warnPositive,
    });
  };

  const remindAmountExceed = () => {
    toast({
      status: "warning",
      description: text.warnExceed,
    });
  };

  const handleNext = () => {
    if (parsedAmount <= 0) {
      remindAmountPositive();
      return;
    }
    if (parsedAmount > walletBalance) {
      remindAmountExceed();
      return;
    }
    setStep("confirm");
  };

  const handleWithdraw = async () => {
    if (parsedAmount <= 0) {
      remindAmountPositive();
      return;
    }
    if (parsedAmount > walletBalance) {
      remindAmountExceed();
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await profileApi.withdrawWallet(parsedAmount);
      setConfirmedAmount(parsedAmount);
      onSuccess(updatedUser);
      setStep("success");
      toast({
        status: "success",
        description: text.toastSuccess(parsedAmount),
      });
    } catch (error: any) {
      toast({
        status: "error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          text.toastErrorDefault,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{text.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {step === "input" && (
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                {text.inputDesc}
              </Text>
              <Box
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                bg="gray.50"
              >
                <Text fontSize="sm" color="gray.600" mb={1}>
                  {text.currentBalance}
                </Text>
                <Heading size="md" color="teal.600">
                  ¥{formatCurrency(walletBalance, language)}
                </Heading>
              </Box>
              <NumberInput
                min={0.01}
                max={walletBalance}
                precision={2}
                step={50}
                value={amount}
                onChange={(value) => setAmount(value)}
              >
                <NumberInputField placeholder={text.placeholder} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {parsedAmount > walletBalance && (
                <Alert status="warning" borderRadius="md" size="sm">
                  <AlertIcon />
                  {text.warnExceed}
                </Alert>
              )}
              <Text fontSize="xs" color="gray.500">
                {text.hint}
              </Text>
            </VStack>
          )}
          {step === "confirm" && (
            <VStack spacing={4} align="center" py={4}>
              <Alert status="info" borderRadius="md" width="100%">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    {text.confirmTitle}
                  </Text>
                  <Text fontSize="sm">
                    {text.confirmDesc(parsedAmount.toFixed(2))}
                  </Text>
                </Box>
              </Alert>
            </VStack>
          )}
          {step === "success" && (
            <VStack spacing={3} align="center" py={6}>
              <CheckCircleIcon color="green.400" boxSize={12} />
              <Heading size="md">{text.successTitle}</Heading>
              <Text color="gray.600" textAlign="center">
                {text.successDesc(
                  confirmedAmount.toFixed(2),
                  formatCurrency(currentUser?.walletBalance, language)
                )}
              </Text>
              <Alert status="info" borderRadius="md" width="100%">
                <AlertIcon />
                <Text fontSize="sm">{text.successHint}</Text>
              </Alert>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          {step === "input" && (
            <>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                {text.btnCancel}
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleNext}
                isDisabled={parsedAmount <= 0 || parsedAmount > walletBalance}
              >
                {text.btnConfirm}
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => setStep("input")}
                isDisabled={loading}
              >
                {text.btnBack}
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleWithdraw}
                isLoading={loading}
              >
                {text.btnConfirm}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button colorScheme="orange" onClick={handleClose}>
              {text.btnDone}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

