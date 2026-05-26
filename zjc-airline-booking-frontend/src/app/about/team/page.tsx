"use client";

import {
  Avatar,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useLanguage } from "@/context/LanguageContext";

const teamI18n = {
  "zh-CN": {
    heroTitle: "团队介绍",
    heroSubtitle:
      "我们是一支由飞行运行、产品研发、客户服务与数据科学专家组成的多元化团队，共同打造可信赖的航空出行体验。",
    groups: [
      {
        title: "管理与运营团队",
        description:
          "负责航线规划、运行控制与安全管理，确保每一个航班都按标准执行。",
        members: [
          { name: "运营负责人", role: "首席运营官", bio: "统筹航班编排与即时调度，保障准点率。" },
          { name: "安全负责人", role: "安全总监", bio: "负责运行风险管控与突发事件演练，确保航班安全闭环。" },
          { name: "Liam Chen", role: "运营顾问", bio: "具备国际航司背景，协助落地运行标准。"},
        ],
      },
      {
        title: "产品与技术团队",
        description:
          "专注于售票系统、智能推荐、支付与风控等核心产品能力的迭代。",
        members: [
          { name: "产品负责人", role: "产品负责人", bio: "主持跨端体验优化与业务流程重构。" },
          { name: "技术负责人", role: "技术负责人", bio: "主导架构升级与接口治理，兼顾性能与稳定。" },
          { name: "数据负责人", role: "数据科学家", bio: "负责客座率预测、定价算法与风控模型。" },
        ],
      },
      {
        title: "客户与服务团队",
        description:
          "通过多语言客服、机场协同与增值服务，为旅客提供细致周到的支持。",
        members: [
          { name: "客服负责人", role: "客服主管", bio: "结合数据洞察优化 7×24 小时客服策略。" },
          { name: "体验负责人", role: "旅客体验经理", bio: "把控地面协同流程，强化安检与服务衔接。" },
          { name: "运营经理", role: "运营经理", bio: "负责系统与地服联动，确保信息同步。" },
        ],
      },
    ],
  },
  "en-US": {
    heroTitle: "Our Team",
    heroSubtitle:
      "Operations veterans, product builders, service experts, and data scientists collaborate at ZJC to deliver dependable journeys.",
    groups: [
      {
        title: "Operations & Safety",
        description:
          "Route planners, ops controllers, and safety specialists safeguard every departure.",
        members: [
          { name: "Operations Lead", role: "Chief Operations Officer", bio: "Leads roster planning and real-time dispatch." },
          { name: "Safety Lead", role: "Safety Director", bio: "Owns risk control drills and incident response playbooks." },
          { name: "Liam Chen", role: "Operations Advisor", bio: "Brings international carrier experience to our standards." },
        ],
      },
      {
        title: "Product & Technology",
        description:
          "Product builders and engineers iterate booking, seating, payment, and risk modules.",
        members: [
          { name: "Product Lead", role: "Product Lead", bio: "Owns cross-platform ticketing flows and UX consistency." },
          { name: "Engineering Lead", role: "Engineering Lead", bio: "Drives architecture modernization and API governance." },
          { name: "Data Lead", role: "Data Scientist", bio: "Builds load forecasting, pricing, and risk models." },
        ],
      },
      {
        title: "Customer Experience",
        description:
          "Multilingual support, airport partners, and premium programs deliver attentive care.",
        members: [
          { name: "Support Lead", role: "Support Lead", bio: "Uses insights to refine the 24/7 omnichannel center." },
          { name: "Experience Lead", role: "Experience Manager", bio: "Aligns ground ops and checkpoints for seamless journeys." },
          { name: "Ops Manager", role: "Operations Manager", bio: "Keeps ground teams, admins, and systems in sync." },
        ],
      },
    ],
  },
} as const;

export default function TeamIntroPage() {
  const { language } = useLanguage();
  const t = teamI18n[language as keyof typeof teamI18n] || teamI18n["zh-CN"];

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

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {t.groups.map((group) => (
          <Card key={group.title} borderWidth="1px" borderColor="gray.100" boxShadow="sm">
            <CardHeader>
              <Heading size="md">{group.title}</Heading>
              <Text color="gray.600" mt={2}>
                {group.description}
              </Text>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                {group.members.map((member) => (
                  <Box
                    key={`${group.title}-${member.name}`}
                    borderWidth="1px"
                    borderColor="gray.100"
                    borderRadius="lg"
                    p={4}
                  >
                    <Wrap spacing={4} align="center">
                      <WrapItem>
                        <Avatar name={member.name} src={member.photo ? encodeURI(member.photo) : undefined} />
                      </WrapItem>
                      <WrapItem flex="1" minW="0">
                        <Box>
                          <Text fontWeight="bold">{member.name}</Text>
                          <Text fontSize="sm" color="blue.500">
                            {member.role}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            {member.bio}
                          </Text>
                        </Box>
                      </WrapItem>
                    </Wrap>
                  </Box>
                ))}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
