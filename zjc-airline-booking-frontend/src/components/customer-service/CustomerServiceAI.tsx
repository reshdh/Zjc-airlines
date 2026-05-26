"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Avatar,
  Spinner,
  Flex,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Image from "next/image";
import { deepseekApi, ChatMessage } from "@/lib/deepseek";
import { bookingApi, BookingItem } from "@/lib/bookings";
import { flightApi, Flight } from "@/lib/flights";
import { getAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { getBookingRulesText } from "@/lib/booking-rules";

interface ChatBubble {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  links?: Array<{
    text: string;
    url: string;
    type: "order" | "flight" | "page";
  }>;
  quickActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

const SYSTEM_PROMPT = `你是一个专业的航空公司客服AI智能助手。你的职责是：

1. 友好地解答用户关于航班、订票、退改签等基础问题
2. **智能查询功能**：你可以理解用户的自然语言查询，并自动从数据库中获取相关数据
   - 当用户询问"今天的票价"、"明天的航班"等日期相关问题，你会收到对应日期的航班数据
   - 当用户询问"从北京到上海的票价"等路线问题时，你会收到对应路线的航班数据
   - 当用户询问"查询票价"、"票价是多少"等问题时，你会收到所有可用航班的票价信息
   - 当用户询问订单号（如"查询订单BK123456"），你会收到该订单的详细信息
   - 当用户询问航班号（如"查询航班ZJC001"），你会收到该航班的详细信息
3. **退改签业务规则**：当用户询问退票、改签、手续费等相关问题时，你必须根据系统提供的业务规则来回答。这些规则会在你的上下文中提供，请严格按照规则回答，不要编造或猜测规则内容。
4. **链接和跳转功能**：
   - 当查询到订单信息时，你可以在回复中提到"点击[查看订单]按钮查看详细信息"
   - 当查询到航班信息时，你可以在回复中提到"点击[查看航班]按钮预订机票"或"点击[查看详情]查看航班信息"
   - 用户可以点击这些链接直接跳转到相应的页面
5. 如果用户询问订单信息，你应该告诉用户你正在查询他们的订单
6. 回答要简洁、准确、专业，用友好的方式展示查询结果
7. 当用户询问退改签规则时，要清晰地说明手续费、时间限制等关键信息

**数据格式说明**：
- 当你收到航班数据时，请以表格或列表的形式清晰地展示：
  * 航班号
  * 路线（出发地 → 目的地）
  * 出发时间和到达时间
  * 票价（¥价格）
  * 剩余座位数
- 如果查询结果较多，请展示最相关的5-10条，并可以建议用户缩小查询范围
- 在展示订单或航班信息时，记得提醒用户可以点击相应的按钮查看详情或进行预订

如果用户明确要求联系真人客服，或者问题超出你的能力范围，请建议用户访问联系客服页面或拨打客服热线。`;

export function CustomerServiceAI() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  useEffect(() => {
    if (windowWidth > 0 && windowHeight > 0 && position.x === 0 && position.y === 0) {
      const buttonWidth = 120;
      const buttonHeight = 120;
      setPosition({
        x: windowWidth - buttonWidth - 20,
        y: Math.max(20, windowHeight - buttonHeight - 20),
      });
    }
  }, [windowWidth, windowHeight, position]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "您好！我是 ZJC 航空公司的 AI 客服助手。我可以帮助您查询订单、航班信息，或回答一些常见问题。如有需要，也可以帮您转接真人客服。请告诉我您需要什么帮助？",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", { hour12: false });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return "-";
    }
    return Number(value).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const buildDataSummary = (orders: BookingItem[], flights: Flight[]) => {
    if (!orders.length && !flights.length) {
      return "";
    }

    const sections: string[] = ["正在为您查询相关信息，请稍候...\n"];

    if (orders.length) {
      const orderLines = orders.slice(0, 5).map((order, idx) => {
        return `${idx + 1}. 订单号：${order.orderNo || order.id}
   航班：${order.flightNumber || "未知"}（${order.from || "-"} → ${
          order.to || "-"
        }）
   出发：${formatDateTime(order.departTime)}
   票数：${order.tickets ?? "-"}
   金额：¥${formatCurrency(order.amount)}
   状态：${order.status || "-"}`
          .trimEnd();
      });
      sections.push(`查询到以下订单：\n${orderLines.join("\n\n")}`);
    }

    if (flights.length) {
      const flightLines = flights.slice(0, 5).map((flight, idx) => {
        const seatsLeft =
          flight.seatsLeft ??
          flight.seats?.reduce(
            (sum, seat) => sum + (seat.remainingSeats ?? 0),
            0
          );
        return `${idx + 1}. 航班：${flight.flightNumber || "-"}（${
          flight.from || "-"
        } → ${flight.to || "-"}）
   出发：${formatDateTime(flight.departTime)}
   到达：${formatDateTime(flight.arrivalTime)}
   票价：¥${formatCurrency(flight.price)}
   剩余座位：${seatsLeft ?? "-"}`
          .trimEnd();
      });
      sections.push(`查询到以下航班：\n${flightLines.join("\n\n")}`);
    }

    sections.push(
      "您可以点击「查看我的订单」获取更多详情，如需其它帮助请继续告诉我。"
    );

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
        const orderNoMatch = query.match(/(?:订单号|订单)[：:]*\s*([A-Za-z0-9]+)/i);
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

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    if (query.match(/(今天|今日|当天|当日)/)) {
      return today.toISOString().split("T")[0];
    }
    if (query.match(/(明天|明日|次日)/)) {
      return tomorrow.toISOString().split("T")[0];
    }
    if (query.match(/(后天|后日)/)) {
      return dayAfterTomorrow.toISOString().split("T")[0];
    }
    if (query.match(/(下周|下星期)/)) {
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

      const flightNoMatch = query.match(/(?:航班号|航班)[：:]*\s*([A-Za-z0-9]+)/i);
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

      const searchQuery: any = {};
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

  const handleSend = async () => {
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    if (
      userMessage.includes("真人客服") ||
      userMessage.includes("人工客服") ||
      userMessage.includes("联系客服") ||
      userMessage.includes("人工服务")
    ) {
      router.push("/contact");
      onClose();
      return;
    }

    setInputValue("");
    const newUserMessage: ChatBubble = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    let foundOrders: BookingItem[] = [];
    let foundFlights: Flight[] = [];
    let quickActions: ChatBubble["quickActions"] = [];

    try {
      const shouldQueryOrders =
        userMessage.includes("订单") ||
        userMessage.includes("订票") ||
        userMessage.includes("预订") ||
        userMessage.includes("我的订单") ||
        userMessage.includes("查询订单");

      const shouldQueryFlights =
        userMessage.includes("航班") ||
        userMessage.includes("飞机") ||
        userMessage.includes("机票") ||
        userMessage.includes("票价") ||
        userMessage.includes("价格") ||
        userMessage.includes("多少钱") ||
        userMessage.includes("费用") ||
        userMessage.includes("查询航班") ||
        userMessage.includes("搜索航班") ||
        userMessage.includes("今天") ||
        userMessage.includes("明天") ||
        userMessage.includes("今日") ||
        userMessage.includes("明日") ||
        userMessage.match(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/) ||
        userMessage.match(/\d{1,2}月\d{1,2}日/);

      // 检测是否询问退改签相关问题
      const shouldProvideRules =
        userMessage.includes("退票") ||
        userMessage.includes("改签") ||
        userMessage.includes("退改") ||
        userMessage.includes("手续费") ||
        userMessage.includes("退款") ||
        userMessage.includes("退费") ||
        userMessage.includes("改期") ||
        userMessage.includes("换票") ||
        userMessage.includes("退改签") ||
        userMessage.includes("退改规则") ||
        userMessage.includes("退改政策");

      let contextData = "";

      // 如果询问退改签相关问题，添加业务规则到上下文
      if (shouldProvideRules) {
        contextData += "\n\n" + getBookingRulesText();
      }

      if (shouldQueryOrders) {
        foundOrders = await searchOrders(userMessage);
        if (foundOrders.length > 0) {
          contextData += "\n\n【用户订单信息 - 从数据库获取的实时数据】\n";
          foundOrders.forEach((order) => {
            contextData += `订单号：${order.orderNo || order.id}\n`;
            contextData += `航班：${order.flightNumber}\n`;
            contextData += `路线：${order.from} → ${order.to}\n`;
            contextData += `出发时间：${order.departTime}\n`;
            contextData += `票数：${order.tickets}\n`;
            contextData += `金额：¥${order.amount}\n`;
            contextData += `状态：${order.status}\n`;
            contextData += `---\n`;
          });
        } else {
          contextData += "\n\n【订单查询结果】未在数据库中找到匹配的订单记录。";
        }
      }

      if (shouldQueryFlights) {
        foundFlights = await searchFlights(userMessage);
        if (foundFlights.length > 0) {
          contextData += "\n\n【航班查询结果 - 从数据库获取的实时数据】\n";
          contextData += `共找到 ${foundFlights.length} 个航班：\n\n`;

          const displayFlights = foundFlights.slice(0, 10);
          displayFlights.forEach((flight, index) => {
            contextData += `${index + 1}. 航班号：${flight.flightNumber}\n`;
            contextData += `   路线：${flight.from} → ${flight.to}\n`;
            contextData += `   出发时间：${new Date(
              flight.departTime
            ).toLocaleString("zh-CN")}\n`;
            contextData += `   到达时间：${new Date(
              flight.arrivalTime
            ).toLocaleString("zh-CN")}\n`;
            contextData += `   票价：¥${flight.price.toFixed(2)}\n`;
            contextData += `   剩余座位：${flight.seatsLeft} 个\n`;
            if (flight.duration) {
              contextData += `   飞行时长：${flight.duration}\n`;
            }
            contextData += `\n`;
          });

          if (foundFlights.length > 10) {
            contextData += `\n注：还有 ${
              foundFlights.length - 10
            } 个航班未显示，请缩小查询范围获取更精确的结果。\n`;
          }

          const totalPrice = foundFlights.reduce((sum, f) => sum + f.price, 0);
          const avgPrice = totalPrice / foundFlights.length;
          const minPrice = Math.min(...foundFlights.map((f) => f.price));
          const maxPrice = Math.max(...foundFlights.map((f) => f.price));

          contextData += `\n【票价统计】\n`;
          contextData += `平均票价：¥${avgPrice.toFixed(2)}\n`;
          contextData += `最低票价：¥${minPrice.toFixed(2)}\n`;
          contextData += `最高票价：¥${maxPrice.toFixed(2)}\n`;
        } else {
          contextData += "\n\n【航班查询结果】未在数据库中找到匹配的航班。建议：\n";
          contextData += "1. 检查出发地和目的地是否正确\n";
          contextData += "2. 尝试调整日期范围\n";
          contextData += "3. 或联系客服获取更多帮助\n";
        }
      }

      const dataSummary = buildDataSummary(foundOrders, foundFlights);

      const chatHistory: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
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

      quickActions = [];
      if (foundOrders.length > 0) {
        quickActions.push({
          label: "查看我的订单",
          action: () => {
            router.push("/bookings");
            onClose();
          },
        });
      }

      if (foundFlights.length > 0) {
        if (foundFlights.length === 1) {
          const flight = foundFlights[0];
          quickActions.push({
            label: `查看航班 ${flight.flightNumber}`,
            action: () => {
              router.push(
                `/flights?from=${encodeURIComponent(
                  flight.from
                )}&to=${encodeURIComponent(flight.to)}`
              );
              onClose();
            },
          });
        } else {
          quickActions.push({
            label: "查看航班列表",
            action: () => {
              router.push("/flights");
              onClose();
            },
          });
        }
      }

      const combinedContent = [response?.trim(), dataSummary]
        .filter(Boolean)
        .join("\n\n");

      const assistantMessage: ChatBubble = {
        role: "assistant",
        content:
          combinedContent ||
          "抱歉，暂时无法获取有效的回复。如果需要帮助，请稍后再试或联系真人客服。",
        timestamp: new Date(),
        quickActions: quickActions.length > 0 ? quickActions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI 回应错误:", error);
      const errorMessage: ChatBubble = {
        role: "assistant",
        content:
          "抱歉，我暂时无法处理您的请求。请稍后再试，或直接联系我们的真人客服：400-800-1234，或访问联系客服页面。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "请求失败",
        description: error.message || "请稍后再试",
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  };

  useEffect(() => {
    if (!windowWidth || !windowHeight) return;

    let currentPos = { ...position };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStart) return;

      const buttonWidth = 120;
      const buttonHeight = 120;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      newX = Math.max(0, Math.min(newX, windowWidth - buttonWidth));
      newY = Math.max(0, Math.min(newY, windowHeight - buttonHeight));

      currentPos = { x: newX, y: newY };
      setPosition(currentPos);
    };

    const handleMouseUp = (e?: MouseEvent) => {
      if (!isDragging) return;

      const clientX = e?.clientX || dragStart?.x || 0;
      const clientY = e?.clientY || dragStart?.y || 0;
      const moved =
        dragStart &&
        (Math.abs(clientX - dragStart.x) > 5 ||
          Math.abs(clientY - dragStart.y) > 5);

      setIsDragging(false);

      if (moved) {
        const buttonWidth = 120;
        const buttonHeight = 120;
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;
        const centerThresholdX = windowWidth * 0.25;
        const centerThresholdY = windowHeight * 0.25;

        const currentCenterX = currentPos.x + buttonWidth / 2;
        const currentCenterY = currentPos.y + buttonHeight / 2;

        const inCenterX = Math.abs(currentCenterX - centerX) < centerThresholdX;
        const inCenterY = Math.abs(currentCenterY - centerY) < centerThresholdY;

        if (inCenterX && inCenterY) {
          const targetX =
            currentCenterX < centerX ? 20 : windowWidth - buttonWidth - 20;
          const targetY = Math.max(
            20,
            Math.min(windowHeight - buttonHeight - 20, currentPos.y)
          );

          setPosition({ x: targetX, y: targetY });
        }
      } else {
        onOpen();
      }

      setDragStart(null);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [
    isDragging,
    dragStart,
    dragOffset,
    windowWidth,
    windowHeight,
    onOpen,
    position,
  ]);

  return (
    <>
      {!isOpen && windowWidth > 0 && windowHeight > 0 && (
        <Box
          ref={buttonRef}
          position="fixed"
          left={`${position.x}px`}
          top={`${position.y}px`}
          zIndex={1000}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Box
            cursor={isDragging ? "grabbing" : "grab"}
            onMouseDown={handleMouseDown}
            opacity={0.7}
            _hover={{
              opacity: 1,
            }}
            transition={isDragging ? "none" : "all 0.3s ease"}
            width="120px"
            height="120px"
            style={{
              userSelect: "none",
            }}
          >
            <Image
              src="/globe.svg"
              alt="AI 客服"
              width={120}
              height={120}
              style={{
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",
              }}
              unoptimized
              draggable={false}
            />
          </Box>

          {showTooltip && (
            <Box
              position="absolute"
              left={position.x < windowWidth / 2 ? "110px" : "auto"}
              right={position.x >= windowWidth / 2 ? "110px" : "auto"}
              top="50%"
              transform="translateY(-50%)"
              bg="white"
              color="gray.700"
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="10px"
              boxShadow="0 8px 18px rgba(15, 23, 42, 0.12)"
              opacity={0.9}
              zIndex={1001}
              pointerEvents="none"
              transition="opacity 0.2s ease"
              minW="160px"
              fontFamily='"Segoe UI", "Arial", sans-serif'
              _before={{
                content: '""',
                position: "absolute",
                width: "24px",
                height: "24px",
                background: "white",
                borderRadius: "50%",
                left: position.x < windowWidth / 2 ? "-10px" : "auto",
                right: position.x >= windowWidth / 2 ? "-10px" : "auto",
                top: "50%",
                transform: "translateY(-60%)",
                boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.05)",
              }}
              _after={{
                content: '""',
                position: "absolute",
                width: "16px",
                height: "16px",
                background: "white",
                borderRadius: "50%",
                left: position.x < windowWidth / 2 ? "-22px" : "auto",
                right: position.x >= windowWidth / 2 ? "-22px" : "auto",
                top: "50%",
                transform: "translateY(-30%)",
                boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.05)",
              }}
            >
              <HStack
                spacing={1}
                alignItems="center"
                justifyContent="center"
                fontWeight="medium"
                fontSize="10px"
                color="gray.700"
              >
                <Text whiteSpace="nowrap">我是小Z</Text>
                <Text>,</Text>
                <Text whiteSpace="nowrap">需要帮忙吗?</Text>
              </HStack>
            </Box>
          )}
        </Box>
      )}

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={3}>
              <Box
                position="relative"
                width="40px"
                height="40px"
                borderRadius="full"
                overflow="hidden"
              >
                <Image
                  src="/globe.svg"
                  alt="AI 客服"
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">AI 客服助手</Text>
                <Text fontSize="xs" color="gray.500">
                  随时为您服务
                </Text>
              </VStack>
            </HStack>
          </DrawerHeader>

          <DrawerBody p={0} display="flex" flexDirection="column">
            <VStack
              flex="1"
              align="stretch"
              spacing={4}
              p={4}
              overflowY="auto"
              minH="0"
            >
              {messages.map((msg, idx) => (
                <VStack
                  key={idx}
                  align={msg.role === "user" ? "flex-end" : "flex-start"}
                  spacing={2}
                >
                  <Flex
                    justify={msg.role === "user" ? "flex-end" : "flex-start"}
                    align="flex-start"
                    gap={2}
                    width="100%"
                  >
                    {msg.role === "assistant" && (
                      <Box
                        position="relative"
                        width="32px"
                        height="32px"
                        borderRadius="full"
                        overflow="hidden"
                        flexShrink={0}
                      >
                        <Image
                          src="/globe.svg"
                          alt="AI 客服"
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      </Box>
                    )}
                    <Box
                      maxW="75%"
                      bg={msg.role === "user" ? "blue.500" : "gray.100"}
                      color={msg.role === "user" ? "white" : "gray.800"}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                    >
                      <Text fontSize="sm">{msg.content}</Text>
                    </Box>
                    {msg.role === "user" && <Avatar size="sm" bg="gray.400" />}
                  </Flex>

                  {msg.role === "assistant" &&
                    msg.quickActions &&
                    msg.quickActions.length > 0 && (
                      <Flex gap={2} flexWrap="wrap" width="100%" pl="40px">
                        {msg.quickActions.map((action, actionIdx) => (
                          <Button
                            key={actionIdx}
                            size="xs"
                            colorScheme="blue"
                            variant="outline"
                            onClick={action.action}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Flex>
                    )}
                </VStack>
              ))}

              {isLoading && (
                <Flex justify="flex-start" align="flex-start" gap={2}>
                  <Box
                    position="relative"
                    width="32px"
                    height="32px"
                    borderRadius="full"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    <Image
                      src="/globe.svg"
                      alt="AI 客服"
                      fill
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </Box>
                  <Box bg="gray.100" px={4} py={2} borderRadius="lg">
                    <Spinner size="sm" color="blue.500" />
                  </Box>
                </Flex>
              )}

              <div ref={messagesEndRef} />
            </VStack>

            <Divider />

            <Box p={3} bg="gray.50">
              <Button
                size="sm"
                width="100%"
                leftIcon={<ArrowForwardIcon />}
                colorScheme="blue"
                variant="outline"
                onClick={() => {
                  router.push("/contact/live");
                  onClose();
                }}
                mb={2}
              >
                联系真人客服
              </Button>
            </Box>

            <Box p={4} borderTopWidth="1px">
              <HStack spacing={2}>
                <Input
                  placeholder="输入您的问题..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  isDisabled={isLoading}
                />
                <IconButton
                  aria-label="发送"
                  icon={<ArrowForwardIcon />}
                  colorScheme="blue"
                  onClick={handleSend}
                  isLoading={isLoading}
                  isDisabled={!inputValue.trim() || isLoading}
                />
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                按 Enter 发送，Shift + Enter 换行
              </Text>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
