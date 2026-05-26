"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { SearchIcon, CalendarIcon, RepeatIcon } from "@chakra-ui/icons";
import { CityPicker } from "@/components/common/CityPicker";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useLanguage } from "@/context/LanguageContext";
import { getRouteLabel } from "@/lib/i18n/cities";
import { flightApi, type Flight } from "@/lib/flights";

const AUTO_REFRESH_INTERVAL_MS = 30 * 1000;

type HotFlightCard = {
  flightNumber: string;
  route: string;
  time: string;
  price: string;
  seats: number;
  from?: string;
  to?: string;
  priceNumber?: number;
  discount?: number;
  originalPrice?: number;
};

type DiscountFlightCard = HotFlightCard & {
  originalPrice: number;
  discount: number;
};

const DEFAULT_HOT_FLIGHTS: HotFlightCard[] = [
  {
    flightNumber: "ZJC001",
    route: "北京 → 上海",
    time: "08:00 - 10:30",
    price: "¥680",
    seats: 15,
    from: "北京",
    to: "上海",
  },
  {
    flightNumber: "ZJC002",
    route: "上海 → 广州",
    time: "14:00 - 16:45",
    price: "¥850",
    seats: 8,
    from: "上海",
    to: "广州",
  },
  {
    flightNumber: "ZJC003",
    route: "广州 → 深圳",
    time: "10:30 - 11:30",
    price: "¥320",
    seats: 22,
    from: "广州",
    to: "深圳",
  },
];

const homeI18n = {
  "zh-CN": {
    welcomeTitle: "欢迎来到 ZJC 航空公司",
    welcomeSubtitle: "为您提供安全、舒适、便捷的航空出行服务",
    quickSearch: "快速搜索航班",
    from: "出发城市",
    to: "目的地",
    datePlaceholder: "请选择日期",
    searchFlights: "搜索航班",
    reset: "重置",
    hotFlights: "热门航班推荐",
    viewMore: "查看更多航班",
    serviceTitle: "我们的服务",
    serviceSafe: "安全可靠",
    serviceSafeDesc: "严格的安全标准和专业的机组人员，保障您的出行安全",
    serviceComfort: "舒适体验",
    serviceComfortDesc: "宽敞的座位空间和优质的服务，让您的旅程更加舒适",
    serviceConvenient: "便捷预订",
    serviceConvenientDesc: "简单快捷的在线预订系统，随时随地轻松订票",
    bookNow: "立即预订",
    flightTime: "飞行时间",
    seatsLeft: "剩余座位",
    limitedTitle: "限时优惠",
    limitedDesc: "余票最多的 3 条航线，限时 8.5 折 / 9 折 / 9.5 折",
    originalPrice: "原价",
    limitedButton: "立即抢购",
  },
  "en-US": {
    welcomeTitle: "Welcome to ZJC Airlines",
    welcomeSubtitle:
      "We provide safe, comfortable and convenient air travel services",
    quickSearch: "Quick Flight Search",
    from: "Departure",
    to: "Destination",
    datePlaceholder: "Select date",
    searchFlights: "Search Flight",
    reset: "Reset",
    hotFlights: "Popular Flights",
    viewMore: "View more flights",
    serviceTitle: "Our Services",
    serviceSafe: "Safety First",
    serviceSafeDesc:
      "Strict safety standards and professional crews ensure peace of mind",
    serviceComfort: "Comfort Experience",
    serviceComfortDesc:
      "Spacious seating and premium services make your trip comfortable",
    serviceConvenient: "Easy Booking",
    serviceConvenientDesc:
      "Simple and fast online booking system for anytime, anywhere",
    bookNow: "Book Now",
    flightTime: "Flight time",
    seatsLeft: "Seats left",
    limitedTitle: "Limited Offers",
    limitedDesc: "Top 3 routes with most seats, limited 15% / 10% / 5% off",
    originalPrice: "Original",
    limitedButton: "Book Deal",
  },
};

type LanguageKey = keyof typeof homeI18n;

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = homeI18n[language as keyof typeof homeI18n] || homeI18n["zh-CN"];
  const [quickSearch, setQuickSearch] = useState({
    from: "",
    to: "",
    date: "",
  });
  const [recommendedFlights, setRecommendedFlights] = useState<HotFlightCard[]>([]);
  const [discountFlights, setDiscountFlights] = useState<DiscountFlightCard[]>([]);

  const discountLookupRef = useRef<Record<string, DiscountFlightCard>>({});

  const mapFlightToCard = useCallback(
    (flight: Flight): HotFlightCard & { priceNumber: number } => {
      const departLabel = flight.departTime ? dayjs(flight.departTime).format("HH:mm") : "--:--";
      const arriveLabel = flight.arriveTime ? dayjs(flight.arriveTime).format("HH:mm") : "--:--";
      const routeLabel = getRouteLabel({ from: flight.from, to: flight.to }, language);
      const seatsLeft =
        typeof flight.seatsLeft === "number"
          ? Math.max(flight.seatsLeft, 0)
          : Math.max(
              flight.seats?.reduce((sum, seat) => sum + (seat.remainingSeats ?? 0), 0) ?? 0,
              0
            );
      const priceNumber = Math.max(Number(flight.price ?? 0), 0);
      return {
        flightNumber: flight.flightNumber,
        route: routeLabel || `${flight.from || ""} → ${flight.to || ""}`,
        time: `${departLabel} - ${arriveLabel}`,
        price: `¥${priceNumber.toFixed(0)}`,
        seats: seatsLeft,
        from: flight.from,
        to: flight.to,
        priceNumber,
      };
    },
    [language]
  );

  const applyDiscountInfo = useCallback(
    (card: HotFlightCard, lookup: Record<string, DiscountFlightCard>) => {
      const info = lookup[card.flightNumber];
      if (!info) {
        const cloned = { ...card };
        delete cloned.discount;
        delete cloned.originalPrice;
        return cloned;
      }
      return {
        ...card,
        price: info.price,
        discount: info.discount,
        originalPrice: info.originalPrice,
      };
    },
    []
  );

  const fetchFlights = useCallback(async () => {
    try {
      const [flights, recommended] = await Promise.all([
        flightApi.listAll(),
        flightApi.recommendations({ limit: 3 }),
      ]);

      const computed = flights.map(mapFlightToCard);
      const availableComputed = computed.filter((flight) => (flight.seats || 0) > 0);
      const computedMap = new Map(computed.map((item) => [item.flightNumber, item]));

      if (availableComputed.length > 0) {
        const discountRates = [0.85, 0.9, 0.95];
        const sortedBySeats = [...availableComputed].sort(
          (a, b) => (b.seats || 0) - (a.seats || 0)
        );
        const topThree = sortedBySeats.slice(0, discountRates.length);

        const discountList: DiscountFlightCard[] = topThree.map((flight, index) => {
          const rate = discountRates[index] ?? 0.95;
          const parsedPrice = Number(String(flight.price).replace(/[^\d.]/g, ""));
          const priceNumber = Math.max(
            typeof flight.priceNumber === "number" && Number.isFinite(flight.priceNumber)
              ? flight.priceNumber
              : Number.isFinite(parsedPrice)
                ? parsedPrice
                : 0,
            0
          );
          const discounted = Math.round(priceNumber * rate);
          return {
            flightNumber: flight.flightNumber,
            route: flight.route,
            time: flight.time,
            price: `¥${discounted}`,
            seats: flight.seats,
            from: flight.from,
            to: flight.to,
            priceNumber,
            originalPrice: Math.max(priceNumber, 0),
            discount: rate,
          };
        });

        discountLookupRef.current = discountList.reduce<Record<string, DiscountFlightCard>>(
          (acc, item) => {
            acc[item.flightNumber] = item;
            return acc;
          },
          {}
        );
        setDiscountFlights(discountList);
      } else {
        discountLookupRef.current = {};
        setDiscountFlights([]);
      }

      const recommendationCards = recommended
        .map((flight) => {
          const base = computedMap.get(flight.flightNumber) || mapFlightToCard(flight);
          return applyDiscountInfo(base, discountLookupRef.current);
        })
        .filter((flight) => (flight.seats || 0) > 0);

      if (recommendationCards.length > 0) {
        setRecommendedFlights(recommendationCards);
      } else if (availableComputed.length > 0) {
        const fallback = availableComputed
          .slice(0, 3)
          .map((card) => applyDiscountInfo(card, discountLookupRef.current));
        setRecommendedFlights(fallback);
      } else {
        setRecommendedFlights([]);
      }
    } catch (error) {
      discountLookupRef.current = {};
      setRecommendedFlights([]);
      setDiscountFlights([]);
    }
  }, [applyDiscountInfo, mapFlightToCard]);

  useEffect(() => {
    fetchFlights();
    const timer = setInterval(fetchFlights, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchFlights]);

  const flightsToShow =
    recommendedFlights.length > 0 ? recommendedFlights : DEFAULT_HOT_FLIGHTS;

  return (
    <VStack spacing={8} align="stretch" py={8}>
      {/* 欢迎横幅 */}
      <Box
        bgGradient="linear(to-r, blue.500, teal.500)"
        color="white"
        p={8}
        borderRadius="lg"
        textAlign="center"
      >
        <Heading size="2xl" mb={4}>
          {t.welcomeTitle}
        </Heading>
        <Text fontSize="xl" opacity={0.9}>
          {t.welcomeSubtitle}
        </Text>
      </Box>

      {/* 快速搜索 */}
      <Card>
        <CardHeader>
          <Heading size="md">{t.quickSearch}</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <CityPicker
              value={quickSearch.from}
              placeholder={t.from}
              icon={<Text color="gray.300">📍</Text>}
              onChange={(city) => setQuickSearch((prev) => ({ ...prev, from: city }))}
        />
            <CityPicker
              value={quickSearch.to}
              placeholder={t.to}
              icon={<Text color="gray.300">📍</Text>}
              onChange={(city) => setQuickSearch((prev) => ({ ...prev, to: city }))}
            />
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <CalendarIcon color="gray.300" />
              </InputLeftElement>
              <Input
                type="date"
                value={quickSearch.date}
                placeholder={t.datePlaceholder}
                onChange={(e) =>
                  setQuickSearch((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </InputGroup>
          </SimpleGrid>
          <HStack mt={4} justify="center" spacing={4}>
            <Button
              colorScheme="blue"
              size="lg"
              leftIcon={<SearchIcon />}
              onClick={() => {
                const params = new URLSearchParams();
                if (quickSearch.from) {
                  params.append("from", quickSearch.from);
                }
                if (quickSearch.to) {
                  params.append("to", quickSearch.to);
                }
                if (quickSearch.date) {
                  params.append("date", quickSearch.date);
                }
                const query = params.toString();
                router.push(`/flights${query ? `?${query}` : ""}`);
              }}
            >
              {t.searchFlights}
            </Button>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<RepeatIcon />}
              onClick={() => {
                setQuickSearch({
                  from: "",
                  to: "",
                  date: "",
                });
              }}
            >
              {t.reset}
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* 热门航班 */}
      <Box>
        <HStack mb={4} justify="space-between" align="center">
          <Heading size="lg">{t.hotFlights}</Heading>
          <Button
            variant="link"
            colorScheme="blue"
            onClick={() => router.push("/flights")}
          >
            {t.viewMore}
          </Button>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {flightsToShow.map((flight) => {
            const hasDiscount = typeof flight.discount === "number";
            const discountLabel =
              hasDiscount && flight.discount
                ? language === "zh-CN"
                  ? `${(flight.discount * 10).toFixed(1).replace(/\.0$/, "")}折`
                  : `${Math.round((1 - flight.discount) * 100)}% OFF`
                : null;
            const badgeColor = !hasDiscount
              ? undefined
              : flight.discount! <= 0.85
                ? "red"
                : flight.discount! <= 0.9
                  ? "orange"
                  : "yellow";
            return (
              <Card
                key={flight.flightNumber}
                position="relative"
                display="flex"
                flexDirection="column"
                h="100%"
                _hover={{ shadow: "lg" }}
              >
                {hasDiscount && discountLabel && badgeColor && (
                  <Badge position="absolute" top={2} right={2} colorScheme={badgeColor}>
                    {discountLabel}
                  </Badge>
                )}
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="flex-start" gap={4}>
                    <Badge colorScheme="blue" alignSelf="flex-start">{flight.flightNumber}</Badge>
                    <Flex direction="column" align="flex-end" gap={1} minH="48px" justify="flex-start">
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color={hasDiscount ? "red.500" : "blue.500"}
                      >
                        {flight.price}
                      </Text>
                      {hasDiscount && flight.originalPrice !== undefined ? (
                        <Text fontSize="xs" color="gray.500" textDecor="line-through">
                          {t.originalPrice} ¥{flight.originalPrice.toFixed(0)}
                        </Text>
                      ) : (
                        <Text fontSize="xs" color="transparent" visibility="hidden">
                          {t.originalPrice} ¥0
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </CardHeader>
                <CardBody pt={2} flex="1" display="flex">
                  <VStack align="stretch" spacing={2} w="100%" flex="1">
                    <Text fontWeight="semibold">
                      {getRouteLabel(flight, language)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {t.flightTime}: {flight.time}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {t.seatsLeft}: {flight.seats}
                    </Text>
                    <Button
                      colorScheme="teal"
                      size="sm"
                      mt="auto"
                      onClick={() => {
                        const from =
                          flight.from || flight.route.split(" → ")[0] || "";
                        const to =
                          flight.to || flight.route.split(" → ")[1] || "";
                        const params = new URLSearchParams();
                        if (from) {
                          params.append("from", from);
                        }
                        if (to) {
                          params.append("to", to);
                        }
                        const query = params.toString();
                        router.push(`/flights${query ? `?${query}` : ""}`);
                      }}
                    >
                      {t.bookNow}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* 限时优惠 */}
      {discountFlights.length > 0 && (
        <Box>
          <HStack mb={4} justify="space-between" align="center">
            <Heading size="lg">{t.limitedTitle}</Heading>
            <Text fontSize="sm" color="gray.600">
              {t.limitedDesc}
            </Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {discountFlights.map((flight, index) => {
              const discountLabel =
                language === "zh-CN"
                  ? `${(flight.discount * 10).toFixed(1).replace(/\.0$/, "")}折`
                  : `${Math.round((1 - flight.discount) * 100)}% OFF`;
              const badgeColor =
                index === 0 ? "red" : index === 1 ? "orange" : "yellow";
              return (
                <Card
                  key={`${flight.flightNumber}-discount`}
                  position="relative"
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                  transition="all 0.2s ease"
                >
                  <Badge position="absolute" top={2} right={2} colorScheme={badgeColor}>
                    {discountLabel}
                  </Badge>
              <CardHeader>
                <Flex justify="space-between" align="center">
                      <Badge colorScheme="purple">{flight.flightNumber}</Badge>
                      <Box textAlign="right">
                        <Text fontWeight="bold" fontSize="xl" color="red.500">
                    {flight.price}
                  </Text>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          textDecor="line-through"
                        >
                          {t.originalPrice} ¥{flight.originalPrice.toFixed(0)}
                        </Text>
                      </Box>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                      <Text fontWeight="semibold">
                        {getRouteLabel(flight, language)}
                      </Text>
                  <Text fontSize="sm" color="gray.600">
                        {t.flightTime}: {flight.time}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                        {t.seatsLeft}: {flight.seats}
                  </Text>
                      <Button
                        colorScheme="teal"
                        size="sm"
                        mt={2}
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (flight.from) params.append("from", flight.from);
                          if (flight.to) params.append("to", flight.to);
                          const query = params.toString();
                          router.push(`/flights${query ? `?${query}` : ""}`);
                        }}
                      >
                        {t.limitedButton}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
              );
            })}
        </SimpleGrid>
      </Box>
      )}

      {/* 服务特色 */}
      <Box>
        <Heading size="lg" mb={4}>
          {t.serviceTitle}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="4xl" mb={2}>🛡️</Text>
              <Heading size="sm" mb={2}>
                {t.serviceSafe}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {t.serviceSafeDesc}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="4xl" mb={2}>✨</Text>
              <Heading size="sm" mb={2}>
                {t.serviceComfort}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {t.serviceComfortDesc}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody textAlign="center">
              <Text fontSize="4xl" mb={2}>📱</Text>
              <Heading size="sm" mb={2}>
                {t.serviceConvenient}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {t.serviceConvenientDesc}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </VStack>
  );
}
