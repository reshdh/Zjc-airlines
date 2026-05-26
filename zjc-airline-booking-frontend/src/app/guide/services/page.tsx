"use client";

import {
  Badge,
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
import { ArrowForwardIcon, CheckCircleIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const servicesI18n = {
  "zh-CN": {
    heroTitle: "出行指南 · 航班服务",
    heroSubtitle:
      "了解 ZJC 航空在售票、座位、客服与增值服务方面的能力，结合系统内置功能获得更顺畅的旅程。",
    serviceCards: [
      {
        title: "购票与改签",
        points: [
          "航班列表支持实时“只看有票”筛选，并显示临近起飞加价提示。",
          "订单生成后可在“我的订票单”查看状态，支持在线取消或提交改签申请。",
          "若更换乘客或补充信息，可在“个人中心”同步实名资料。",
        ],
        tag: "核心",
      },
      {
        title: "座位与舱位升级",
        points: [
          "多乘客订票时，为每位乘客单独选择座位列，确保同行也能相邻。",
          "在座位不足时可切换舱位或查看“限时优惠”模块中的其他航班。",
          "计划升舱的用户可联系管理员，在后台通过航班订单抽屉查看余票情况。",
        ],
        tag: "体验",
      },
      {
        title: "客服与保障",
        points: [
          "首页页脚提供在线客服入口，可秒开真人/AI 客服。",
          "支付环节若失败，可在钱包模块重新生成二维码并继续充值。",
          "恶劣天气延误时，系统会在航班卡片上显示状态颜色，便于及早调整计划。",
        ],
        tag: "服务",
      },
    ],
    addOnTitle: "增值服务",
    addOns: [
      "VIP 候机与快速安检：在提交订单后联系管理员验证航班号，客服会在后台加载对应订单。",
      "额外行李与器材托运：请先查看“行李与安全”指南，再在订单详情里留言需求。",
      "企业账户结算：通过管理员面板的“查看订单”抽屉导出航班订单，用于对账。",
    ],
    ctaText: "需要进一步帮助？",
    ctaButtons: [
      { label: "进入帮助中心", href: "/help", variant: "outline" as const },
      { label: "查看我的订单", href: "/bookings", variant: "solid" as const },
    ],
  },
  "en-US": {
    heroTitle: "Travel Guide · Flight Services",
    heroSubtitle:
      "See how ZJC Airlines handles ticketing, seating, support, and add-ons so you can make the most of the platform.",
    serviceCards: [
      {
        title: "Ticketing & changes",
        points: [
          "Flight list features the real-time “Only available” filter with surge warnings when departure is near.",
          "Track every order inside My Bookings—submit cancellations or change requests online.",
          "Need to update passenger data? Sync it in Profile and your next ticket will display the latest name.",
        ],
        tag: "Core",
      },
      {
        title: "Seats & cabin upgrades",
        points: [
          "Assign seat columns per passenger; families or colleagues can sit together without conflicts.",
          "Switch cabin classes or explore Limited Deals if availability runs low.",
          "For upgrade assistance, admins can open the flight booking drawer in the console to check inventory.",
        ],
        tag: "Experience",
      },
      {
        title: "Support & protection",
        points: [
          "Footer links open live chat (AI + agent) anytime you need help.",
          "If a payment fails, regenerate the wallet QR code and retry immediately.",
          "Weather or delay alerts surface directly on each flight card so you can react early.",
        ],
        tag: "Service",
      },
    ],
    addOnTitle: "Value-added options",
    addOns: [
      "VIP lounge & fast-track: contact admin after order submission; staff will locate it via the flight drawer.",
      "Extra baggage or sports gear: review the Baggage guide first, then leave a note inside the order detail.",
      "Corporate settlement: export bookings through the admin “View Orders” drawer for accounting.",
    ],
    ctaText: "Need more assistance?",
    ctaButtons: [
      { label: "Visit Help Center", href: "/help", variant: "outline" as const },
      { label: "View My Bookings", href: "/bookings", variant: "solid" as const },
    ],
  },
} as const;

export default function ServicesGuidePage() {
  const { language } = useLanguage();
  const t = servicesI18n[language as keyof typeof servicesI18n] || servicesI18n["zh-CN"];

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

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {t.serviceCards.map((card) => (
          <Card key={card.title} borderWidth="1px" borderColor="gray.100" boxShadow="sm" h="100%">
            <CardHeader>
              <Stack direction="row" align="center" justify="space-between">
                <Heading size="md">{card.title}</Heading>
                <Badge colorScheme="teal">{card.tag}</Badge>
              </Stack>
            </CardHeader>
            <CardBody>
              <List spacing={3} color="gray.700">
                {card.points.map((point) => (
                  <ListItem key={point}>
                    <ListIcon as={CheckCircleIcon} color="blue.500" />
                    {point}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Card borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.addOnTitle}</Heading>
        </CardHeader>
        <CardBody>
          <List spacing={3} color="gray.700">
            {t.addOns.map((item) => (
              <ListItem key={item}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {item}
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>

      <Card borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.ctaText}</Heading>
        </CardHeader>
        <CardBody>
          <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
            {t.ctaButtons.map((btn) => (
              <Button
                key={btn.label}
                as={NextLink}
                href={btn.href}
                variant={btn.variant}
                rightIcon={btn.variant === "outline" ? <ArrowForwardIcon /> : undefined}
                colorScheme="blue"
              >
                {btn.label}
              </Button>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </VStack>
  );
}









