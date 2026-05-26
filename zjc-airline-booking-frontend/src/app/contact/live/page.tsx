"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Select,
  Flex,
  Avatar,
  Divider,
  HStack,
  Input,
  IconButton,
  Button,
  useToast,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { deepseekApi, ChatMessage } from "@/lib/deepseek";
import { bookingApi, BookingItem } from "@/lib/bookings";
import { flightApi, Flight } from "@/lib/flights";
import { getAuth } from "@/lib/auth";
import { useLanguage, type LanguageKey } from "@/context/LanguageContext";
import { getBookingRulesText, getBookingRulesTextEn } from "@/lib/booking-rules";

interface ChatBubble {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const localeMap: Record<LanguageKey, string> = {
  "zh-CN": "zh-CN",
  "en-US": "en-US",
};

const formatDateTime = (value?: string, lang: LanguageKey = "zh-CN") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(localeMap[lang], { hour12: lang === "en-US" });
};

const formatCurrency = (value?: number, lang: LanguageKey = "zh-CN") => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "-";
  }
  return Number(value).toLocaleString(localeMap[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const liveI18n = {
  "zh-CN": {
    heading: "真人客服 · 小溪",
    status: "现在是在线时间，可随时咨询~",
    selectLatest: "显示上次聊天记录",
    selectNew: "开启新会话",
    assistantName: "小溪",
    userName: "我",
    typing: "正在输入...",
    placeholder: "请输入您的问题...",
    sendLabel: "发送",
    initialMessage:
      "您好！我是小溪，很高兴为您服务。我可以协助查询订单、机票、航班信息，也可帮您联系技术团队。请告诉我需要了解的问题吧～",
    fallbackMessage:
      "抱歉，我暂时无法处理该请求，稍后会有人工客服继续跟进。若紧急请拨打 400-800-1234。",
    toastErrorTitle: "请求失败",
    toastErrorDesc: "请稍后再试",
    orderKeywords: ["订单", "订票", "预订", "我的订单", "查询订单", "票单"],
    flightKeywords: [
      "航班",
      "飞机",
      "机票",
      "票价",
      "价格",
      "多少",
      "费用",
      "查询航班",
      "搜索航班",
      "今天",
      "明天",
      "明日",
      "出发",
    ],
    systemPrompt:
      "你是名为小溪的真人客服助手，语气亲切、专业、耐心。你熟悉航班与订单信息，回答时主动引用提供的数据，并邀请用户继续提问或转接人工同事。当用户询问退票、改签、手续费等退改签相关问题时，你必须严格按照系统提供的业务规则来回答，不要编造或猜测规则内容。",
    summary: {
      ordersTitle: "我为您查询到以下订单：",
      flightsTitle: "以下航班与您的需求匹配：",
      moreHint: "如需查看更多详情，您可以点击右下角的相关页面。",
      orderFields: {
        orderNo: "订单号",
        flight: "航班",
        route: "航线",
        depart: "出发",
        tickets: "票数",
        amount: "金额",
        status: "状态",
      },
      flightFields: {
        flight: "航班",
        depart: "出发",
        arrive: "到达",
        price: "票价",
        seats: "剩余座位",
      },
      noOrder: "【订单查询结果】未找到匹配记录。",
      noFlight: "【航班查询结果】未找到匹配航班。",
      orderHeader: "【用户订单信息】",
      flightHeader: "【航班查询结果】",
    },
    toastThinking: {
      wait: "正在生成回复",
    },
  },
  "en-US": {
    heading: "Live Support · Brook",
    status: "An agent is online now. Ask anything!",
    selectLatest: "Show last conversation",
    selectNew: "Start new session",
    assistantName: "Brook",
    userName: "Me",
    typing: "Typing...",
    placeholder: "Type your question...",
    sendLabel: "Send",
    initialMessage:
      "Hi! I'm Brook, your virtual assistant. I can help check orders, tickets, flight information, or escalate to our engineers. How may I assist you today?",
    fallbackMessage:
      "Sorry, I can't process that request right now. A human agent will follow up soon. For urgent cases call 400-800-1234.",
    toastErrorTitle: "Request failed",
    toastErrorDesc: "Please try again later.",
    orderKeywords: ["order", "booking", "reservation", "my order", "ticket"],
    flightKeywords: [
      "flight",
      "plane",
      "ticket",
      "fare",
      "price",
      "cost",
      "search flight",
      "today",
      "tomorrow",
      "depart",
      "arrive",
    ],
    systemPrompt:
      "You are Brook, a friendly but professional airline support agent. Reference provided flight/order data in replies and invite the user to continue asking or escalate to a human colleague when needed. When users ask about refund, change booking, fees, or related policies, you must strictly follow the business rules provided by the system and do not make up or guess the rules.",
    summary: {
      ordersTitle: "Here are the orders I found:",
      flightsTitle: "These flights match your request:",
      moreHint: "Need more details? Use the quick links on the lower-right corner.",
      orderFields: {
        orderNo: "Order ID",
        flight: "Flight",
        route: "Route",
        depart: "Departure",
        tickets: "Tickets",
        amount: "Amount",
        status: "Status",
      },
      flightFields: {
        flight: "Flight",
        depart: "Depart",
        arrive: "Arrive",
        price: "Fare",
        seats: "Seats left",
      },
      noOrder: "[Order search] No matching record.",
      noFlight: "[Flight search] No matching flight found.",
      orderHeader: "[Order data]",
      flightHeader: "[Flight search]",
    },
    toastThinking: {
      wait: "Generating reply",
    },
  },
} as const;

const buildDataSummary = (
  orders: BookingItem[],
  flights: Flight[],
  lang: LanguageKey,
  summaryStrings: (typeof liveI18n)["zh-CN"]["summary"]
) => {
  if (!orders.length && !flights.length) {
    return "";
  }
  const sections: string[] = [];

  if (orders.length) {
    const orderLines = orders.slice(0, 5).map((order, idx) => {
      return `${idx + 1}. ${summaryStrings.orderFields.orderNo}：${order.orderNo || order.id}
${summaryStrings.orderFields.flight}：${order.flightNumber || "-"}（${order.from || "-"} → ${
        order.to || "-"
      }）
${summaryStrings.orderFields.depart}：${formatDateTime(order.departTime, lang)}
${summaryStrings.orderFields.tickets}：${order.tickets ?? "-"}
${summaryStrings.orderFields.amount}：¥${formatCurrency(order.amount, lang)}
${summaryStrings.orderFields.status}：${order.status || "-"}`.trimEnd();
    });
    sections.push(`${summaryStrings.ordersTitle}\n${orderLines.join("\n\n")}`);
  }

  if (flights.length) {
    const flightLines = flights.slice(0, 5).map((flight, idx) => {
      const seatsLeft =
        flight.seatsLeft ??
        flight.seats?.reduce(
          (sum, seat) => sum + (seat.remainingSeats ?? 0),
          0
        );
      return `${idx + 1}. ${summaryStrings.flightFields.flight}：${flight.flightNumber || "-"}（${
        flight.from || "-"
      } → ${flight.to || "-"}）
${summaryStrings.flightFields.depart}：${formatDateTime(flight.departTime, lang)}
${summaryStrings.flightFields.arrive}：${formatDateTime(flight.arrivalTime, lang)}
${summaryStrings.flightFields.price}：¥${formatCurrency(flight.price, lang)}
${summaryStrings.flightFields.seats}：${seatsLeft ?? "-"}`.trimEnd();
    });
    sections.push(`${summaryStrings.flightsTitle}\n${flightLines.join("\n\n")}`);
  }

  sections.push(summaryStrings.moreHint);

  return sections.join("\n\n");
};

const searchOrderByNumber = async (
  orderNo: string
): Promise<BookingItem | null> => {
  try {
    const orders = await bookingApi.list({});
    const order = orders.find(
      (o) =>
        o.orderNo?.toLowerCase() === orderNo.toLowerCase() ||
        o.id?.toLowerCase() === orderNo.toLowerCase() ||
        String(o.orderNo).includes(orderNo) ||
        String(o.id).includes(orderNo)
    );
    return order || null;
  } catch (error) {
    console.error("按订单号查询失败:", error);
    return null;
  }
};

const searchOrders = async (query?: string): Promise<BookingItem[]> => {
  try {
    if (query) {
      const orderNoMatch = query.match(
        /(?:订单号|订单|order\s*(?:no\.?|number)?)[：:]*\s*([A-Za-z0-9]+)/i
      );
      if (orderNoMatch) {
        const orderNo = orderNoMatch[1];
        const order = await searchOrderByNumber(orderNo);
        return order ? [order] : [];
      }
    }

    const auth = getAuth();
    if (!auth?.id) {
      try {
        return await bookingApi.list({});
      } catch {
        return [];
      }
    }

    const userId =
      typeof auth.id === "number" ? auth.id : parseInt(String(auth.id), 10);

    if (isNaN(userId)) {
      try {
        return await bookingApi.list({});
      } catch {
        return [];
      }
    }

    return await bookingApi.list({ userId });
  } catch (error) {
    console.error("查询订单失败:", error);
    return [];
  }
};

const parseDateQuery = (query: string): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetMap: Record<string, number> = {
    "(今天|今日|当天|当日)": 0,
    "(明天|明日|次日)": 1,
    "(后天|后日)": 2,
  };

  for (const [pattern, offset] of Object.entries(targetMap)) {
    if (query.match(new RegExp(pattern))) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    }
  }

  if (query.match(/(下周|下星期)/)) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  }

  const dateMatch = query.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnDateMatch = query.match(/(\d{1,2})[月](\d{1,2})[日号]/);
  if (cnDateMatch) {
    const [, month, day] = cnDateMatch;
    const year = today.getFullYear();
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    if (date < today) {
      date.setFullYear(year + 1);
    }
    return date.toISOString().split("T")[0];
  }

  return null;
};

const searchFlightByNumber = async (
  flightNumber: string
): Promise<Flight | null> => {
  try {
    const allFlights = await flightApi.listAll();
    const flight = allFlights.find(
      (f) =>
        f.flightNumber?.toLowerCase() === flightNumber.toLowerCase() ||
        f.flightNumber?.includes(flightNumber) ||
        f.id?.toLowerCase() === flightNumber.toLowerCase()
    );
    return flight || null;
  } catch (error) {
    console.error("按航班号查询失败:", error);
    return null;
  }
};

const searchFlights = async (query?: string): Promise<Flight[]> => {
  try {
    if (!query) {
      return await flightApi.listAll();
    }

    const flightNoMatch = query.match(
      /(?:航班号|航班|flight\s*(?:no\.?|number)?)[：:]*\s*([A-Za-z0-9]+)/i
    );
    if (flightNoMatch) {
      const flightNumber = flightNoMatch[1];
      const flight = await searchFlightByNumber(flightNumber);
      return flight ? [flight] : [];
    }

    const date = parseDateQuery(query);

    const fromMatch = query.match(/(从|自|由|出发地|起点)\s*([^到至往的地]+)/);
    const toMatch = query.match(/(到|至|往|目的地|终点)\s*([^的从自由出发终点]+)/);

    let from = fromMatch?.[2]?.trim();
    let to = toMatch?.[2]?.trim();

    if (!from && !to) {
      const simpleMatch = query.match(/([^到至-]+)[到至-]([^到至-]+)/);
      if (simpleMatch) {
        from = simpleMatch[1].trim();
        to = simpleMatch[2].trim();
      }
    }

    const searchQuery: Record<string, string> = {};
    if (from) searchQuery.from = from;
    if (to) searchQuery.to = to;
    if (date) searchQuery.date = date;

    if (Object.keys(searchQuery).length > 0) {
      return await flightApi.search(searchQuery);
    }

    return await flightApi.listAll();
  } catch (error) {
    console.error("查询航班失败:", error);
    return [];
  }
};

const STORAGE_KEY = "live_customer_chat_history";

const loadChatHistory = (): ChatBubble[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    }
  } catch (error) {
    console.error("加载聊天记录失败:", error);
  }
  return null;
};

const saveChatHistory = (messages: ChatBubble[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("保存聊天记录失败:", error);
  }
};

const clearChatHistory = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("清除聊天记录失败:", error);
  }
};

export default function LiveCustomerPage() {
  const toast = useToast();
  const { language } = useLanguage();
  const t = liveI18n[language] || liveI18n["zh-CN"];
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionMode, setSessionMode] = useState<"latest" | "new">("latest");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionMode === "latest") {
      const history = loadChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            role: "assistant",
            content: t.initialMessage,
            timestamp: new Date(),
          },
        ]);
      }
    } else {
      setMessages([
        {
          role: "assistant",
          content: t.initialMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [sessionMode, t.initialMessage]);

  useEffect(() => {
    if (messages.length > 0 && (messages.length > 1 || messages[0].role !== "assistant" || messages[0].content !== t.initialMessage)) {
      saveChatHistory(messages);
    }
  }, [messages, t.initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    setInputValue("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setIsLoading(true);

    let foundOrders: BookingItem[] = [];
    let foundFlights: Flight[] = [];

    try {
      const normalized = userMessage.toLowerCase();
      const shouldQueryOrders = t.orderKeywords.some((keyword) =>
        normalized.includes(keyword.toLowerCase())
      );
      const shouldQueryFlights =
        t.flightKeywords.some((keyword) => normalized.includes(keyword.toLowerCase())) ||
        userMessage.match(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/) ||
        userMessage.match(/\d{1,2}月\d{1,2}日/);

      // 检测是否询问退改签相关问题
      const shouldProvideRules =
        normalized.includes("退票") ||
        normalized.includes("改签") ||
        normalized.includes("退改") ||
        normalized.includes("手续费") ||
        normalized.includes("退款") ||
        normalized.includes("退费") ||
        normalized.includes("改期") ||
        normalized.includes("换票") ||
        normalized.includes("退改签") ||
        normalized.includes("退改规则") ||
        normalized.includes("退改政策");

      let contextData = "";

      // 如果询问退改签相关问题，添加业务规则到上下文
      if (shouldProvideRules) {
        const rulesText = language === "zh-CN" ? getBookingRulesText() : getBookingRulesTextEn();
        contextData += "\n\n" + rulesText;
      }

      if (shouldQueryOrders) {
        foundOrders = await searchOrders(userMessage);
        if (foundOrders.length > 0) {
          contextData += `\n\n${t.summary.orderHeader}\n`;
          foundOrders.forEach((order) => {
            contextData += `${t.summary.orderFields.orderNo}：${order.orderNo || order.id}\n`;
            contextData += `${t.summary.orderFields.flight}：${order.flightNumber}\n`;
            contextData += `${t.summary.orderFields.route}：${order.from} → ${order.to}\n`;
            contextData += `${t.summary.orderFields.depart}：${formatDateTime(
              order.departTime,
              language
            )}\n`;
            contextData += `${t.summary.orderFields.tickets}：${order.tickets}\n`;
            contextData += `${t.summary.orderFields.amount}：¥${formatCurrency(
              order.amount,
              language
            )}\n`;
            contextData += `${t.summary.orderFields.status}：${order.status}\n`;
            contextData += `---\n`;
          });
        } else {
          contextData += `\n\n${t.summary.noOrder}`;
        }
      }

      if (shouldQueryFlights) {
        foundFlights = await searchFlights(userMessage);
        if (foundFlights.length > 0) {
          contextData += `\n\n${t.summary.flightHeader}\n`;
          const displayFlights = foundFlights.slice(0, 10);
          displayFlights.forEach((flight, index) => {
            contextData += `${index + 1}. ${t.summary.flightFields.flight}：${flight.flightNumber}\n`;
            contextData += `   ${t.summary.orderFields.route}：${flight.from} → ${flight.to}\n`;
            contextData += `   ${t.summary.flightFields.depart}：${formatDateTime(
              flight.departTime,
              language
            )}\n`;
            contextData += `   ${t.summary.flightFields.arrive}：${formatDateTime(
              flight.arrivalTime,
              language
            )}\n`;
            contextData += `   ${t.summary.flightFields.price}：¥${formatCurrency(
              flight.price,
              language
            )}\n`;
            contextData += `   ${t.summary.flightFields.seats}：${flight.seatsLeft ?? "-"}\n\n`;
          });
        } else {
          contextData += `\n\n${t.summary.noFlight}`;
        }
      }

      const chatHistory: ChatMessage[] = [
        {
          role: "system",
          content: t.systemPrompt,
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user",
          content: userMessage + contextData,
        },
      ];

      const response = await deepseekApi.chat(chatHistory);
      const dataSummary = buildDataSummary(foundOrders, foundFlights, language, t.summary);

      const assistantMessage: ChatBubble = {
        role: "assistant",
        content:
          [response?.trim(), dataSummary].filter(Boolean).join("\n\n") ||
          t.fallbackMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("真人客服模拟出错:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t.fallbackMessage,
          timestamp: new Date(),
        },
      ]);
      toast({
        title: t.toastErrorTitle,
        description: error.message || t.toastErrorDesc,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex
      direction="column"
      height="calc((100vh - 80px) / 2)"
      minH="420px"
      maxW="900px"
      mx="auto"
      mt={4}
      bg="white"
      borderRadius="xl"
      boxShadow="xl"
      overflow="hidden"
    >
      <Box bg="gray.50" px={6} py={4} borderBottomWidth="1px">
        <Flex align="center">
          <Heading size="md">{t.heading}</Heading>
          <Flex flex="1" />
          <Select
            size="sm"
            width="200px"
            value={sessionMode}
            onChange={(e) => {
              const newMode = e.target.value as "latest" | "new";
              setSessionMode(newMode);
              if (newMode === "new") {
                clearChatHistory();
              }
            }}
          >
            <option value="latest">{t.selectLatest}</option>
            <option value="new">{t.selectNew}</option>
          </Select>
        </Flex>
        <Text fontSize="sm" color="gray.500" mt={1}>
          {t.status}
        </Text>
      </Box>

      <Box px={6} py={4} bg="gray.50" flex="1" overflowY="auto">
        <VStack align="stretch" spacing={4}>
          {messages.map((msg, idx) => (
            <Flex
              key={idx}
              justify={msg.role === "user" ? "flex-end" : "flex-start"}
              align="flex-start"
              gap={3}
            >
              {msg.role === "assistant" && (
                <Avatar
                  size="sm"
                  name={t.assistantName}
                  bg="gray.200"
                />
              )}
              <Box
                maxW="70%"
                bg={msg.role === "user" ? "blue.500" : "gray.100"}
                color={msg.role === "user" ? "white" : "gray.800"}
                px={4}
                py={3}
                borderRadius="xl"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                fontSize="sm"
              >
                {msg.content}
              </Box>
              {msg.role === "user" && (
                <Avatar size="sm" bg="gray.400" name={t.userName} />
              )}
            </Flex>
          ))}

          {isLoading && (
            <Flex justify="flex-start" align="center" gap={3}>
              <Avatar size="sm" name={t.assistantName} bg="gray.200" />
              <Box bg="gray.100" px={4} py={2} borderRadius="lg">
                <Text fontSize="sm" color="gray.600">
                  {t.typing}
                </Text>
              </Box>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Divider />

      <Box px={6} py={4} bg="white">
        <HStack spacing={3}>
          <Input
            placeholder={t.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            isDisabled={isLoading}
          />
          <IconButton
            aria-label={t.sendLabel}
            colorScheme="blue"
            icon={<ArrowForwardIcon />}
            onClick={handleSend}
            isLoading={isLoading}
            isDisabled={!inputValue.trim() || isLoading}
          />
        </HStack>
      </Box>
    </Flex>
  );
}
