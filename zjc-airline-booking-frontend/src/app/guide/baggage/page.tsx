"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  List,
  ListIcon,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { WarningIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { useLanguage } from "@/context/LanguageContext";

const baggageI18n = {
  "zh-CN": {
    heroTitle: "出行指南 · 行李与安全",
    heroSubtitle:
      "参考 ZJC 航空的舱位配置与安检要求，提前准备行李，可减少托运等待并保障飞行安全。",
    allowanceTitle: "免费行李额度",
    allowanceCards: [
      {
        title: "经济舱",
        body: [
          "随身行李 1 件，5kg 内，三边合计 ≤ 115cm。",
          "托运行李 1 件，20kg 内。可在订票时查看航班剩余舱位，避免最后一刻加价。",
        ],
      },
      {
        title: "公务/头等舱",
        body: [
          "随身行李 2 件，总重量 ≤ 10kg。",
          "托运行李 2 件，每件 32kg 内，可免费加挂优先标签。",
        ],
      },
      {
        title: "特殊行李",
        body: [
          "婴儿车、轮椅可免费托运，需在提交订单后联系客服备注。",
          "运动器材、乐器等请在“航班服务”里提前申请加购保护箱。",
        ],
      },
    ],
    securityTitle: "安检与打包提示",
    securityTips: [
      "充电宝、锂电池、打火机、酒精等易燃易爆物品仅可随身携带或需申报。",
      "液体、喷雾、凝胶单件 ≤ 100ml，总量 ≤ 1L，并置于 20×20cm 透明袋。",
      "锋利器具、工具类必须托运，托运前请使用硬壳箱并加固。",
      "贵重物品（证件、电子产品）建议随身携带，支持在个人中心实时更新联系人信息。",
    ],
    alertTitle: "特别提醒",
    alerts: [
      "如在航班起飞 12 小时内补购托运额，系统将提示 10% 加价，请尽早规划。",
      "恶劣天气或安检升级时，办理托运可能延迟；建议至少提前 120 分钟到达机场。",
    ],
  },
  "en-US": {
    heroTitle: "Travel Guide · Baggage & Safety",
    heroSubtitle:
      "Plan baggage according to ZJC Airlines cabin rules so you breeze through check-in and keep flights safe.",
    allowanceTitle: "Allowance overview",
    allowanceCards: [
      {
        title: "Economy",
        body: [
          "1 carry-on up to 5kg, linear size ≤ 115cm.",
          "1 checked bag up to 20kg. Check seat availability in the booking modal to avoid last-minute surcharges.",
        ],
      },
      {
        title: "Business / First",
        body: [
          "2 carry-ons (total 10kg).",
          "2 checked bags up to 32kg each, with complimentary priority tag.",
        ],
      },
      {
        title: "Special baggage",
        body: [
          "Strollers and wheelchairs travel free—contact support after submitting the order so we can note it.",
          "Sports gear or instruments require advance protection add-ons via the Services page.",
        ],
      },
    ],
    securityTitle: "Security & packing tips",
    securityTips: [
      "Power banks, lithium batteries, lighters, or alcohol must follow carry-on declaration rules.",
      "Liquids/aerosols/gels: max 100ml each, 1L total, packed in a 20×20cm clear bag.",
      "Sharp tools must be checked in sturdy luggage.",
      "Keep valuables and travel documents in your carry-on; you can update emergency contacts anytime in Profile.",
    ],
    alertTitle: "Important notices",
    alerts: [
      "Extra baggage purchased within 12 hours of departure triggers the 10% surge—plan early.",
      "Weather or tightened security can delay drop-off; arrive 120 minutes before departure.",
    ],
  },
} as const;

export default function BaggageGuidePage() {
  const { language } = useLanguage();
  const t = baggageI18n[language as keyof typeof baggageI18n] || baggageI18n["zh-CN"];

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
          {t.allowanceTitle}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {t.allowanceCards.map((card) => (
            <Card key={card.title} borderWidth="1px" borderColor="gray.100" boxShadow="sm" h="100%">
              <CardHeader>
                <Heading size="md">{card.title}</Heading>
              </CardHeader>
              <CardBody>
                <List spacing={3} color="gray.700">
                  {card.body.map((item) => (
                    <ListItem key={item}>
                      <ListIcon as={CheckCircleIcon} color="blue.500" />
                      {item}
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
          <Heading size="md">{t.securityTitle}</Heading>
        </CardHeader>
        <CardBody>
          <List spacing={3} color="gray.700">
            {t.securityTips.map((tip) => (
              <ListItem key={tip}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {tip}
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>

      <Card borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.alertTitle}</Heading>
        </CardHeader>
        <CardBody>
          <Stack spacing={3}>
            {t.alerts.map((alert) => (
              <Alert key={alert} status="warning" borderRadius="md">
                <AlertIcon as={WarningIcon} />
                <AlertDescription>{alert}</AlertDescription>
              </Alert>
            ))}
          </Stack>
        </CardBody>
      </Card>

      <Divider />
      <Text fontSize="sm" color="gray.500">
        * 若需更多托运或特种物品说明，请在“帮助中心”提交工单，客服会基于订单信息给出确认。
      </Text>
    </VStack>
  );
}









