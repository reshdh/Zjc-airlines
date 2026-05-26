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
import { useLanguage } from "@/context/LanguageContext";

const careersI18n = {
  "zh-CN": {
    heroTitle: "加入我们",
    heroSubtitle:
      "与 ZJC 航空一起重新定义智慧航空。我们欢迎热爱出行产业、擅长数据与产品创新的你，共同为旅客提供可信赖的服务。",
    valuesTitle: "我们倡导的文化",
    values: [
      "以乘客价值为先，快速响应一线反馈",
      "数据驱动迭代，勇于尝试与复盘",
      "跨团队协作，尊重专业与多元背景",
      "关注成长，提供导师制与学习预算",
    ],
    openingsTitle: "热招岗位",
    openings: [
      {
        title: "高级前端工程师",
        location: "上海 · 混合办公",
        tags: ["React", "Next.js", "Design System"],
        summary: "负责乘客端与运营端页面的体验优化与性能治理。",
      },
      {
        title: "航班运行数据分析师",
        location: "北京 · 全职",
        tags: ["Python", "AirOps", "Forecast"],
        summary: "构建航班预测模型，支撑排班、调价与运控策略。",
      },
      {
        title: "资深客户体验经理",
        location: "成都 · 全职",
        tags: ["Service Design", "CX", "Multi-language"],
        summary: "设计全渠道服务流程，打造更具温度的客服体系。",
      },
    ],
    applyCta: "投递简历",
  },
  "en-US": {
    heroTitle: "Careers at ZJC",
    heroSubtitle:
      "Help us reinvent smarter air travel. We welcome builders, analysts, and service professionals who care about passengers as much as we do.",
    valuesTitle: "Our culture",
    values: [
      "Passenger-centric decisions with fast feedback loops",
      "Data-informed experiments and honest retrospectives",
      "Cross-functional collaboration and respect for expertise",
      "Investing in personal growth with mentors and learning budgets",
    ],
    openingsTitle: "Open roles",
    openings: [
      {
        title: "Senior Frontend Engineer",
        location: "Shanghai · Hybrid",
        tags: ["React", "Next.js", "Design System"],
        summary: "Own passenger- and ops-facing experiences with performance excellence.",
      },
      {
        title: "Flight Operations Data Analyst",
        location: "Beijing · Full-time",
        tags: ["Python", "AirOps", "Forecast"],
        summary: "Model forecasts that power scheduling, pricing, and control decisions.",
      },
      {
        title: "Customer Experience Lead",
        location: "Chengdu · Full-time",
        tags: ["Service Design", "CX", "Multi-language"],
        summary: "Design omnichannel support journeys with warmth and reliability.",
      },
    ],
    applyCta: "Apply now",
  },
} as const;

export default function CareersPage() {
  const { language } = useLanguage();
  const t = careersI18n[language as keyof typeof careersI18n] || careersI18n["zh-CN"];

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

      <Card borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.valuesTitle}</Heading>
        </CardHeader>
        <CardBody>
          <List spacing={3} color="gray.700">
            {t.values.map((value) => (
              <ListItem key={value}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {value}
              </ListItem>
            ))}
          </List>
        </CardBody>
      </Card>

      <Box>
        <Heading size="md" mb={4}>
          {t.openingsTitle}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {t.openings.map((opening) => (
            <Card key={opening.title} borderWidth="1px" borderColor="gray.100" boxShadow="sm" h="100%">
              <CardHeader>
                <Heading size="md">{opening.title}</Heading>
                <Text color="gray.500" mt={1}>
                  {opening.location}
                </Text>
              </CardHeader>
              <CardBody display="flex" flexDirection="column" gap={4}>
                <Stack direction="row" flexWrap="wrap" gap={2}>
                  {opening.tags.map((tag) => (
                    <Badge key={tag} colorScheme="teal">
                      {tag}
                    </Badge>
                  ))}
                </Stack>
                <Text color="gray.600" flex="1">
                  {opening.summary}
                </Text>
                <Button
                  rightIcon={<ArrowForwardIcon />}
                  colorScheme="blue"
                  variant="outline"
                  alignSelf="flex-start"
                >
                  {t.applyCta}
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
}









