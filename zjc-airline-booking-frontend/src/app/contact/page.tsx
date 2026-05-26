"use client";

import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Icon,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
} from "@chakra-ui/react";
import { PhoneIcon, EmailIcon, ChatIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ticketApi } from "@/lib/tickets";
import { getAuth } from "@/lib/auth";

type ContactCategory = "general" | "booking" | "payment" | "refund" | "other";

const contactI18n = {
  "zh-CN": {
    title: "联系客服",
    subtitle:
      "如果您在订票过程中遇到问题，欢迎通过以下方式与我们取得联系，或直接提交工单，我们会在 1 个工作日内答复。",
    hotlineTitle: "客服热线",
    hotlineDesc: "拨打人工客服，适用于紧急订单或支付问题。",
    phone: "400-800-1234",
    emailTitle: "客服邮箱",
    emailDesc: "发送邮件获取书面支持，我们将通过邮箱回复。",
    email: "support@zjc-air.com",
    liveTitle: "真人客服",
    liveDesc: "实时会话咨询，适合即时解答，一键进入。",
    liveButton: "进入聊天",
    ticketTitle: "提交工单",
    ticketSubtitle: "请描述您的问题和期望，我们会在 24 小时内反馈处理结果。",
    fields: {
      subject: "问题主题",
      contact: "联系方式",
      orderNo: "订单号（选填）",
      category: "问题类型",
      description: "问题描述",
      placeholder: "请详细描述问题、复现步骤或期望的解决方式",
    },
    categories: {
      general: "账户 / 资料",
      booking: "订票 / 改签",
      payment: "支付 / 钱包",
      refund: "退票 / 退款",
      other: "其他问题",
    },
    submit: "提交工单",
    submitting: "提交中...",
    toastSuccessTitle: "已收到您的工单",
    toastSuccessDesc: "客服会尽快与您联系，请保持电话畅通。",
    toastErrorTitle: "提交失败",
    toastErrorDesc: "请检查网络或稍后重试。",
    toastInvalidTitle: "请完善信息",
    toastInvalidDesc: "问题主题、联系方式和描述为必填项。",
  },
  "en-US": {
    title: "Contact Customer Service",
    subtitle:
      "Need help with booking? Reach us via the channels below or submit a ticket. We respond within one business day.",
    hotlineTitle: "Hotline",
    hotlineDesc: "Call an agent for urgent booking or payment issues.",
    phone: "400-800-1234",
    emailTitle: "Support email",
    emailDesc: "Send us the details and we’ll reply via email.",
    email: "support@zjc-air.com",
    liveTitle: "Live chat",
    liveDesc: "Start a real-time conversation for instant answers.",
    liveButton: "Start chat",
    ticketTitle: "Submit a ticket",
    ticketSubtitle:
      "Describe your question and expectations. We’ll respond within 24 hours.",
    fields: {
      subject: "Subject",
      contact: "Contact (phone or email)",
      orderNo: "Order No. (optional)",
      category: "Category",
      description: "Description",
      placeholder: "Describe the issue, steps to reproduce, or desired outcome.",
    },
    categories: {
      general: "Account / profile",
      booking: "Booking / reschedule",
      payment: "Payment / wallet",
      refund: "Refund / cancellation",
      other: "Other",
    },
    submit: "Submit ticket",
    submitting: "Submitting...",
    toastSuccessTitle: "Ticket received",
    toastSuccessDesc: "Our team will reach out soon. Please keep your phone available.",
    toastErrorTitle: "Submission failed",
    toastErrorDesc: "Please check your connection and try again.",
    toastInvalidTitle: "Please complete required fields",
    toastInvalidDesc: "Subject, contact, and description are mandatory.",
  },
} as const;

export default function ContactPage() {
  const router = useRouter();
  const toast = useToast();
  const { language } = useLanguage();
  const t = contactI18n[language] || contactI18n["zh-CN"];
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    subject: string;
    contact: string;
    orderNo: string;
    category: ContactCategory;
    description: string;
  }>({
    subject: "",
    contact: "",
    orderNo: "",
    category: "booking",
    description: "",
  });

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resolvePriority = (category: ContactCategory) => {
    if (category === "payment" || category === "refund") return "HIGH";
    if (category === "booking") return "NORMAL";
    return "LOW";
  };

  const formatContent = () => {
    const categoryLabel = t.categories[form.category];
    const orderText = form.orderNo.trim() || "未提供";
    return `${form.description.trim()}

问题类型：${categoryLabel}
联系方式：${form.contact.trim()}
订单号：${orderText}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.contact.trim() || !form.description.trim()) {
      toast({
        title: t.toastInvalidTitle,
        description: t.toastInvalidDesc,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const authInfo = getAuth();
      await ticketApi.submit({
        subject: form.subject.trim(),
        content: formatContent(),
        userName:
          authInfo?.realName ||
          authInfo?.fullName ||
          authInfo?.username ||
          form.contact.trim() ||
          "匿名用户",
        contactInfo: form.contact.trim(),
        priority: resolvePriority(form.category),
      });
      toast({
        title: t.toastSuccessTitle,
        description: t.toastSuccessDesc,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setForm({
        subject: "",
        contact: "",
        orderNo: "",
        category: "booking",
        description: "",
      });
    } catch (error: any) {
      toast({
        title: t.toastErrorTitle,
        description: error?.message || t.toastErrorDesc,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

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

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card borderRadius="lg" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <CardHeader>
            <HStack spacing={3}>
              <Icon as={PhoneIcon} color="blue.500" />
              <Heading size="md">{t.hotlineTitle}</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Text fontWeight="bold" fontSize="lg">
              {t.phone}
            </Text>
            <Text color="gray.600" mt={2}>
              {t.hotlineDesc}
            </Text>
          </CardBody>
        </Card>

        <Card borderRadius="lg" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <CardHeader>
            <HStack spacing={3}>
              <Icon as={EmailIcon} color="blue.500" />
              <Heading size="md">{t.emailTitle}</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Text fontWeight="bold" fontSize="lg">
              {t.email}
            </Text>
            <Text color="gray.600" mt={2}>
              {t.emailDesc}
            </Text>
          </CardBody>
        </Card>

        <Card borderRadius="lg" borderWidth="1px" borderColor="gray.100" boxShadow="sm">
          <CardHeader>
            <HStack spacing={3}>
              <Icon as={ChatIcon} color="blue.500" />
              <Heading size="md">{t.liveTitle}</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Text color="gray.600" mb={4}>
              {t.liveDesc}
            </Text>
            <Button colorScheme="blue" onClick={() => router.push("/contact/live")}>
              {t.liveButton}
            </Button>
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
        <Heading size="md" mb={2}>
          {t.ticketTitle}
        </Heading>
        <Text color="gray.600" mb={6}>
          {t.ticketSubtitle}
        </Text>

        <VStack as="form" spacing={4} align="stretch" onSubmit={handleSubmit}>
          <FormControl isRequired>
            <FormLabel>{t.fields.subject}</FormLabel>
            <Input value={form.subject} onChange={handleChange("subject")} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>{t.fields.contact}</FormLabel>
            <Input value={form.contact} onChange={handleChange("contact")} />
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>{t.fields.orderNo}</FormLabel>
              <Input value={form.orderNo} onChange={handleChange("orderNo")} />
            </FormControl>

            <FormControl>
              <FormLabel>{t.fields.category}</FormLabel>
              <Select value={form.category} onChange={handleChange("category")}>
                {Object.entries(t.categories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired>
            <FormLabel>{t.fields.description}</FormLabel>
            <Textarea
              rows={5}
              value={form.description}
              onChange={handleChange("description")}
              placeholder={t.fields.placeholder}
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={submitting}
            loadingText={t.submitting}
          >
            {t.submit}
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
}

