"use client";

import {
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
import { CheckCircleIcon } from "@chakra-ui/icons";
import { useLanguage } from "@/context/LanguageContext";

const companyI18n = {
  "zh-CN": {
    heroTitle: "公司简介",
    heroSubtitle:
      "ZJC 航空是一家专注于数据驱动与乘客体验的智慧航空公司，覆盖 40+ 个城市航点，并与多家航司建立共享合作。",
    highlights: [
      {
        title: "核心优势",
        description:
          "依托实时航班调度系统与多维风控模型，确保准点与安全；通过一体化运营平台，为旅客提供从搜索到售后的一站式体验。",
        bullets: ["平均准点率 92%", "7×24 小时运行控制中心", "业内领先的票务风控模型"],
      },
      {
        title: "数字化能力",
        description:
          "深度整合乘机、订单、会员数据，打造智能票价引擎与个性化推荐体系，帮助乘客更快找到合适的航班与服务。",
        bullets: ["智能调价算法", "全链路服务监控", "多终端一致体验"],
      },
      {
        title: "服务承诺",
        description:
          "坚持“以乘客为中心”，制定透明票务政策，推行多语言客服与多渠道保障计划，让出行更安心。",
        bullets: ["多语种客服团队", "延误与退改保障", "会员积分生态"],
      },
    ],
    timelineTitle: "发展历程",
    timeline: [
      { year: "2018", text: "完成品牌创立，搭建首批公开航线" },
      { year: "2020", text: "自研售票与调度平台上线，实现国内 20 城覆盖" },
      { year: "2023", text: "上线智能客服与多语言支持，会员规模突破 200 万" },
      { year: "2025", text: "完成新一轮数字化升级，布局国际航线与全渠道运营" },
    ],
  },
  "en-US": {
    heroTitle: "Company Profile",
    heroSubtitle:
      "ZJC Airlines focuses on data-driven operations and premium passenger experience, covering 40+ destinations and partnering with major carriers.",
    highlights: [
      {
        title: "Core strengths",
        description:
          "Real-time operations control and multi-layered risk management keep flights punctual and safe, while an all-in-one booking platform delivers end-to-end service.",
        bullets: ["92% on-time performance", "24/7 operations center", "Industry-grade risk models"],
      },
      {
        title: "Digital capabilities",
        description:
          "We combine travel, order, and loyalty data to power smart pricing engines and personalized suggestions so travelers can find the right flight faster.",
        bullets: ["Adaptive pricing engine", "Full journey monitoring", "Consistent cross-platform UX"],
      },
      {
        title: "Service commitment",
        description:
          "Passenger-first policies, transparent fees, multilingual care, and proactive protection programs make every trip worry-free.",
        bullets: ["Multilingual support", "Delay & refund safeguards", "Loyalty ecosystem"],
      },
    ],
    timelineTitle: "Milestones",
    timeline: [
      { year: "2018", text: "Brand founded with the first batch of public routes" },
      { year: "2020", text: "In-house booking & ops platform launched, 20 cities covered" },
      { year: "2023", text: "Smart support & multilingual service released, 2M+ members" },
      { year: "2025", text: "Major digital upgrade and international network planning" },
    ],
  },
} as const;

export default function CompanyIntroPage() {
  const { language } = useLanguage();
  const t = companyI18n[language as keyof typeof companyI18n] || companyI18n["zh-CN"];

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
        {t.highlights.map((item) => (
          <Card key={item.title} borderWidth="1px" borderColor="gray.100" h="100%" boxShadow="sm">
            <CardHeader>
              <Heading size="md">{item.title}</Heading>
            </CardHeader>
            <CardBody>
              <Text color="gray.600" mb={4}>
                {item.description}
              </Text>
              <List spacing={2} color="gray.700">
                {item.bullets.map((bullet) => (
                  <ListItem key={bullet}>
                    <ListIcon as={CheckCircleIcon} color="blue.500" />
                    {bullet}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Box
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
        bg="white"
        boxShadow="sm"
        p={{ base: 6, md: 8 }}
      >
        <Heading size="md" mb={4}>
          {t.timelineTitle}
        </Heading>
        <Stack spacing={4}>
          {t.timeline.map((node) => (
            <Box key={node.year}>
              <Text fontWeight="bold" fontSize="lg">
                {node.year}
              </Text>
              <Text color="gray.600">{node.text}</Text>
              <Divider my={4} />
            </Box>
          ))}
        </Stack>
      </Box>
    </VStack>
  );
}









