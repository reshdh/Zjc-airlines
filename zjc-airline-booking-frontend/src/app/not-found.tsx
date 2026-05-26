"use client";

import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const notFoundI18n = {
  "zh-CN": {
    title: "页面未找到",
    description: "您访问的页面不存在，或已经被移动。",
    action: "返回首页",
  },
  "en-US": {
    title: "Page not found",
    description: "The page you requested does not exist or has been moved.",
    action: "Back to home",
  },
} as const;

export default function NotFound() {
  const { language } = useLanguage();
  const t = notFoundI18n[language] || notFoundI18n["zh-CN"];

  return (
    <Box py={24} textAlign="center">
      <VStack spacing={6}>
        <Heading size="lg">{t.title}</Heading>
        <Text color="gray.600">{t.description}</Text>
        <Button as={Link} href="/" colorScheme="blue">
          {t.action}
        </Button>
      </VStack>
    </Box>
  );
}
