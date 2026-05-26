"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Button,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Link,
} from "@chakra-ui/react";
import { CheckCircleIcon, EmailIcon, PhoneIcon, InfoIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const helpI18n = {
  "zh-CN": {
    title: "帮助中心",
    subtitle: "在这里可以快速了解常见问题、联系客服或提交反馈，确保您的订票体验顺畅安心。",
    guideTitle: "使用指南",
    guideSteps: [
      "注册并完善实名信息，确保可正常订票",
      "通过“航班信息”搜索航班后提交订单",
      "在“我的订票单”查看订单并及时支付",
      "个人资料及近期订单可在“个人中心”查看",
    ],
    contactTitle: "联系客服",
    contactItems: {
      phone: "客服热线：400-800-1234（09:00-21:00）",
      email: "邮箱：support@zjc-air.com",
      online: "在线客服：工作日 10:00-18:00",
    },
    contactButton: "联系客服",
    faqTitle: "常见问题",
    faqs: [
      {
        question: "如何查询航班并完成订票？",
        answer:
          "登录后进入“航班信息”页面，选择出发地、目的地和日期进行搜索，在结果中选择航班并点击“立即预订”，填写订票数量后提交即可生成订单。",
      },
      {
        question: "注册时需要填写哪些信息？",
        answer:
          "根据实名要求，注册表单需填写用户名、密码、旅客姓名、身份证号、联系电话、通讯地址等信息，请确保与证件一致。",
      },
      {
        question: "订单状态“待支付 / 已出票 / 已取消”代表什么？",
        answer:
          "“待支付”表示订单已生成但尚未完成支付；“已出票”代表支付完成且座位已锁定；“已取消”为用户主动取消或超时未支付的订单。",
      },
      {
        question: "如何修改或取消订单？",
        answer:
          "当前版本支持在“我的订票单”中查看订单并申请取消。若需要改签或其它特殊处理，请联系客服，由人工协助完成。",
      },
      {
        question: "登录后仍看不到个人信息或订单？",
        answer:
          "请确认浏览器未禁用本地存储，并确保使用的是注册时的账号。若问题仍存在，可尝试重新登录或联系技术支持。",
      },
    ],
    ctaTitle: "找不到答案？",
    ctaTextPrefix: "您可以前往",
    ctaLink: "我的订票单",
    ctaTextSuffix: "查找订单详情，或提交问题，我们会尽快反馈。",
    ctaSecondary: "返回航班查询",
    ctaPrimary: "提交工单",
  },
  "en-US": {
    title: "Help Center",
    subtitle:
      "Learn about common issues, reach customer service, or submit feedback so every booking stays smooth.",
    guideTitle: "Quick guide",
    guideSteps: [
      "Register and complete identity info to enable ticketing",
      "Search flights on the Flights page and submit orders",
      "Track and pay orders under My Bookings",
      "Review personal info and recent orders in Profile",
    ],
    contactTitle: "Contact support",
    contactItems: {
      phone: "Hotline: 400-800-1234 (09:00-21:00)",
      email: "Email: support@zjc-air.com",
      online: "Live chat: Weekdays 10:00-18:00",
    },
    contactButton: "Contact support",
    faqTitle: "FAQs",
    faqs: [
      {
        question: "How do I search flights and place an order?",
        answer:
          "Sign in, open the Flights page, choose origin, destination and date, then select a flight, click Book now, set ticket count, and submit to create an order.",
      },
      {
        question: "What info is required during registration?",
        answer:
          "Provide username, password, passenger name, ID number, phone, and mailing address to comply with real-name rules. Make sure they match your documents.",
      },
      {
        question: "What do the statuses Pending / Ticketed / Cancelled mean?",
        answer:
          "Pending means the order exists but payment is incomplete; Ticketed means payment succeeded and seats are locked; Cancelled means you cancelled or payment expired.",
      },
      {
        question: "How can I modify or cancel an order?",
        answer:
          "Use the My Bookings page to see orders and request cancellation. For rescheduling or special cases, contact support for manual assistance.",
      },
      {
        question: "Why can't I see my profile or orders after logging in?",
        answer:
          "Ensure your browser allows local storage and you're using the correct account. If issues persist, try signing in again or contact technical support.",
      },
    ],
    ctaTitle: "Still need help?",
    ctaTextPrefix: "Go to",
    ctaLink: "My Bookings",
    ctaTextSuffix:
      "to view order details, or submit a ticket and we'll reply shortly.",
    ctaSecondary: "Back to flights",
    ctaPrimary: "Submit a ticket",
  },
} as const;

export default function HelpPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = helpI18n[language] || helpI18n["zh-CN"];

  return (
    <VStack spacing={8} align="stretch">
      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="md"
      >
        <Heading size="lg" mb={2}>
          {t.title}
        </Heading>
        <Text color="gray.600">{t.subtitle}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card borderRadius="lg" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <CardHeader>
            <Heading size="md">{t.guideTitle}</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={3}>
              {t.guideSteps.map((step) => (
                <ListItem key={step}>
                  <ListIcon as={CheckCircleIcon} color="green.500" />
                  {step}
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>

        <Card borderRadius="lg" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <CardHeader>
            <Heading size="md">{t.contactTitle}</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <HStack>
                <PhoneIcon color="blue.500" />
                <Text>{t.contactItems.phone}</Text>
              </HStack>
              <HStack>
                <EmailIcon color="blue.500" />
                <Text>{t.contactItems.email}</Text>
              </HStack>
              <HStack>
                <InfoIcon color="blue.500" />
                <Text>{t.contactItems.online}</Text>
              </HStack>
              <Button
                colorScheme="blue"
                onClick={() => router.push("/contact/live")}
              >
                {t.contactButton}
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box
        p={6}
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="sm"
      >
        <Heading size="md" mb={4}>
          {t.faqTitle}
        </Heading>
        <Accordion allowMultiple>
          {t.faqs.map((item, index) => (
            <AccordionItem key={item.question} border="none">
              <AccordionButton
                borderRadius="md"
                _hover={{ bg: "gray.50" }}
                px={4}
                py={3}
              >
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  {index + 1}. {item.question}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} color="gray.600">
                {item.answer}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Box>

      <Card borderRadius="xl" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
        <CardHeader>
          <Heading size="md">{t.ctaTitle}</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.600" mb={4}>
            {t.ctaTextPrefix}
            <Link as={NextLink} href="/bookings" color="blue.500" mx={1}>
              {t.ctaLink}
            </Link>
            {t.ctaTextSuffix}
          </Text>
          <HStack spacing={3}>
            <Button variant="outline" onClick={() => router.push("/flights")}>
              {t.ctaSecondary}
            </Button>
            <Button colorScheme="blue" onClick={() => router.push("/contact")}>
              {t.ctaPrimary}
            </Button>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

