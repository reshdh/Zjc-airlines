"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { useLanguage } from "@/context/LanguageContext";

const privacyI18n = {
  "zh-CN": {
    title: "隐私政策",
    intro:
      "欢迎使用 ZJC 航空公司机票预订系统（以下简称“本系统”）。我们非常重视您的个人信息和隐私保护，本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。",
    sections: [
      {
        heading: "一、我们收集的信息",
        description: "在您使用本系统的过程中，我们可能会收集以下类型的信息：",
        list: [
          "身份信息：姓名、身份证号等用于实名购票的信息。",
          "联系方式：手机号码、邮箱地址、通讯地址等，用于联系及行程通知。",
          "账号信息：用户名、登录记录、订单记录等。",
          "设备与日志信息：IP 地址、浏览器类型、访问时间等，用于系统安全和服务优化。",
        ],
      },
      {
        heading: "二、我们如何使用您的信息",
        list: [
          "为您提供机票查询、预订、支付、订单管理等核心功能。",
          "向您发送订单通知、行程提醒、服务变更等重要信息。",
          "保障系统安全运行，进行故障排查、数据分析与性能优化。",
        ],
      },
      {
        heading: "三、信息的存储与保护",
        description:
          "我们会采取合理可行的安全防护措施保护您的个人信息安全，防止信息被未经授权的访问、使用或泄露。除法律法规另有规定或取得您的授权外，我们不会向无关第三方公开或提供您的个人信息。",
      },
      {
        heading: "四、您的权利",
        description: "您对自己的个人信息享有以下权利：",
        list: [
          "查询与更正：您可以在“个人中心”中查看或修改部分个人信息。",
          "注销账号：如您不再使用本系统，可联系我们申请注销账号。",
        ],
      },
      {
        heading: "五、联系我们",
        description:
          "如果您对本隐私政策有任何疑问、意见或建议，欢迎通过系统中的反馈渠道与我们联系，我们会尽快予以回复。",
      },
    ],
    note: "本隐私政策为示例文本，可根据实际业务和法律要求进行完善与调整。",
  },
  "en-US": {
    title: "Privacy Policy",
    intro:
      'Welcome to the ZJC Airline booking system ("the Service"). We value your privacy. This policy explains how we collect, use, store, and protect your personal information.',
    sections: [
      {
        heading: "1. Information we collect",
        description:
          "When you use the Service, we may collect the following types of information:",
        list: [
          "Identity information: name, ID/passport number and other details required for real-name ticketing.",
          "Contact details: phone number, email address, mailing address for trip notifications.",
          "Account data: username, login history, booking records, wallet balance.",
          "Device & log data: IP address, browser type, access time, used for security and optimization.",
        ],
      },
      {
        heading: "2. How we use your information",
        list: [
          "Provide flight search, booking, payment, and order management features.",
          "Send booking notifications, travel reminders, and critical service updates.",
          "Maintain system security, troubleshoot issues, analyze data, and improve performance.",
        ],
      },
      {
        heading: "3. Storage and protection",
        description:
          "We adopt reasonable safeguards to prevent unauthorized access, use, or disclosure of your data. We do not share your personal information with unrelated third parties unless required by law or authorized by you.",
      },
      {
        heading: "4. Your rights",
        description: "You have the following rights regarding your personal data:",
        list: [
          "Access & correction: review or update certain information in your Profile.",
          "Account deletion: request account removal if you no longer use the Service.",
        ],
      },
      {
        heading: "5. Contact us",
        description:
          "For any questions, comments, or suggestions about this policy, please reach us via the in-app feedback channel. We will respond as soon as possible.",
      },
    ],
    note: "This privacy notice is a sample and should be refined according to actual business and legal requirements.",
  },
} as const;

export default function PrivacyPage() {
  const { language } = useLanguage();
  const t = privacyI18n[language] || privacyI18n["zh-CN"];

  return (
    <Box maxW="800px" mx="auto" py={10} px={6}>
      <Heading size="lg" mb={4}>
        {t.title}
      </Heading>
      <Text color="gray.600" mb={6}>
        {t.intro}
      </Text>

      <VStack align="stretch" spacing={5}>
        {t.sections.map((section) => (
          <Box key={section.heading}>
            <Heading size="md" mb={2}>
              {section.heading}
            </Heading>
            {section.description && (
              <Text color="gray.700" mb={section.list ? 2 : 0}>
                {section.description}
              </Text>
            )}
            {section.list && (
              <List spacing={1} color="gray.700">
                {section.list.map((item) => (
                  <ListItem key={item}>
                    <ListIcon as={CheckCircleIcon} color="blue.500" />
                    {item}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}

        <Text mt={4} color="gray.500" fontSize="sm">
          {t.note}
        </Text>
      </VStack>
    </Box>
  );
}