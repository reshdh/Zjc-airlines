"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  List,
  ListIcon,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowForwardIcon, CheckCircleIcon, InfoIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const bookingGuideI18n = {
  "zh-CN": {
    heroTitle: "出行指南 · 购票流程",
    heroSubtitle:
      "结合 ZJC 航空订票系统的真实流程，带你完成从搜索航班、选择座位到支付与查看订单的全链路体验。",
    stepsTitle: "核心步骤",
    steps: [
      {
        title: "1. 搜索航班",
        details: [
          "进入首页或“航班信息”页面，选择出发地、目的地与日期。",
          "可开启“只看有票”过滤器，仅展示仍有剩余座位的航班。",
          "未输入日期时系统会按推荐排序，便于快速探索。",
        ],
      },
      {
        title: "2. 对比结果并选座",
        details: [
          "列表按起飞时间升序排列，可快速查看每个航班的剩余座位与票价浮动提示。",
          "点击“立即预订”进入弹窗，为每位乘客单独选择座位列，避免多人共享同一列。",
          "若某舱位售罄，可切换舱位或尝试备选航班。",
        ],
      },
      {
        title: "3. 填写乘客与提交订单",
        details: [
          "输入乘客实名信息，系统会同步到订单详情与电子客票中。",
          "确认票数、行程与价格后提交订单，订单将进入“待支付”状态。",
        ],
      },
      {
        title: "4. 支付与查看订单",
        details: [
          "前往“个人中心-钱包”生成二维码，可使用最新上传的二维码完成充值支付。",
          "支付成功后订单状态更新为“已出票”，可在“我的订票单”中查看详情或申请退改。",
        ],
      },
    ],
    tipsTitle: "操作技巧",
    tips: [
      "航班距起飞不足 12 小时会自动上浮 10%，下单前注意红色提示。",
      "如遇搜索结果为空，可尝试仅输入出发地或切换日期，系统会自动 fallback 到可售航班列表。",
      "多名乘客订票时务必逐个完成座位列选择，提交前确保所有乘客显示“已选择”。",
    ],
    supportTitle: "需要帮助？",
    supportDesc:
      "可随时查看常见问题或联系在线客服，获取订单、支付、退改签等支持。",
    faqButton: "查看帮助中心",
    supportButton: "联系在线客服",
  },
  "en-US": {
    heroTitle: "Travel Guide · Booking Flow",
    heroSubtitle:
      "Follow ZJC Airlines' actual workflow to search flights, pick seats, pay securely, and manage orders in one place.",
    stepsTitle: "Key steps",
    steps: [
      {
        title: "1. Search flights",
        details: [
          "Open Home or Flights page, choose origin, destination, and date.",
          "Toggle “Only available” to filter flights that still have seats.",
          "Without a date, recommendations appear first so you can explore quickly.",
        ],
      },
      {
        title: "2. Compare & select seats",
        details: [
          "Results are sorted by departure time with seat balance and surge notices.",
          "Click Book now to open the modal, then assign a seat column to every passenger individually.",
          "Switch cabin classes or try alternate flights if a cabin sells out.",
        ],
      },
      {
        title: "3. Enter passenger info",
        details: [
          "Provide real-name data so tickets and order details display the correct passenger names.",
          "Confirm ticket count, route, and price before submitting. Orders start in Pending Payment status.",
        ],
      },
      {
        title: "4. Pay & review",
        details: [
          "Use Profile → Wallet to generate the in-app QR code (latest file already synced) and complete the recharge.",
          "Once payment succeeds, the order becomes Ticketed. View or cancel via My Bookings anytime.",
        ],
      },
    ],
    tipsTitle: "Pro tips",
    tips: [
      "Flights within 12 hours apply a 10% surge—watch for the red warning label.",
      "If no results show up, try entering only departure city or switch dates; the system falls back to available flights.",
      "When buying for multiple passengers, ensure every passenger card shows “Selected” before submitting.",
    ],
    supportTitle: "Need help?",
    supportDesc:
      "Browse FAQs or reach the live agent to get support for orders, payments, and itinerary changes.",
    faqButton: "Visit Help Center",
    supportButton: "Contact live support",
  },
} as const;

export default function BookingGuidePage() {
  const { language } = useLanguage();
  const t = bookingGuideI18n[language as keyof typeof bookingGuideI18n] || bookingGuideI18n["zh-CN"];

  return (
    <VStack spacing={8} align="stretch">
      <Box
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        p={{ base: 6, md: 8 }}
        boxShadow="md"
      >
        <Heading size="lg" mb={3}>
          {t.heroTitle}
        </Heading>
        <Text fontSize="lg" color="gray.700" lineHeight="1.8">
          {t.heroSubtitle}
        </Text>
      </Box>

      <Box>
        <Heading size="md" mb={4}>
          {t.stepsTitle}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {t.steps.map((step) => (
            <Card key={step.title} borderWidth="1px" borderColor="gray.100" boxShadow="sm" h="100%">
              <CardHeader>
                <Heading size="sm">{step.title}</Heading>
              </CardHeader>
              <CardBody>
                <List spacing={3} color="gray.700">
                  {step.details.map((detail) => (
                    <ListItem key={detail}>
                      <ListIcon as={CheckCircleIcon} color="blue.500" />
                      {detail}
                    </ListItem>
                  ))}
                </List>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Card borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.tipsTitle}</Heading>
        </CardHeader>
        <CardBody>
          <Stack spacing={3}>
            {t.tips.map((tip) => (
              <Alert key={tip} status="info" borderRadius="md">
                <AlertIcon as={InfoIcon} />
                <AlertDescription>{tip}</AlertDescription>
              </Alert>
            ))}
          </Stack>
        </CardBody>
      </Card>

      <Card borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.supportTitle}</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.600" mb={4}>
            {t.supportDesc}
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
            <Button as={NextLink} href="/help" variant="outline" leftIcon={<ArrowForwardIcon />}>
              {t.faqButton}
            </Button>
            <Button as={NextLink} href="/contact/live" colorScheme="blue">
              {t.supportButton}
            </Button>
          </Stack>
        </CardBody>
      </Card>
    </VStack>
  );
}









