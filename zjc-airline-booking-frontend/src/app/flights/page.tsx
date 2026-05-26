"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  Badge,
  Tag,
  TagLabel,
  TagLeftIcon,
  Divider,
  HStack,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  IconButton,
  Select,
} from "@chakra-ui/react";
import {
  TimeIcon,
  CheckCircleIcon,
  WarningIcon,
  SmallCloseIcon,
  DeleteIcon,
} from "@chakra-ui/icons";
import { flightApi, Flight, FlightQuery } from "@/lib/flights";
import { bookingApi, BookingRequest, BookingItem, ChangeBookingRequest, seatApi, SeatSelectionResponse } from "@/lib/bookings";
import { getAuth, isAuthenticated, saveAuth } from "@/lib/auth";
import { CityPicker } from "@/components/common/CityPicker";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { translateCity } from "@/lib/i18n/cities";

const CABIN_CLASS_LABELS: Record<Language, Record<string, string>> = {
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

const statusColorMap: Record<string, string> = {
  ON_TIME: "green",
  DELAYED: "orange",
  CANCELLED: "red",
};

type FlightStatusKey = keyof typeof statusColorMap;

const statusLabelMap: Record<Language, Record<string, string>> = {
  "zh-CN": {
    ON_TIME: "准点",
    DELAYED: "延误",
    CANCELLED: "取消",
  },
  "en-US": {
    ON_TIME: "On time",
    DELAYED: "Delayed",
    CANCELLED: "Cancelled",
  },
};

type StatusLabelRecord = typeof statusLabelMap["zh-CN"];
type PriceSort = "asc" | "desc" | null;

const PAYMENT_COUNTDOWN_MINUTES = 15;
const PAYMENT_COUNTDOWN_MS = PAYMENT_COUNTDOWN_MINUTES * 60 * 1000;
const URGENT_DEPARTURE_HOURS = 12;
const URGENT_SURCHARGE_RATE = 0.1;
const REFUND_FEE_RATE = 0.01;
const DISCOUNT_RATES = [0.85, 0.9, 0.95];
const DISCOUNT_SLOTS = DISCOUNT_RATES.length;
const UNLIMITED_COLUMN_CAPACITY = Number.MAX_SAFE_INTEGER;

const deriveLowestCabinPrice = (flight?: Flight): number | null => {
  if (!flight) {
    return null;
  }
  const directPrice = Number(flight.price);
  if (Number.isFinite(directPrice) && directPrice > 0) {
    return directPrice;
  }
  if (flight.seats && flight.seats.length > 0) {
    const seatPrices = flight.seats
      .map((seat) => Number(seat.price))
      .filter((price) => Number.isFinite(price) && price > 0);
    if (seatPrices.length > 0) {
      return Math.min(...seatPrices);
    }
  }
  return null;
};

const getColumnCapacityFromInfo = (
  column: string,
  info?: SeatSelectionResponse | null
) => {
  if (!column || !info) {
    return 0;
  }
  const columnInfo = info.columnAvailability?.find((entry) => entry.column === column);
  if (columnInfo) {
    return typeof columnInfo.availableCount === "number"
      ? columnInfo.availableCount
      : 0;
  }
  if (info.availableColumns?.includes(column)) {
    return UNLIMITED_COLUMN_CAPACITY;
  }
  return 0;
};

const sanitizeSeatSelectionsWithInfo = (
  selections: string[],
  info?: SeatSelectionResponse | null
) => {
  if (!info) {
    return selections;
  }
  const usageMap = new Map<string, number>();
  return selections.map((column) => {
    if (!column) {
      return "";
    }
    const capacity = getColumnCapacityFromInfo(column, info);
    if (capacity <= 0) {
      return "";
    }
    const used = usageMap.get(column) ?? 0;
    if (capacity !== UNLIMITED_COLUMN_CAPACITY && used >= capacity) {
      return "";
    }
    usageMap.set(column, used + 1);
    return column;
  });
};

const isFlightInUrgentWindow = (departTime?: string | null) => {
  if (!departTime) return false;
  return dayjs(departTime).isBefore(dayjs().add(URGENT_DEPARTURE_HOURS, "hour"));
};

const calculateSeatUnitPrice = (
  seatPrice: number,
  discountRate?: number,
  isUrgent?: boolean
) => {
  const discounted = discountRate ? Math.round(seatPrice * discountRate) : seatPrice;
  const multiplier = isUrgent ? 1 + URGENT_SURCHARGE_RATE : 1;
  return Number((discounted * multiplier).toFixed(2));
};

const normalizeKeyword = (value?: string) => (value ? value.trim().toLowerCase() : "");

const matchesCityKeyword = (city?: string, keyword?: string) => {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return true;
  }
  const cityName = city || "";
  if (cityName.toLowerCase().includes(normalized)) {
    return true;
  }
  const englishName = translateCity(cityName, "en-US");
  return englishName.toLowerCase().includes(normalized);
};

const matchesDateKeyword = (departTime?: string, dateKeyword?: string) => {
  if (!dateKeyword || !departTime) {
    return true;
  }
  return dayjs(departTime).isSame(dayjs(dateKeyword), "day");
};

const applyFuzzyFilters = (list: Flight[], criteria: FlightQuery) => {
  return list.filter((flight) => {
    const matchFrom = matchesCityKeyword(flight.from, criteria.from);
    const matchTo = matchesCityKeyword(flight.to, criteria.to);
    const matchDate = matchesDateKeyword(flight.departTime, criteria.date);
    return matchFrom && matchTo && matchDate;
  });
};

export default function FlightsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { language } = useLanguage();
  const isEnglish = language === "en-US";
  const [query, setQuery] = useState<FlightQuery>(() => ({
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    date: searchParams.get("date") || undefined,
  }));
  const queryRef = useRef<FlightQuery>({
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    date: searchParams.get("date") || undefined,
  });
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  const changeBookingId = searchParams.get("changeBookingId");
  const [originalBooking, setOriginalBooking] = useState<BookingItem | null>(null);
  const [changePriceInfo, setChangePriceInfo] = useState<{
    newAmount: number;
    refundAmount: number;
    changeFee: number;
    priceDifference: number;
  } | null>(null);
  const [calculatingChangePrice, setCalculatingChangePrice] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedCabinClass, setSelectedCabinClass] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [priceSort, setPriceSort] = useState<PriceSort>(null);
  
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [passengerErrors, setPassengerErrors] = useState<Record<number, { name?: string; idNumber?: string; phone?: string }>>({});
  const [selectedSeatColumns, setSelectedSeatColumns] = useState<string[]>([]);
  const [discountMap, setDiscountMap] = useState<
    Record<
      string,
      {
        rate: number;
        discountedPrice: number;
        originalPrice: number;
      }
    >
  >({});
  const discountCacheRef = useRef<Record<string, { rank: number }>>({});
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  const refreshDiscounts = useCallback(async () => {
    try {
      const recommendations = await flightApi.recommendations({
        limit: DISCOUNT_SLOTS,
        includePast: false,
      });
      if (!recommendations || recommendations.length === 0) {
        discountCacheRef.current = {};
        setDiscountMap({});
        return;
      }

      const sorted = [...recommendations].sort((a, b) => (b.seatsLeft || 0) - (a.seatsLeft || 0));
      const candidates = sorted.slice(0, DISCOUNT_SLOTS);
      if (candidates.length === 0) {
        discountCacheRef.current = {};
        setDiscountMap({});
        return;
      }

      const preservedSlots: Array<Flight | null> = Array(DISCOUNT_SLOTS).fill(null);
      const usedFlights = new Set<string>();
      const previous = discountCacheRef.current;
      Object.entries(previous)
        .sort((a, b) => a[1].rank - b[1].rank)
        .forEach(([flightNumber, info]) => {
          if (info.rank < 0 || info.rank >= DISCOUNT_SLOTS) {
            return;
          }
          const matched = candidates.find((flight) => flight.flightNumber === flightNumber);
          if (matched) {
            preservedSlots[info.rank] = matched;
            usedFlights.add(matched.flightNumber);
          }
        });

      const finalSlots = [...preservedSlots];
      candidates.forEach((flight) => {
        if (usedFlights.has(flight.flightNumber)) {
          return;
        }
        const emptyIndex = finalSlots.findIndex((slot) => slot === null);
        if (emptyIndex === -1) {
          return;
        }
        finalSlots[emptyIndex] = flight;
        usedFlights.add(flight.flightNumber);
      });

      const nextCache: Record<string, { rank: number }> = {};
      const nextMap: Record<string, { rate: number; discountedPrice: number; originalPrice: number }> =
        {};
      finalSlots.forEach((flight, idx) => {
        if (!flight) {
          return;
        }
        const rate = DISCOUNT_RATES[idx];
        if (!rate) {
          return;
        }
        const originalPrice = deriveLowestCabinPrice(flight);
        if (!originalPrice || originalPrice <= 0) {
          return;
        }
        const discountedPrice = Math.max(1, Math.round(originalPrice * rate));
        nextCache[flight.flightNumber] = { rank: idx };
        nextMap[flight.flightNumber] = {
          rate,
          discountedPrice,
          originalPrice,
        };
      });

      discountCacheRef.current = nextCache;
      setDiscountMap(nextMap);
    } catch {
      discountCacheRef.current = {};
      setDiscountMap({});
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuery((prev) => ({ ...prev, [name]: value || undefined }));
  };

  const handleCitySelect = (field: "from" | "to") => (city: string) => {
    const updatedQuery = { ...query, [field]: city || undefined };
    setQuery(updatedQuery);
    // 更新 URL 参数，触发自动查询
    const params = new URLSearchParams();
    if (updatedQuery.from) {
      params.append("from", updatedQuery.from);
    }
    if (updatedQuery.to) {
      params.append("to", updatedQuery.to);
    }
    if (updatedQuery.date) {
      params.append("date", updatedQuery.date);
    }
    const queryString = params.toString();
    router.replace(`/flights${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  const getComparablePrice = useCallback(
    (flight: Flight): number | null => deriveLowestCabinPrice(flight),
    []
  );

  const sortFlights = useCallback(
    (list: Flight[], order: PriceSort) => {
      const sorted = [...list];
      if (!order) {
        return sorted.sort(
          (a, b) => dayjs(a.departTime).valueOf() - dayjs(b.departTime).valueOf()
        );
      }
      return sorted.sort((a, b) => {
        const priceA = getComparablePrice(a);
        const priceB = getComparablePrice(b);
        if (priceA === null && priceB === null) {
          return dayjs(a.departTime).valueOf() - dayjs(b.departTime).valueOf();
        }
        if (priceA === null) {
          return 1;
        }
        if (priceB === null) {
          return -1;
        }
        if (priceA !== priceB) {
          return order === "asc" ? priceA - priceB : priceB - priceA;
        }
        return dayjs(a.departTime).valueOf() - dayjs(b.departTime).valueOf();
      });
    },
    [getComparablePrice]
  );

  const fetchFlights = useCallback(
    async (customQuery?: FlightQuery) => {
      const requestId = Date.now();
      latestRequestRef.current = requestId;
      setLoading(true);
      setAvailabilityWarning(null);
      setError(null);
      const criteria = customQuery || queryRef.current;
      try {
        let primaryData: Flight[] = [];
        if (onlyAvailable) {
          try {
            primaryData = await flightApi.listAvailable();
          } catch (availableError: any) {
            console.warn("listAvailable 接口调用失败，回退到通用航班接口", availableError);
            const warningText = isEnglish
              ? "Real-time availability API is unavailable. Showing general flight list instead."
              : "航班可售接口暂不可用，已为您展示通用航班列表。";
            if (latestRequestRef.current === requestId) {
              setAvailabilityWarning(warningText);
              toast({
                status: "warning",
                description: warningText,
                duration: 4000,
                isClosable: true,
              });
            }
            primaryData = await flightApi.search(criteria);
          }
        } else {
          primaryData = await flightApi.search(criteria);
        }

        const removeLegacyFlights = (list: Flight[]) =>
          list.filter((flight) => {
            const priceNumber = getComparablePrice(flight);
            const totalSeatsLeft = Number.isFinite(flight.seatsLeft)
              ? Number(flight.seatsLeft)
              : flight.seats?.reduce((sum, seat) => sum + (seat.remainingSeats ?? 0), 0) ?? 0;
            const hasValidPrice = priceNumber !== null && priceNumber > 0;
            const hasSeatInventory = Number.isFinite(totalSeatsLeft) && totalSeatsLeft > 0;
            return hasValidPrice || hasSeatInventory;
          });

        let filteredList = removeLegacyFlights(applyFuzzyFilters(primaryData, criteria));

        const hasCityKeyword =
          !!normalizeKeyword(criteria.from) || !!normalizeKeyword(criteria.to);

        if (hasCityKeyword && filteredList.length === 0) {
          const fallbackQuery: FlightQuery = {};
          if (criteria.date) {
            fallbackQuery.date = criteria.date;
          }
          const fallbackData = fallbackQuery.date
            ? await flightApi.search(fallbackQuery)
            : await flightApi.listAll();
          filteredList = removeLegacyFlights(applyFuzzyFilters(fallbackData, criteria));
        }

        if (onlyAvailable) {
          filteredList = filteredList.filter((flight) => flight.seatsLeft > 0);
        }

        const sortedList = sortFlights(filteredList, priceSort);

        if (latestRequestRef.current === requestId) {
          setFlights(sortedList);
          setError(null);
        }
      } catch (err: any) {
        if (latestRequestRef.current === requestId) {
          setError(err.message || "获取航班信息失败");
          setFlights([]);
        }
      } finally {
        if (latestRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [onlyAvailable, toast, isEnglish, priceSort, sortFlights, getComparablePrice]
  );

  const fetchFlightsRef = useRef(fetchFlights);
  useEffect(() => {
    fetchFlightsRef.current = fetchFlights;
  }, [fetchFlights]);

  const refreshAfterPurchase = useCallback(() => {
    fetchFlights();
    refreshDiscounts();
  }, [fetchFlights, refreshDiscounts]);

  useEffect(() => {
    const parsedParams = new URLSearchParams(paramsString);
    const nextQuery: FlightQuery = {
      from: parsedParams.get("from") || undefined,
      to: parsedParams.get("to") || undefined,
      date: parsedParams.get("date") || undefined,
    };
    setQuery((prev) => {
      if (
        prev.from === nextQuery.from &&
        prev.to === nextQuery.to &&
        prev.date === nextQuery.date
      ) {
        return prev;
      }
      return { ...prev, ...nextQuery };
    });
    fetchFlightsRef.current(nextQuery);
  }, [paramsString]);

  useEffect(() => {
    fetchFlights();
  }, [onlyAvailable, fetchFlights]);

  useEffect(() => {
    setFlights((prev) => sortFlights(prev, priceSort));
  }, [priceSort, sortFlights]);

  const handleTogglePriceSort = () => {
    setPriceSort((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  };

  const priceSortLabel = (() => {
    if (priceSort === "asc") {
      return isEnglish ? "Price ↑ (click for ↓)" : "价格升序 · 点击改降序";
    }
    if (priceSort === "desc") {
      return isEnglish ? "Price ↓ (click to reset)" : "价格降序 · 点击取消";
    }
    return isEnglish ? "Sort by price" : "按价格排序";
  })();

  // 加载原订单信息（改签模式）
  useEffect(() => {
    if (!changeBookingId) {
      setOriginalBooking(null);
      setChangePriceInfo(null);
      return;
    }
    const auth = getAuth();
    if (!auth?.id) {
      return;
    }
    const loadOriginalBooking = async () => {
      try {
        const bookings = await bookingApi.list({ userId: Number(auth.id) });
        const booking = bookings.find((b) => b.id === changeBookingId || b.orderNo === changeBookingId);
        if (booking) {
          setOriginalBooking(booking);
          // 初始化票数和舱位与原订单一致
          setTicketCount(booking.tickets || 1);
          setSelectedCabinClass(booking.cabinClass || "");
        } else {
          toast({
            title: isEnglish ? "Booking not found" : "订单不存在",
            description: isEnglish
              ? "The booking to change was not found."
              : "找不到要改签的订单",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          // 清除 changeBookingId 参数
          const params = new URLSearchParams(searchParams.toString());
          params.delete("changeBookingId");
          router.replace(`/flights?${params.toString()}`);
        }
      } catch (err: any) {
        toast({
          title: isEnglish ? "Failed to load booking" : "加载订单失败",
          description: err?.message || (isEnglish ? "Unable to load booking information." : "无法加载订单信息"),
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    loadOriginalBooking();
  }, [changeBookingId, searchParams, router, toast, isEnglish]);

  const handleBookFlight = (flight: Flight) => {
    if (!isAuthenticated()) {
      toast({
        title: isEnglish ? "Please sign in" : "请先登录",
        description: isEnglish
          ? "Sign in to book flights."
          : "登录后才能预订航班",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      router.push("/login");
      return;
    }
    const auth = getAuth();
    if (auth?.status === 0) {
      toast({
        title: isEnglish ? "Account disabled" : "账号已被禁用",
        description: isEnglish
          ? "This account cannot purchase tickets. Please contact admin."
          : "当前账号暂无法购买机票，请联系管理员",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setSelectedFlight(flight);
    setBookingMessage(null);
    setPassengerErrors({});
    setChangePriceInfo(null);
    
    // 改签模式：保持原订单的票数和舱位，否则使用默认值
    if (originalBooking) {
      setTicketCount(originalBooking.tickets || 1);
      setSelectedCabinClass(originalBooking.cabinClass || "");
      // 改签模式下不需要乘客信息（原订单已有）
    } else {
      setTicketCount(1);
      // 默认选择第一个有剩余座位的舱位
      if (flight.seats && flight.seats.length > 0) {
        const availableSeat = flight.seats.find(seat => seat.remainingSeats > 0);
        setSelectedCabinClass(availableSeat?.cabinClass || flight.seats[0].cabinClass);
      } else {
        setSelectedCabinClass("");
      }
      // 初始化乘客信息，默认填充当前用户信息
      const defaultPassenger: PassengerInfo = {
        name: auth?.name || auth?.fullName || "",
        idNumber: auth?.idNumber || "",
        phone: auth?.phone || "",
      };
      setPassengers([defaultPassenger]);
    }
    
    onOpen();
  };

  // 验证乘客信息
  const validatePassenger = (passenger: PassengerInfo, index: number): boolean => {
    const errors: { name?: string; idNumber?: string; phone?: string } = {};
    
    if (!passenger.name || passenger.name.trim() === "") {
      errors.name = isEnglish ? "Please enter full name" : "请输入真实姓名";
    }
    
    if (!passenger.idNumber || passenger.idNumber.trim() === "") {
      errors.idNumber = isEnglish ? "Please enter ID number" : "请输入身份证号";
    } else {
      const idPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$|^[1-9]\d{7}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}$/;
      if (!idPattern.test(passenger.idNumber)) {
        errors.idNumber = isEnglish ? "Invalid ID number" : "请输入有效的身份证号";
      }
    }
    
    if (!passenger.phone || passenger.phone.trim() === "") {
      errors.phone = isEnglish ? "Please enter phone number" : "请输入联系电话";
    } else {
      const phonePattern = /^1[3-9]\d{9}$/;
      if (!phonePattern.test(passenger.phone)) {
        errors.phone = isEnglish ? "Invalid phone number" : "请输入有效的手机号码";
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setPassengerErrors(prev => ({ ...prev, [index]: errors }));
      return false;
    }
    
    return true;
  };

  const applyFlightUpdate = (flight: Flight, cabinClass: string, tickets: number) => {
    const updatedFlight: Flight = {
      ...flight,
      seatsLeft: Math.max(0, (flight.seatsLeft ?? 0) - tickets),
      seats: flight.seats?.map((seat) =>
        seat.cabinClass === cabinClass
          ? {
              ...seat,
              remainingSeats: Math.max(seat.remainingSeats - tickets, 0),
            }
          : seat
      ),
    };
    setSelectedFlight(updatedFlight);
    setFlights((prev) => {
      const mapped = prev.map((item) =>
        item.flightNumber === updatedFlight.flightNumber ? updatedFlight : item
      );
      return onlyAvailable ? mapped.filter((item) => item.seatsLeft > 0) : mapped;
    });
  };

  const handleConfirmBooking = () => {
    if (!selectedFlight) return;
    if (ticketCount < 1) {
      setTicketCount(1);
      return;
    }
    if (!selectedCabinClass) {
      toast({
        title: isEnglish ? "Select cabin" : "请选择舱位",
        description: isEnglish
          ? "Please choose a cabin class first."
          : "请先选择舱位等级",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 检查所选舱位的剩余座位数
    const selectedSeat = selectedFlight.seats?.find(seat => seat.cabinClass === selectedCabinClass);
    if (!selectedSeat) {
      toast({
        title: isEnglish ? "Cabin not found" : "舱位不存在",
        description: isEnglish
          ? "Selected cabin does not exist."
          : "所选舱位不存在",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (ticketCount > selectedSeat.remainingSeats) {
      toast({
        title: isEnglish ? "Not enough seats" : "余票不足",
        description: isEnglish
          ? `Only ${selectedSeat.remainingSeats} seat(s) left in this cabin.`
          : `该舱位剩余座位不足，仅剩 ${selectedSeat.remainingSeats} 张`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 改签模式：不需要验证乘客信息（原订单已有）
    if (!originalBooking) {
      // 验证乘客信息数量与票数一致
      if (passengers.length !== ticketCount) {
        toast({
          title: isEnglish ? "Passenger info incomplete" : "乘客信息不完整",
          description: isEnglish
            ? `Please fill in information for ${ticketCount} passenger(s).`
            : `请填写 ${ticketCount} 位乘客的信息`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // 验证所有乘客信息
      setPassengerErrors({});
      let hasError = false;
      passengers.forEach((passenger, index) => {
        if (!validatePassenger(passenger, index)) {
          hasError = true;
        }
      });

      if (hasError) {
        toast({
          title: isEnglish ? "Please complete passenger info" : "请完善乘客信息",
          description: isEnglish
            ? "Check and complete all passenger fields."
            : "请检查并完善所有乘客的信息",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const auth = getAuth();
    if (!auth?.id) {
      toast({
        title: isEnglish ? "User info missing" : "用户信息异常",
        description: isEnglish
          ? "Unable to read user info. Please sign in again."
          : "无法获取用户信息，请重新登录后再试",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (auth?.status === 0) {
      toast({
        title: isEnglish ? "Account disabled" : "账号已被禁用",
        description: isEnglish
          ? "This account cannot purchase tickets. Please contact admin."
          : "当前账号暂无法购买机票，请联系管理员",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // 改签模式：计算改签价格
    if (originalBooking && changeBookingId) {
      setCalculatingChangePrice(true);
      setBookingMessage(null);
      bookingApi
        .calculateChangePrice(Number(changeBookingId), Number(auth.id), {
          newFlightId: selectedFlight.flightId,
          newCabinClass: selectedCabinClass,
          newTicketCount: ticketCount,
        })
        .then((priceInfo) => {
          setChangePriceInfo(priceInfo);
          const walletBalance = Number(auth.walletBalance ?? 0);
          const priceDifference = priceInfo.priceDifference || 0;
          
          // 如果差价为正（需要补缴），检查余额是否足够
          if (priceDifference > 0 && (!Number.isFinite(walletBalance) || walletBalance < priceDifference)) {
            const currentBalanceText = Number.isFinite(walletBalance)
              ? `¥${walletBalance.toLocaleString()}`
              : "未知";
            setBookingMessage(
              isEnglish
                ? "Insufficient wallet balance. Please top up in Profile > Wallet and try again."
                : "钱包余额不足，请前往个人中心 - 钱包完成充值后再试"
            );
            toast({
              title: isEnglish ? "Insufficient wallet balance" : "钱包余额不足",
              description: isEnglish
                ? `Need to pay ¥${priceDifference.toLocaleString()}, balance ${currentBalanceText}. Please top up.`
                : `改签需补缴 ¥${priceDifference.toLocaleString()}，当前余额 ${currentBalanceText}，请先充值`,
              status: "warning",
              duration: 4000,
              isClosable: true,
            });
            return;
          }

          // 设置改签支付信息
          setPendingPayment({
            payload: {
              flightId: selectedFlight.flightId,
              userId: Number(auth.id),
              cabinClass: selectedCabinClass,
              ticketCount,
            },
            totalAmount: priceDifference > 0 ? priceDifference : 0, // 只有需要补缴时才显示金额
            walletBalance,
            flightNumber: selectedFlight.flightNumber,
            cabinLabel: CABIN_CLASS_LABELS[language][selectedCabinClass] || selectedCabinClass,
            ticketCount,
            discountRate: undefined,
            urgentSurchargeRate: 0,
            expiresAt: Date.now() + PAYMENT_COUNTDOWN_MS,
          });
        })
        .catch((err: any) => {
          const errorMsg = err?.response?.data?.message || err?.message;
          setBookingMessage(
            errorMsg || (isEnglish ? "Failed to calculate change price" : "计算改签价格失败")
          );
          toast({
            title: isEnglish ? "Calculation failed" : "计算失败",
            description: errorMsg || (isEnglish ? "Unable to calculate change price. Please try again." : "无法计算改签价格，请重试"),
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        })
        .finally(() => {
          setCalculatingChangePrice(false);
        });
      return;
    }

    // 正常预订模式：如果该航班在折扣列表中，使用折扣后的舱位价格计算总金额，并在临近起飞时加价
    const discountInfo = discountMap[selectedFlight.flightNumber];
    const isUrgentFlight = isFlightInUrgentWindow(selectedFlight.departTime);
    const seatUnitPrice = calculateSeatUnitPrice(
      selectedSeat.price,
      discountInfo?.rate,
      isUrgentFlight
    );
    const totalAmount = Number((seatUnitPrice * ticketCount).toFixed(2));
    const walletBalance = Number(auth.walletBalance ?? 0);
    if (!Number.isFinite(walletBalance) || walletBalance < totalAmount) {
      const currentBalanceText = Number.isFinite(walletBalance)
        ? `¥${walletBalance.toLocaleString()}`
        : "未知";
      setBookingMessage(
        isEnglish
          ? "Insufficient wallet balance. Please top up in Profile > Wallet and try again."
          : "钱包余额不足，请前往个人中心 - 钱包完成充值后再试"
      );
      toast({
        title: isEnglish ? "Insufficient wallet balance" : "钱包余额不足",
        description: isEnglish
          ? `Need ¥${totalAmount.toLocaleString()}, balance ${currentBalanceText}. Please top up or reduce tickets.`
          : `本次订单需 ¥${totalAmount.toLocaleString()}，当前余额 ${currentBalanceText}，请先充值或减少购票数量`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setBookingMessage(null);
    const seatColumnsPayload = selectedSeatColumns.filter((col) => !!col);
    const payload: BookingRequest = {
      flightId: selectedFlight.flightId,
      userId: Number(auth.id),
      cabinClass: selectedCabinClass,
      ticketCount,
      selectedSeatColumns:
        seatColumnsPayload.length > 0 ? seatColumnsPayload : undefined,
      passengers: passengers.map((passenger) => ({
        name: passenger.name.trim(),
        idNumber: passenger.idNumber.trim(),
        phone: passenger.phone.trim(),
      })),
    };
    setPendingPayment({
      payload,
      totalAmount,
      walletBalance,
      flightNumber: selectedFlight.flightNumber,
      cabinLabel: CABIN_CLASS_LABELS[language][selectedCabinClass] || selectedCabinClass,
      ticketCount,
      discountRate: discountInfo?.rate,
      urgentSurchargeRate: isUrgentFlight ? URGENT_SURCHARGE_RATE : 0,
      expiresAt: Date.now() + PAYMENT_COUNTDOWN_MS,
    });
  };

  const handleExecutePayment = async () => {
    if (!pendingPayment || !selectedFlight) {
      return;
    }
    setBookingLoading(true);
    setBookingMessage(null);
    const { payload, totalAmount } = pendingPayment;
    const auth = getAuth();
    
    try {
      // 改签模式：调用改签API
      if (originalBooking && changeBookingId && auth?.id) {
        const changeRequest: ChangeBookingRequest = {
          newFlightId: payload.flightId,
          newCabinClass: payload.cabinClass,
          newTicketCount: payload.ticketCount,
        };
        const response = await bookingApi.changeBooking(
          Number(changeBookingId),
          Number(auth.id),
          changeRequest
        );
        
        if (
          response.success ||
          response.code === 200 ||
          response.code === 0 ||
          !response.code
        ) {
          applyFlightUpdate(selectedFlight, payload.cabinClass, payload.ticketCount);
          const currentAuth = getAuth();
          if (currentAuth && changePriceInfo) {
            // 更新钱包余额（可能补缴或退款）
            const baseBalance = Number(
              currentAuth.walletBalance ?? pendingPayment.walletBalance ?? 0
            );
            const priceDiff = changePriceInfo.priceDifference || 0;
            const nextBalance = Number(Math.max(0, baseBalance - priceDiff).toFixed(2));
            saveAuth({ ...currentAuth, walletBalance: nextBalance });
          }
          toast({
            title: isEnglish ? "Change successful" : "改签成功",
            description: isEnglish
              ? changePriceInfo && changePriceInfo.priceDifference > 0
                ? `¥${changePriceInfo.priceDifference.toLocaleString()} deducted from wallet. View in "My Bookings".`
                : changePriceInfo && changePriceInfo.priceDifference < 0
                ? `¥${Math.abs(changePriceInfo.priceDifference).toLocaleString()} refunded to wallet. View in "My Bookings".`
                : `Flight changed successfully. View in "My Bookings".`
              : changePriceInfo && changePriceInfo.priceDifference > 0
              ? `已从钱包扣除 ¥${changePriceInfo.priceDifference.toLocaleString()}，可在"我的订票单"中查看`
              : changePriceInfo && changePriceInfo.priceDifference < 0
              ? `已退款 ¥${Math.abs(changePriceInfo.priceDifference).toLocaleString()}至钱包，可在"我的订票单"中查看`
              : `改签成功，可在"我的订票单"中查看`,
            status: "success",
            duration: 4000,
            isClosable: true,
          });
          setPendingPayment(null);
          setChangePriceInfo(null);
          closeBookingModal();
          refreshAfterPurchase();
          
          // 添加日志查看改签响应
          console.log("[改签] 改签成功，响应数据:", response);
          console.log("[改签] 返回的新订单:", response.data);
          
          // 跳转到订单页面并强制刷新
          router.push("/bookings");
          // 延迟刷新确保页面已加载
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          setBookingMessage(
            response.message ||
              (isEnglish ? "Change failed, please retry." : "改签失败，请稍后重试")
          );
        }
      } else {
        // 正常预订模式：调用创建订单API
        const response = await bookingApi.create({ ...payload, payLater: false });
        if (
          response.success ||
          response.code === 200 ||
          response.code === 0 ||
          !response.code
        ) {
          applyFlightUpdate(selectedFlight, payload.cabinClass, payload.ticketCount);
          const currentAuth = getAuth();
          const baseAuth = currentAuth || getAuth();
          if (baseAuth) {
            const baseBalance = Number(
              baseAuth.walletBalance ?? pendingPayment.walletBalance ?? 0
            );
            const nextBalance = Number(Math.max(0, baseBalance - totalAmount).toFixed(2));
            saveAuth({ ...baseAuth, walletBalance: nextBalance });
          }
          toast({
            title: isEnglish ? "Payment successful" : "支付成功",
            description: isEnglish
              ? `¥${totalAmount.toLocaleString()} deducted from wallet. View in "My Bookings".`
              : `已从钱包扣除 ¥${totalAmount.toLocaleString()}，可在"我的订票单"中查看`,
            status: "success",
            duration: 4000,
            isClosable: true,
          });
          setPendingPayment(null);
          closeBookingModal();
          refreshAfterPurchase();
        } else {
          setBookingMessage(
            response.message ||
              (isEnglish ? "Booking failed, please retry." : "下单失败，请稍后重试")
          );
        }
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      setBookingMessage(
        serverMsg ||
          err.message ||
          (originalBooking && changeBookingId
            ? isEnglish
              ? "Change failed, please retry."
              : "改签失败，请稍后重试"
            : isEnglish
            ? "Booking failed, please retry."
            : "下单失败，请稍后重试")
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleHoldBooking = async () => {
    if (!pendingPayment || !selectedFlight) {
      return;
    }
    // 改签模式下不能暂存订单
    if (originalBooking && changeBookingId) {
      toast({
        title: isEnglish ? "Cannot hold" : "无法暂存",
        description: isEnglish
          ? "Flight changes must be paid immediately."
          : "改签订单需要立即支付，无法暂存",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setBookingLoading(true);
    setBookingMessage(null);
    try {
      const response = await bookingApi.create({
        ...pendingPayment.payload,
        payLater: true,
      });
      if (
        response.success ||
        response.code === 200 ||
        response.code === 0 ||
        !response.code
      ) {
        applyFlightUpdate(
          selectedFlight,
          pendingPayment.payload.cabinClass,
          pendingPayment.payload.ticketCount
        );
        toast({
          title: isEnglish ? "Seat reserved" : "已保留座位",
          description: isEnglish
            ? 'Order held for 15 minutes. Complete payment in "My Bookings".'
            : '系统已为您保留订单 15 分钟，请在"我的订票单"内完成支付。',
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        setPendingPayment(null);
        closeBookingModal();
      } else {
        setBookingMessage(
          response.message ||
            (isEnglish ? "Unable to hold seats now, please retry." : "暂无法保留，请稍后再试")
        );
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      setBookingMessage(
        serverMsg ||
          err.message ||
          (isEnglish ? "Unable to hold seats now, please retry." : "暂无法保留，请稍后再试")
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePaymentExpire = () => {
    setPendingPayment(null);
    toast({
      title: isEnglish ? "Payment timeout" : "支付超时",
      description: isEnglish
        ? "Payment timed out. Please submit the order again."
        : "当前支付已超时，请重新提交订单。",
      status: "warning",
      duration: 4000,
      isClosable: true,
    });
  };

  useEffect(() => {
    refreshDiscounts();
  }, [refreshDiscounts]);

  const closeBookingModal = () => {
    setSelectedFlight(null);
    setTicketCount(1);
    setSelectedCabinClass("");
    setBookingMessage(null);
    setPassengers([]);
    setSelectedSeatColumns([]);
    setPassengerErrors({});
    setPendingPayment(null);
    setBookingLoading(false);
    onClose();
  };

  // 当票数改变时，自动调整乘客信息列表
  useEffect(() => {
    if (isOpen && selectedFlight) {
      const auth = getAuth();
      const defaultPassenger: PassengerInfo = {
        name: auth?.name || auth?.fullName || "",
        idNumber: auth?.idNumber || "",
        phone: auth?.phone || "",
      };
      
      if (ticketCount > passengers.length) {
        // 增加乘客信息
        const newPassengers = [...passengers];
        while (newPassengers.length < ticketCount) {
          if (newPassengers.length === 0) {
            // 如果当前没有乘客信息，添加默认的本人信息
            newPassengers.push({ ...defaultPassenger });
          } else {
            // 新增的乘客信息默认置空，等待用户填写
            newPassengers.push({ name: "", idNumber: "", phone: "" });
          }
        }
        setPassengers(newPassengers);
      } else if (ticketCount < passengers.length) {
        // 减少乘客信息
        setPassengers(passengers.slice(0, ticketCount));
        // 清除被删除乘客的错误信息
        const newErrors = { ...passengerErrors };
        for (let i = ticketCount; i < passengers.length; i++) {
          delete newErrors[i];
        }
        setPassengerErrors(newErrors);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketCount, isOpen]);

  return (
    <VStack spacing={8} align="stretch">
      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        boxShadow="md"
        borderWidth="1px"
        borderColor="gray.100"
      >
        <Heading size="lg" mb={2}>
          {isEnglish ? "Flight Search" : "航班信息查询"}
        </Heading>
        <Text color="gray.500" mb={6}>
          {isEnglish
            ? "Enter departure, destination and date to find matching flights."
            : "输入出发地、目的地与日期，快速查找符合条件的航班"}
        </Text>
        <Alert status="info" variant="subtle" borderRadius="md" mb={6}>
          <AlertIcon />
          <Box>
            <Text>
              {isEnglish
                ? "New policy: tickets depart within 12h cost 10% more, and refunds within 12h incur a 1% fee."
                : "规则提醒：距离起飞 12 小时内购票将自动上浮 10%，同时间段退票需收取 1% 手续费。"}
            </Text>
          </Box>
        </Alert>

          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={4}>
            <GridItem>
              <FormControl>
                <FormLabel>{isEnglish ? "Departure" : "出发地"}</FormLabel>
                <CityPicker
                  value={query.from}
                  placeholder={isEnglish ? "Select departure city" : "选择出发城市"}
                  icon={<Text color="gray.300">📍</Text>}
                  onChange={handleCitySelect("from")}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel>{isEnglish ? "Destination" : "目的地"}</FormLabel>
                <CityPicker
                  value={query.to}
                  placeholder={isEnglish ? "Select arrival city" : "选择到达城市"}
                  icon={<Text color="gray.300">📍</Text>}
                  onChange={handleCitySelect("to")}
                />
              </FormControl>
            </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>{isEnglish ? "Departure date" : "出发日期"}</FormLabel>
              <InputGroup>
                <Input
                  name="date"
                  type="date"
                  value={query.date || ""}
                  onChange={handleSearchChange}
                  placeholder={isEnglish ? "Select date" : "请选择日期"}
                />
                {query.date && (
                  <InputRightElement width="2.5rem">
                    <IconButton
                      aria-label={isEnglish ? "Clear date" : "清除日期"}
                      size="sm"
                      variant="ghost"
                      icon={<SmallCloseIcon />}
                      onClick={() =>
                        setQuery((prev) => ({
                          ...prev,
                          date: undefined,
                        }))
                      }
                    />
                  </InputRightElement>
                )}
              </InputGroup>
            </FormControl>
          </GridItem>
        </Grid>
        <Flex justify="space-between" align="center">
          <Button
            variant={onlyAvailable ? "solid" : "outline"}
            colorScheme={onlyAvailable ? "green" : "gray"}
            size="sm"
            onClick={() => {
              setOnlyAvailable(!onlyAvailable);
            }}
          >
            {onlyAvailable
              ? isEnglish
                ? "✓ Only available"
                : "✓ 只看有票"
              : isEnglish
                ? "Only available"
                : "只看有票"}
          </Button>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery({});
                setOnlyAvailable(false);
                router.replace("/flights", { scroll: false });
                fetchFlights({});
              }}
            >
              {isEnglish ? "Reset" : "重置"}
            </Button>
            <Button colorScheme="blue" onClick={() => fetchFlights()}>
              {isEnglish ? "Search flights" : "查询航班"}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box>
        <Flex mb={4} align="center" justify="space-between" flexWrap="wrap" gap={3}>
          <Heading size="md">
            {isEnglish ? "Results" : "查询结果"}
          </Heading>
          <Button
            size="sm"
            variant={priceSort ? "solid" : "outline"}
            colorScheme="purple"
            onClick={handleTogglePriceSort}
          >
            {priceSortLabel}
          </Button>
        </Flex>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>
                {isEnglish ? "Failed to fetch flights" : "获取航班信息失败"}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {availabilityWarning && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>
                {isEnglish ? "Availability API unavailable" : "航班接口暂不可用"}
              </AlertTitle>
              <AlertDescription>{availabilityWarning}</AlertDescription>
            </Box>
          </Alert>
        )}

        {loading ? (
          <VStack spacing={4} align="stretch">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} height="160px" borderRadius="lg" />
            ))}
          </VStack>
        ) : flights.length === 0 ? (
          <Box
            p={10}
            textAlign="center"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.100"
            bg="white"
          >
            <Text fontSize="lg" fontWeight="medium">
              {isEnglish ? "No matching flights" : "暂无符合条件的航班"}
            </Text>
            <Text color="gray.500" mt={2}>
              {isEnglish
                ? "Try adjusting filters or choose another date."
                : "可尝试修改查询条件或换一天再试"}
            </Text>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {flights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onBook={handleBookFlight}
                discount={discountMap[flight.flightNumber]}
                language={language}
              />
            ))}
          </VStack>
        )}
      </Box>

      {selectedFlight && (
        <BookingModal
          isOpen={isOpen}
          onClose={closeBookingModal}
          flight={selectedFlight}
          ticketCount={ticketCount}
          setTicketCount={setTicketCount}
          selectedCabinClass={selectedCabinClass}
          setSelectedCabinClass={setSelectedCabinClass}
          bookingLoading={bookingLoading || calculatingChangePrice}
          bookingMessage={bookingMessage}
          onConfirm={handleConfirmBooking}
          passengers={passengers}
          setPassengers={setPassengers}
          passengerErrors={passengerErrors}
          setPassengerErrors={setPassengerErrors}
          selectedSeatColumns={selectedSeatColumns}
          setSelectedSeatColumns={setSelectedSeatColumns}
          discount={discountMap[selectedFlight.flightNumber]}
          language={language}
          originalBooking={originalBooking}
          changePriceInfo={changePriceInfo}
        />
      )}
      <PaymentConfirmModal
        isOpen={!!pendingPayment}
        info={pendingPayment}
        flight={selectedFlight}
        onCancel={() => setPendingPayment(null)}
        onConfirm={handleExecutePayment}
        onHold={handleHoldBooking}
        onExpire={handlePaymentExpire}
        isLoading={bookingLoading}
        language={language}
      />
    </VStack>
  );
}

interface PassengerInfo {
  name: string;
  idNumber: string;
  phone: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  ticketCount: number;
  setTicketCount: (count: number) => void;
  selectedCabinClass: string;
  setSelectedCabinClass: (cabinClass: string) => void;
  bookingLoading: boolean;
  bookingMessage: string | null;
  onConfirm: () => void;
  passengers: PassengerInfo[];
  setPassengers: React.Dispatch<React.SetStateAction<PassengerInfo[]>>;
  passengerErrors: Record<number, { name?: string; idNumber?: string; phone?: string }>;
  setPassengerErrors: React.Dispatch<React.SetStateAction<Record<number, { name?: string; idNumber?: string; phone?: string }>>>;
  discount?: { rate: number; discountedPrice: number; originalPrice: number };
  language: Language;
  originalBooking?: BookingItem | null;
  changePriceInfo?: { newAmount: number; refundAmount: number; changeFee: number; priceDifference: number } | null;
  selectedSeatColumns: string[];
  setSelectedSeatColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

function BookingModal({
  isOpen,
  onClose,
  flight,
  ticketCount,
  setTicketCount,
  selectedCabinClass,
  setSelectedCabinClass,
  bookingLoading,
  bookingMessage,
  onConfirm,
  passengers,
  setPassengers,
  passengerErrors,
  setPassengerErrors,
  discount,
  language,
  originalBooking,
  changePriceInfo,
  selectedSeatColumns,
  setSelectedSeatColumns,
}: BookingModalProps) {
  if (!flight) return null;
  const depart = dayjs(flight.departTime);
  const arrive = dayjs(flight.arriveTime);
  const auth = getAuth();
  const fromCity = translateCity(flight.from, language) || flight.from;
  const toCity = translateCity(flight.to, language) || flight.to;
  const isEnglish = language === "en-US";
  const isUrgentFlight = isFlightInUrgentWindow(flight.departTime);
  const toast = useToast();

  const cabinClassMap = CABIN_CLASS_LABELS[language] || CABIN_CLASS_LABELS["zh-CN"];
  
  const selectedSeat = flight.seats?.find((seat) => seat.cabinClass === selectedCabinClass);
  const seatPrice = selectedSeat
    ? calculateSeatUnitPrice(selectedSeat.price, discount?.rate, isUrgentFlight)
    : 0;
  const totalAmount = selectedSeat ? Number((seatPrice * ticketCount).toFixed(2)) : 0;
  const maxTickets = selectedSeat ? Math.max(1, Math.min(selectedSeat.remainingSeats, 9)) : 1;

  // 座位选择相关状态
  const [availableSeatInfo, setAvailableSeatInfo] =
    useState<SeatSelectionResponse | null>(null);
  const [loadingSeatInfo, setLoadingSeatInfo] = useState(false);

  const getColumnCapacity = (column: string, info?: SeatSelectionResponse | null) =>
    getColumnCapacityFromInfo(column, info ?? availableSeatInfo);

  // 当选择舱位时，获取可用座位列
  useEffect(() => {
    if (selectedCabinClass && flight?.flightId) {
      let cancelled = false;
      setLoadingSeatInfo(true);
      seatApi
        .getAvailableSeatColumns(Number(flight.flightId), selectedCabinClass)
        .then((info) => {
          if (cancelled) {
            return;
          }
          setAvailableSeatInfo(info);
          setSelectedSeatColumns((prev) => {
            const next = [...prev];
            if (next.length > ticketCount) {
              next.length = ticketCount;
            } else {
              while (next.length < ticketCount) {
                next.push("");
              }
            }
            return sanitizeSeatSelectionsWithInfo(next, info);
          });
        })
        .catch((err) => {
          if (cancelled) {
            return;
          }
          console.error("获取可用座位失败:", err);
          setAvailableSeatInfo(null);
          setSelectedSeatColumns([]);
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingSeatInfo(false);
          }
        });
      return () => {
        cancelled = true;
      };
    } else {
      setAvailableSeatInfo(null);
      setSelectedSeatColumns([]);
    }
  }, [
    selectedCabinClass,
    flight?.flightId,
    setSelectedSeatColumns,
    ticketCount,
  ]);

  // 当票数改变时，调整座位选择
  useEffect(() => {
    setSelectedSeatColumns((prev) => {
      const next = [...prev];
      if (next.length > ticketCount) {
        next.length = ticketCount;
      } else {
        while (next.length < ticketCount) {
          next.push("");
        }
      }
      return sanitizeSeatSelectionsWithInfo(next, availableSeatInfo);
    });
  }, [ticketCount, availableSeatInfo, setSelectedSeatColumns]);

  const walletBalanceRaw =
    auth && auth.walletBalance !== undefined && auth.walletBalance !== null
      ? Number(auth.walletBalance)
      : undefined;
  const walletBalance =
    walletBalanceRaw === undefined || Number.isNaN(walletBalanceRaw)
      ? undefined
      : walletBalanceRaw;
  const hasValidWalletBalance = walletBalance !== undefined;
  const walletEnough = walletBalance === undefined ? true : walletBalance >= totalAmount;
  const walletShortage =
    walletBalance === undefined ? 0 : Math.max(0, totalAmount - walletBalance);

  const seatSelectionRequired =
    !!(availableSeatInfo?.availableColumns && availableSeatInfo.availableColumns.length > 0);
  const completedSeatSelections = selectedSeatColumns.filter((col) => !!col).length;
  const remainingSeatSelections = Math.max(0, ticketCount - completedSeatSelections);

  const getPassengerLabel = (index: number) => {
    const passengerName = passengers[index]?.name?.trim();
    if (passengerName) {
      return passengerName;
    }
    if (index === 0) {
      return isEnglish ? "Primary passenger" : "本人";
    }
    return isEnglish ? `Passenger ${index + 1}` : `乘客 ${index + 1}`;
  };

  const getRemainingForColumn = (column: string, passengerIndex: number) => {
    const capacity = getColumnCapacity(column);
    if (capacity === UNLIMITED_COLUMN_CAPACITY) {
      return UNLIMITED_COLUMN_CAPACITY;
    }
    const usedByOthers = selectedSeatColumns.reduce((count, value, idx) => {
      if (idx !== passengerIndex && value === column) {
        return count + 1;
      }
      return count;
    }, 0);
    return capacity - usedByOthers;
  };

  const handleSeatColumnChange = (index: number, value: string) => {
    setSelectedSeatColumns((prev) => {
      const next = [...prev];
      if (!value) {
        next[index] = "";
        return next;
      }
      const capacity = getColumnCapacity(value);
      const usedByOthers = prev.reduce((count, column, idx) => {
        if (idx !== index && column === value) {
          return count + 1;
        }
        return count;
      }, 0);
      const remaining =
        capacity === UNLIMITED_COLUMN_CAPACITY
          ? UNLIMITED_COLUMN_CAPACITY
          : capacity - usedByOthers;
      if (remaining <= 0) {
        toast({
          status: "warning",
          description: isEnglish
            ? `Column ${value} has no seats left. Please choose another column.`
            : `列 ${value} 已无可用座位，请选择其它列`,
          duration: 3000,
          isClosable: true,
        });
        return prev;
      }
      next[index] = value;
      return next;
    });
  };

  const handleSubmitOrder = () => {
    if (seatSelectionRequired && remainingSeatSelections > 0) {
      const pendingIndex = selectedSeatColumns.findIndex((col) => !col);
      const label =
        pendingIndex >= 0 ? getPassengerLabel(pendingIndex) : undefined;
      toast({
        status: "warning",
        description: label
          ? isEnglish
            ? `Please select a seat column for ${label}.`
            : `请为 ${label} 选择座位列`
          : isEnglish
          ? "Please complete seat selection for all passengers."
          : "请为所有乘客选择座位列。",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {originalBooking
            ? isEnglish
              ? `Change flight ${flight.flightNumber}`
              : `改签航班 ${flight.flightNumber}`
            : isEnglish
            ? `Book flight ${flight.flightNumber}`
            : `预订航班 ${flight.flightNumber}`}
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {originalBooking && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" mb={1}>
                    {isEnglish ? "Changing flight" : "正在改签"}
                  </Text>
                  <Text fontSize="sm">
                    {isEnglish
                      ? `Original: ${originalBooking.flightNumber} - ${originalBooking.from} to ${originalBooking.to}`
                      : `原航班：${originalBooking.flightNumber} - ${originalBooking.from} 至 ${originalBooking.to}`}
                  </Text>
                </Box>
              </Alert>
            )}

            <Box>
              <Text color="gray.500" fontSize="sm">
                {depart.format(isEnglish ? "MMM DD HH:mm" : "MM月DD日 HH:mm")}{" "}
                {isEnglish ? "Departure" : "出发"} · {fromCity}
              </Text>
              <Text color="gray.500" fontSize="sm">
                {arrive.format(isEnglish ? "MMM DD HH:mm" : "MM月DD日 HH:mm")}{" "}
                {isEnglish ? "Arrival" : "抵达"} · {toCity}
              </Text>
            </Box>

            {auth?.username && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                {isEnglish ? "Signed-in user" : "已登录旅客"}：{auth.username}
              </Alert>
            )}
            {isUrgentFlight && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                {isEnglish
                  ? "Less than 12h before departure. Price includes a 10% surcharge and refunds incur a 1% fee."
                  : "距离起飞不足 12 小时，票价自动上浮 10%，退票需收取 1% 手续费。"}
              </Alert>
            )}

            {changePriceInfo && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" mb={1}>
                    {isEnglish ? "Change price summary" : "改签价格明细"}
                  </Text>
                  <VStack align="stretch" spacing={1} fontSize="sm">
                    <HStack justify="space-between">
                      <Text>{isEnglish ? "New flight amount" : "新航班金额"}:</Text>
                      <Text fontWeight="bold">¥{changePriceInfo.newAmount.toLocaleString()}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>{isEnglish ? "Refund amount" : "原订单退款"}:</Text>
                      <Text>¥{changePriceInfo.refundAmount.toLocaleString()}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>{isEnglish ? "Change fee (5%)" : "改签手续费 (5%)"}:</Text>
                      <Text>¥{changePriceInfo.changeFee.toLocaleString()}</Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between" fontWeight="bold">
                      <Text>
                        {changePriceInfo.priceDifference > 0
                          ? isEnglish
                            ? "Amount to pay"
                            : "需补缴金额"
                          : changePriceInfo.priceDifference < 0
                          ? isEnglish
                            ? "Refund amount"
                            : "退款金额"
                          : isEnglish
                          ? "No price difference"
                          : "无差价"}
                      </Text>
                      <Text color={changePriceInfo.priceDifference > 0 ? "red.500" : changePriceInfo.priceDifference < 0 ? "green.500" : "gray.500"}>
                        {changePriceInfo.priceDifference !== 0
                          ? `¥${Math.abs(changePriceInfo.priceDifference).toLocaleString()}`
                          : "¥0"}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </Alert>
            )}

            <FormControl>
              <FormLabel>{isEnglish ? "Select cabin" : "选择舱位"}</FormLabel>
              <VStack align="stretch" spacing={2} mt={2}>
                {flight.seats && flight.seats.length > 0 ? (
                  // 按照固定顺序显示：经济舱、商务舱、头等舱
                  (() => {
                    const cabinOrder = ["ECONOMY", "BUSINESS", "FIRST"];
                    const sortedSeats = [...flight.seats].sort((a, b) => {
                      const indexA = cabinOrder.indexOf(a.cabinClass);
                      const indexB = cabinOrder.indexOf(b.cabinClass);
                      // 如果不在列表中，排在后面
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    });
                    
                    return sortedSeats.map((seat) => (
                      <Box
                        key={seat.cabinClass}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor={selectedCabinClass === seat.cabinClass ? "blue.500" : "gray.200"}
                        bg={selectedCabinClass === seat.cabinClass ? "blue.50" : "white"}
                        cursor="pointer"
                        onClick={() => {
                          if (seat.remainingSeats > 0) {
                            setSelectedCabinClass(seat.cabinClass);
                            // 如果当前票数超过新选择的舱位剩余座位数，自动调整
                            if (ticketCount > seat.remainingSeats) {
                              setTicketCount(seat.remainingSeats);
                            }
                          }
                        }}
                        opacity={seat.remainingSeats === 0 ? 0.5 : 1}
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontWeight="semibold">
                              {cabinClassMap[seat.cabinClass] || seat.cabinClass}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {isEnglish
                                ? `Left ${seat.remainingSeats} / Total ${seat.totalSeats}`
                                : `剩余 ${seat.remainingSeats} 张 / 总 ${seat.totalSeats} 张`}
                            </Text>
                          </Box>
                          <Box textAlign="right">
                            <Text fontWeight="bold" color={discount ? "red.500" : "blue.600"}>
                              ¥
                              {calculateSeatUnitPrice(
                                seat.price,
                                discount?.rate,
                                isUrgentFlight
                              ).toLocaleString()}
                            </Text>
                            {(discount || isUrgentFlight) && (
                              <VStack spacing={0} align="flex-end">
                                {discount && (
                                  <Text fontSize="xs" color="gray.500" textDecor="line-through">
                                    {isEnglish ? "Original" : "原价"} ¥{seat.price.toLocaleString()}
                                  </Text>
                                )}
                                {isUrgentFlight && (
                                  <Text fontSize="xs" color="red.500">
                                    {isEnglish ? "Includes +10% urgent surcharge" : "含临近起飞加价 10%"}
                                  </Text>
                                )}
                              </VStack>
                            )}
                            {seat.remainingSeats === 0 && (
                              <Text fontSize="xs" color="red.500">
                                {isEnglish ? "Sold out" : "已售罄"}
                              </Text>
                            )}
                          </Box>
                        </Flex>
                      </Box>
                    ));
                  })()
                ) : (
                  <Text color="gray.500" fontSize="sm">
                    {isEnglish ? "Cabin information unavailable" : "暂无舱位信息"}
                  </Text>
                )}
              </VStack>
            </FormControl>

            <FormControl>
              <FormLabel>
                {isEnglish ? "Tickets" : "订购票数"}
                {selectedSeat &&
                  (isEnglish
                    ? ` (Left ${selectedSeat.remainingSeats})`
                    : `（剩余 ${selectedSeat.remainingSeats} 张）`)}
              </FormLabel>
              <NumberInput
                value={ticketCount}
                min={1}
                max={maxTickets}
                clampValueOnBlur
                isDisabled={!selectedCabinClass || !selectedSeat || selectedSeat.remainingSeats === 0}
                onChange={(_, value) =>
                  setTicketCount(value && value > 0 ? value : 1)
                }
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {isEnglish
                  ? "Ticket count must be less than remaining seats."
                  : "订票数量需小于剩余余票数"}
              </Text>
            </FormControl>

            {/* 座位选择 */}
            {selectedCabinClass && ticketCount > 0 && (
              <FormControl>
                <FormLabel>
                  {isEnglish ? "Select seat columns" : "选择座位列"}
                  {seatSelectionRequired &&
                    (isEnglish
                      ? " (assign seats for each passenger)"
                      : "（为每位乘客单独选择）")}
                </FormLabel>
                {loadingSeatInfo ? (
                  <Box p={4} textAlign="center">
                    <Text color="gray.500" fontSize="sm">
                      {isEnglish ? "Loading available seats..." : "正在加载可用座位..."}
                    </Text>
                  </Box>
                ) : seatSelectionRequired ? (
                  <VStack align="stretch" spacing={3} mt={2}>
                    {Array.from({ length: ticketCount }).map((_, passengerIndex) => {
                      const label = getPassengerLabel(passengerIndex);
                      const currentValue = selectedSeatColumns[passengerIndex] || "";
                      return (
                        <Box
                          key={passengerIndex}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor={currentValue ? "blue.200" : "gray.200"}
                          bg="white"
                        >
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="semibold" fontSize="sm">
                              {label}
                            </Text>
                            {currentValue && (
                              <Badge colorScheme="blue" fontSize="xs">
                                {isEnglish ? `Column ${currentValue}` : `列 ${currentValue}`}
                              </Badge>
                            )}
                          </Flex>
                          <Select
                            size="sm"
                            placeholder={isEnglish ? "Select seat column" : "请选择座位列"}
                            value={currentValue}
                            onChange={(e) => handleSeatColumnChange(passengerIndex, e.target.value)}
                          >
                            <option value="">
                              {isEnglish ? "Clear selection" : "暂不选择 / 清除"}
                            </option>
                            {availableSeatInfo.availableColumns?.map((column) => {
                              const remaining = getRemainingForColumn(column, passengerIndex);
                              const disabled =
                                remaining <= 0 && currentValue !== column;
                              const remainingLabel =
                                remaining === UNLIMITED_COLUMN_CAPACITY
                                  ? isEnglish
                                    ? "Plenty"
                                    : "充足"
                                  : remaining > 0
                                  ? `${remaining}${isEnglish ? " seat(s) left" : " 个座位"}`
                                  : isEnglish
                                  ? "Full"
                                  : "已满";
                              return (
                                <option key={column} value={column} disabled={disabled}>
                                  {`${column} ${
                                    isEnglish ? "column" : "列"
                                  } (${remainingLabel})`}
                                </option>
                              );
                            })}
                          </Select>
                        </Box>
                      );
                    })}
                    {remainingSeatSelections > 0 && (
                      <Text fontSize="sm" color="orange.500">
                        {isEnglish
                          ? `Please complete seat selection for ${remainingSeatSelections} passenger(s)`
                          : `仍有 ${remainingSeatSelections} 位乘客未选择座位列`}
                      </Text>
                    )}
                    {availableSeatInfo.columnAvailability &&
                      availableSeatInfo.columnAvailability.length > 0 && (
                        <Text fontSize="xs" color="gray.500">
                          {isEnglish
                            ? "Numbers indicate remaining seats in each column. You cannot assign more passengers than the remaining seats."
                            : "数字表示各列剩余座位数，选择人数不得超过余量。"}
                        </Text>
                      )}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    {isEnglish
                      ? "Seat information for this cabin is unavailable"
                      : "该舱位暂无座位信息"}
                  </Text>
                )}
              </FormControl>
            )}

            {!originalBooking && (
              <Box>
                <FormLabel mb={3} fontWeight="semibold">
                  {isEnglish ? "Passenger information" : "乘客信息"}{" "}
                  {ticketCount > 1 &&
                    (isEnglish
                      ? `(Total ${ticketCount} passengers)`
                      : `（共 ${ticketCount} 位乘客）`)}
                </FormLabel>
                <VStack align="stretch" spacing={4}>
                {passengers.map((passenger, index) => (
                  <Box
                    key={index}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={passengerErrors[index] ? "red.300" : "gray.200"}
                    bg={index === 0 ? "blue.50" : "white"}
                  >
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {index === 0
                          ? isEnglish
                            ? "Primary passenger"
                            : "本人信息"
                          : isEnglish
                            ? `Passenger ${index + 1}`
                            : `乘客 ${index + 1}`}
                      </Text>
                      {index > 0 && (
                        <IconButton
                          aria-label={isEnglish ? "Remove passenger" : "删除乘客"}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          icon={<DeleteIcon />}
                          onClick={() => {
                            const newPassengers = passengers.filter((_, i) => i !== index);
                            setPassengers(newPassengers);
                            setTicketCount(newPassengers.length);
                            const newErrors = { ...passengerErrors };
                            delete newErrors[index];
                            // 重新索引错误信息
                            const reindexedErrors: Record<number, { name?: string; idNumber?: string; phone?: string }> = {};
                            Object.keys(newErrors).forEach(key => {
                              const oldIndex = Number(key);
                              if (oldIndex < index) {
                                reindexedErrors[oldIndex] = newErrors[oldIndex];
                              } else if (oldIndex > index) {
                                reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
                              }
                            });
                            setPassengerErrors(reindexedErrors);
                          }}
                        />
                      )}
                    </HStack>
                    <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                      <GridItem>
                        <FormControl isInvalid={!!passengerErrors[index]?.name}>
                          <FormLabel fontSize="sm">
                            {isEnglish ? "Full name" : "真实姓名"}
                          </FormLabel>
                          <Input
                            size="sm"
                            value={passenger.name}
                            onChange={(e) => {
                              const newPassengers = [...passengers];
                              newPassengers[index].name = e.target.value;
                              setPassengers(newPassengers);
                              // 清除错误
                              if (passengerErrors[index]?.name) {
                                const newErrors = { ...passengerErrors };
                                delete newErrors[index].name;
                                if (Object.keys(newErrors[index]).length === 0) {
                                  delete newErrors[index];
                                }
                                setPassengerErrors(newErrors);
                              }
                            }}
                            placeholder={isEnglish ? "Enter full name" : "请输入真实姓名"}
                          />
                          <FormErrorMessage>{passengerErrors[index]?.name}</FormErrorMessage>
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl isInvalid={!!passengerErrors[index]?.idNumber}>
                          <FormLabel fontSize="sm">
                            {isEnglish ? "ID number" : "身份证号"}
                          </FormLabel>
                          <Input
                            size="sm"
                            value={passenger.idNumber}
                            onChange={(e) => {
                              const newPassengers = [...passengers];
                              newPassengers[index].idNumber = e.target.value;
                              setPassengers(newPassengers);
                              // 清除错误
                              if (passengerErrors[index]?.idNumber) {
                                const newErrors = { ...passengerErrors };
                                delete newErrors[index].idNumber;
                                if (Object.keys(newErrors[index]).length === 0) {
                                  delete newErrors[index];
                                }
                                setPassengerErrors(newErrors);
                              }
                            }}
                            placeholder={isEnglish ? "Enter ID number" : "请输入身份证号"}
                            maxLength={18}
                          />
                          <FormErrorMessage>{passengerErrors[index]?.idNumber}</FormErrorMessage>
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl isInvalid={!!passengerErrors[index]?.phone}>
                          <FormLabel fontSize="sm">
                            {isEnglish ? "Phone number" : "联系电话"}
                          </FormLabel>
                          <Input
                            size="sm"
                            value={passenger.phone}
                            onChange={(e) => {
                              const newPassengers = [...passengers];
                              newPassengers[index].phone = e.target.value;
                              setPassengers(newPassengers);
                              // 清除错误
                              if (passengerErrors[index]?.phone) {
                                const newErrors = { ...passengerErrors };
                                delete newErrors[index].phone;
                                if (Object.keys(newErrors[index]).length === 0) {
                                  delete newErrors[index];
                                }
                                setPassengerErrors(newErrors);
                              }
                            }}
                            placeholder={isEnglish ? "Enter phone" : "请输入手机号"}
                            maxLength={11}
                          />
                          <FormErrorMessage>{passengerErrors[index]?.phone}</FormErrorMessage>
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </Box>
                ))}
                </VStack>
              </Box>
            )}

            {!changePriceInfo && (
              <Box>
                <Text color="gray.500">{isEnglish ? "Total amount" : "总金额"}</Text>
                <Heading size="lg" color="blue.600">
                  ¥{totalAmount.toLocaleString()}
                </Heading>
              </Box>
            )}

            {hasValidWalletBalance && (
              <Box
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor={walletEnough ? "teal.100" : "red.200"}
                bg={walletEnough ? "teal.50" : "red.50"}
              >
                <Flex justify="space-between" align="center">
                  <Text color="gray.600" fontSize="sm">
                    {isEnglish ? "Wallet balance" : "钱包可用余额"}
                  </Text>
                  <Heading size="md" color={walletEnough ? "teal.600" : "red.500"}>
                    ¥{(walletBalance ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Heading>
                </Flex>
                {!walletEnough && (
                  <Text fontSize="sm" color="red.600" mt={2}>
                    {isEnglish ? "Need " : "余额不足，还需 "}¥
                    {walletShortage.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {isEnglish
                      ? '. Please top up via "Wallet" in Profile.'
                      : '，请前往个人中心的"钱包"完成充值后再试。'}
                  </Text>
                )}
              </Box>
            )}

            {bookingMessage && (
              <Alert
                status={
                  bookingMessage.includes("成功") ||
                  bookingMessage.toLowerCase().includes("success")
                    ? "success"
                    : "error"
                }
                borderRadius="md"
              >
                <AlertIcon />
                {bookingMessage}
              </Alert>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter display="flex" gap={3}>
          <Button variant="ghost" onClick={onClose}>
            {isEnglish ? "Cancel" : "取消"}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmitOrder}
            isLoading={bookingLoading}
            isDisabled={
              !selectedCabinClass ||
              !selectedSeat ||
              selectedSeat.remainingSeats === 0 ||
              (hasValidWalletBalance && !walletEnough) ||
              (seatSelectionRequired && remainingSeatSelections > 0)
            }
          >
            {isEnglish ? "Submit order" : "提交订单"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function FlightCard({
  flight,
  onBook,
  discount,
  language,
}: {
  flight: Flight;
  onBook: (flight: Flight) => void;
  discount?: { rate: number; discountedPrice: number; originalPrice: number };
  language: Language;
}) {
  const depart = dayjs(flight.departTime);
  const arrive = dayjs(flight.arriveTime);
  const statusKey = (flight.status || "ON_TIME") as FlightStatusKey;
  const statusColor = statusColorMap[statusKey] || "gray";
  const isUrgent = isFlightInUrgentWindow(flight.departTime);
  const fallbackPrice = deriveLowestCabinPrice(flight) ?? 0;
  const discountedBase =
    discount && discount.discountedPrice > 0 ? discount.discountedPrice : null;
  const basePrice = discountedBase ?? fallbackPrice;
  const priceToShow = Number(
    (basePrice * (isUrgent ? 1 + URGENT_SURCHARGE_RATE : 1)).toFixed(2)
  );
  const isEnglish = language === "en-US";
  const shouldShowDiscount =
    discount &&
    discount.originalPrice > 0 &&
    discountedBase !== null &&
    discount.originalPrice > discountedBase;
  const discountLabel =
    shouldShowDiscount &&
    (isEnglish
      ? `${Math.round((1 - discount.rate) * 100)}% OFF`
      : `${(discount.rate * 10).toFixed(1).replace(/\.0$/, "")}折`);
  const badgeColor = shouldShowDiscount
    ? discount.rate >= 0.95
      ? "yellow"
      : discount.rate >= 0.9
        ? "orange"
        : "red"
    : undefined;
  const statusLabels: StatusLabelRecord =
    statusLabelMap[language] || statusLabelMap["zh-CN"];
  const statusLabel = statusLabels[statusKey] || statusLabels.ON_TIME;
  const fromCity = translateCity(flight.from, language) || flight.from;
  const toCity = translateCity(flight.to, language) || flight.to;

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="sm"
      position="relative"
    >
      {discount && badgeColor && discountLabel && (
        <Badge position="absolute" top={4} right={4} colorScheme={badgeColor}>
          {discountLabel}
        </Badge>
      )}
      <Flex direction={{ base: "column", md: "row" }} gap={6}>
        <Box flex="2">
          <HStack spacing={3} mb={2}>
            <Heading size="md">{flight.flightNumber}</Heading>
            <Tag colorScheme={statusColor} variant="solid">
              {statusLabel}
            </Tag>
          </HStack>
          {flight.planeType && (
            <Text fontWeight="medium" mb={4}>
              {flight.planeType}
            </Text>
          )}

          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <GridItem>
              <Heading size="lg">{depart.format("HH:mm")}</Heading>
              <Text color="gray.500">{depart.format(isEnglish ? "MMM DD" : "MM月DD日")}</Text>
              <Text mt={1}>{fromCity}</Text>
            </GridItem>
            <GridItem display="flex" alignItems="center" justifyContent="center">
              <VStack spacing={2}>
                <Tag colorScheme="blue" variant="subtle" size="lg">
                  <TagLeftIcon as={TimeIcon} />
                  <TagLabel>{flight.duration}</TagLabel>
                </Tag>
                <Divider orientation="horizontal" />
              </VStack>
            </GridItem>
            <GridItem textAlign="right">
              <Heading size="lg">{arrive.format("HH:mm")}</Heading>
              <Text color="gray.500">{arrive.format(isEnglish ? "MMM DD" : "MM月DD日")}</Text>
              <Text mt={1}>{toCity}</Text>
            </GridItem>
          </Grid>
        </Box>

        <Divider display={{ base: "block", md: "none" }} />

        <Flex
          flex="1"
          direction="column"
          justify="space-between"
          align={{ base: "flex-start", md: "flex-end" }}
          textAlign={{ base: "left", md: "right" }}
        >
          <Box>
            <Heading size="lg" color={discount ? "red.500" : "blue.600"}>
              ¥{priceToShow.toLocaleString()}
              <Text
                as="span"
                fontSize="sm"
              color={shouldShowDiscount ? "red.500" : "blue.600"}
                ml={1}
              >
                {isEnglish ? "from" : "起"}
              </Text>
            </Heading>
            {shouldShowDiscount && discount && (
              <Text
                fontSize="sm"
                color="gray.500"
                textDecor="line-through"
              >
                {(isEnglish ? "Original" : "原价") +
                  ` ¥${discount.originalPrice.toLocaleString()}`}
              </Text>
            )}
            {isUrgent && (
              <Text fontSize="xs" color="red.500">
                {isEnglish
                  ? "Departing within 12h · price +10%"
                  : "距离起飞不足12小时 · 票价+10%"}
              </Text>
            )}
            <HStack justify={{ base: "flex-start", md: "flex-end" }} mt={2}>
              <Tag colorScheme={flight.seatsLeft > 10 ? "green" : "red"}>
                {flight.seatsLeft > 10
                  ? isEnglish
                    ? `Seats ${flight.seatsLeft}`
                    : `余票 ${flight.seatsLeft}`
                  : isEnglish
                    ? `Low seats (${flight.seatsLeft})`
                    : `余票紧张 (${flight.seatsLeft})`}
              </Tag>
            </HStack>
          </Box>
          <Button
            colorScheme="blue"
            size="lg"
            mt={{ base: 4, md: 0 }}
            leftIcon={
              flight.seatsLeft > 0 ? <CheckCircleIcon /> : <WarningIcon />
            }
            isDisabled={flight.seatsLeft <= 0}
            onClick={() => onBook(flight)}
          >
            {flight.seatsLeft > 0
              ? isEnglish
                ? "Book now"
                : "立即预订"
              : isEnglish
                ? "Unavailable"
                : "暂不可订"}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

type PendingPayment = {
  payload: BookingRequest;
  totalAmount: number;
  walletBalance: number;
  flightNumber: string;
  cabinLabel: string;
  ticketCount: number;
  discountRate?: number;
  urgentSurchargeRate?: number;
  expiresAt: number;
};

type PaymentConfirmModalProps = {
  isOpen: boolean;
  info: PendingPayment | null;
  flight: Flight | null;
  onCancel: () => void;
  onConfirm: () => void;
  onHold: () => void;
  onExpire: () => void;
  isLoading: boolean;
  language: Language;
};

function PaymentConfirmModal({
  isOpen,
  info,
  flight,
  onCancel,
  onConfirm,
  onHold,
  onExpire,
  isLoading,
  language,
}: PaymentConfirmModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_COUNTDOWN_MINUTES * 60);
  const isEnglish = language === "en-US";

  useEffect(() => {
    if (!info || !isOpen) {
      setSecondsLeft(PAYMENT_COUNTDOWN_MINUTES * 60);
      return;
    }
    const calcRemaining = () =>
      Math.max(0, Math.floor((info.expiresAt - Date.now()) / 1000));

    setSecondsLeft(calcRemaining());

    const timer = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0 && !isLoading) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [info, isOpen, onExpire, isLoading]);

  if (!info || !flight) {
    return null;
  }
  const depart = dayjs(flight.departTime);
  const arrive = dayjs(flight.arriveTime);
  const fromCity = translateCity(flight.from, language) || flight.from;
  const toCity = translateCity(flight.to, language) || flight.to;
  const walletAfter = Math.max(0, (info.walletBalance ?? 0) - info.totalAmount);
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const actionDisabled = secondsLeft <= 0 || isLoading;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEnglish ? "Confirm payment" : "确认支付"}</ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status={secondsLeft > 0 ? "info" : "warning"} borderRadius="md">
              <AlertIcon />
              {isEnglish ? "Time left" : "剩余支付时间"}：{minutes}:{seconds}
            </Alert>
            <Box>
              <Text fontSize="sm" color="gray.500">
                {isEnglish ? "Flight details" : "航班信息"}
              </Text>
              <Heading size="md" mt={1}>
                {info.flightNumber}
              </Heading>
              <Text color="gray.600">
                {depart.format(isEnglish ? "MMM DD HH:mm" : "MM月DD日 HH:mm")}{" "}
                {isEnglish ? "Departure" : "出发"} · {fromCity}
              </Text>
              <Text color="gray.600">
                {arrive.format(isEnglish ? "MMM DD HH:mm" : "MM月DD日 HH:mm")}{" "}
                {isEnglish ? "Arrival" : "抵达"} · {toCity}
              </Text>
              <Text color="gray.500" fontSize="sm">
                {isEnglish
                  ? `Cabin: ${info.cabinLabel} · Tickets: ${info.ticketCount}`
                  : `舱位：${info.cabinLabel} · 票数：${info.ticketCount} 张`}
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
                {isEnglish ? "Amount due" : "本次应付金额"}
              </Text>
              <Heading size="lg" color="blue.600" mt={1}>
                ¥{info.totalAmount.toLocaleString()}
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {isEnglish ? "Wallet balance: " : "钱包可用余额："}¥
                {(info.walletBalance ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {isEnglish ? "After payment: " : "支付后余额："}¥
                {walletAfter.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              {info.urgentSurchargeRate && info.urgentSurchargeRate > 0 && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {isEnglish
                    ? "Includes +10% surcharge because departure is within 12 hours. Refunds will charge a 1% fee."
                    : "已包含临近起飞 10% 加价，若退票需收取 1% 手续费。"}
                </Text>
              )}
            </Box>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              {isEnglish
                ? 'Click "Confirm payment" to deduct immediately, or choose "Hold" to reserve for 15 minutes.'
                : '点击"确认支付"后将立即扣款并完成出票，可选择"待支付"保留 15 分钟。'}
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter flexWrap="wrap" gap={3} justifyContent="flex-end">
          <Button variant="ghost" mr="auto" onClick={onCancel} isDisabled={isLoading}>
            {isEnglish ? "Back" : "返回修改"}
          </Button>
          <Button
            variant="outline"
            onClick={onHold}
            isDisabled={actionDisabled}
            isLoading={isLoading}
          >
            {isEnglish ? "Hold (pay later)" : "待支付（保留）"}
          </Button>
          <Button
            colorScheme="blue"
            onClick={onConfirm}
            isLoading={isLoading}
            isDisabled={actionDisabled}
          >
            {isEnglish ? "Confirm payment" : "确认支付"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

