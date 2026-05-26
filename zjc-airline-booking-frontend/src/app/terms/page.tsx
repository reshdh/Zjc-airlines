"use client";

import { Box, Heading, Text, VStack, List, ListItem, ListIcon } from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { useLanguage } from "@/context/LanguageContext";

const termsI18n = {
  "zh-CN": {
    title: "使用条款",
    intro:
      "欢迎使用 ZJC 航空公司机票预订系统（以下简称“本系统”）。在使用本系统前，请您仔细阅读并充分理解本使用条款。一旦您访问或使用本系统，即视为您已同意本条款的全部内容。",
    sections: [
      {
        heading: "一、服务说明",
        list: [
          "本系统提供航班查询、机票预订、订单管理等与航空出行相关的在线服务。",
          "部分功能可能需要您完成注册并进行实名认证后方可使用。",
        ],
      },
      {
        heading: "二、用户责任",
        list: [
          "您应保证所填写的个人信息真实、准确、完整，并及时更新，以保证预订信息的有效性。",
          "您需妥善保管账户与密码信息，不得将账户转让或出借给他人使用。",
          "通过本系统提交的任何订单，应在规定时间内完成支付或取消操作，否则系统有权自动取消订单。",
        ],
      },
      {
        heading: "三、系统使用规范",
        list: [
          "您承诺不利用本系统从事任何违法违规或损害他人合法权益的行为。",
          "未经授权，禁止对本系统进行逆向工程、扫描漏洞、批量抓取数据等行为。",
        ],
      },
      {
        heading: "四、免责声明",
        description:
          "我们将尽力保证本系统的稳定、安全与准确，但受网络环境、第三方服务等因素影响，本系统可能存在服务中断、数据延迟或其他问题。对于因不可抗力或非主观过错导致的损失，我们不承担法律责任。",
      },
      {
        heading: "五、条款变更",
        description:
          "我们可能根据业务发展或法律法规变化适时更新本使用条款。更新后的条款将在本页面公布并即时生效，您继续使用本系统即视为接受更新后的条款。",
      },
    ],
    note: "本使用条款为示例文本，可根据实际业务规则和法律要求进行完善与调整。",
  },
  "en-US": {
    title: "Terms of Use",
    intro:
      'Welcome to the ZJC Airline booking system ("the Service"). Please read these terms carefully before using the Service. By accessing or using it, you agree to be bound by the Terms.',
    sections: [
      {
        heading: "1. Service description",
        list: [
          "The Service provides flight search, ticket booking, order management, and other travel-related features.",
          "Some functions require registration and identity verification before use.",
        ],
      },
      {
        heading: "2. User responsibilities",
        list: [
          "You must ensure the information you submit is truthful, accurate, and kept up to date for booking purposes.",
          "Keep your account credentials secure and do not transfer or lend your account to others.",
          "Complete payment or cancellation within the required timeframe; otherwise the system may cancel the order automatically.",
        ],
      },
      {
        heading: "3. Acceptable use",
        list: [
          "You agree not to use the Service for illegal activities or to infringe the rights of others.",
          "Reverse engineering, vulnerability scanning, or large-scale scraping without authorization is prohibited.",
        ],
      },
      {
        heading: "4. Disclaimer",
        description:
          "We strive to keep the Service stable, secure, and accurate. However, factors such as network conditions or third-party services may cause interruptions or delays. We are not liable for losses caused by force majeure or events beyond our control.",
      },
      {
        heading: "5. Changes to these terms",
        description:
          "We may update the Terms as business or regulatory needs evolve. Updates take effect once published here. Continued use of the Service means you accept the revised Terms.",
      },
    ],
    note: "This document is a sample and should be adapted to actual business rules and legal requirements.",
  },
} as const;

export default function TermsPage() {
  const { language } = useLanguage();
  const t = termsI18n[language] || termsI18n["zh-CN"];

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
            {section.list && (
              <List spacing={1} color="gray.700" mb={section.description ? 2 : 0}>
                {section.list.map((item) => (
                  <ListItem key={item}>
                    <ListIcon as={CheckCircleIcon} color="blue.500" />
                    {item}
                  </ListItem>
                ))}
              </List>
            )}
            {section.description && <Text color="gray.700">{section.description}</Text>}
          </Box>
        ))}

        <Text mt={4} color="gray.500" fontSize="sm">
          {t.note}
        </Text>
      </VStack>
    </Box>
  );
}