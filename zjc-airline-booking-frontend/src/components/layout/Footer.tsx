"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Flex,
  Link,
  Text,
  Stack,
  SimpleGrid,
  Divider,
  Image,
} from "@chakra-ui/react";
import { useLanguage } from "@/context/LanguageContext";

const INFO_LINKS = [
  {
    titleKey: "about",
    items: [
      { key: "companyIntro", href: "/about/company" },
      { key: "team", href: "/about/team" },
      { key: "careers", href: "/about/careers" },
    ],
  },
  {
    titleKey: "guide",
    items: [
      { key: "bookingProcess", href: "/guide/booking" },
      { key: "baggage", href: "/guide/baggage" },
      { key: "services", href: "/guide/services" },
    ],
  },
];

const POLICY_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
];

const footerI18n = {
  "zh-CN": {
    brand: "ZJC 航空出行",
    description: "致力于为旅客提供便捷、安全、专业的在线机票预订与出行服务，让每一次飞行都感到安心。",
    sections: {
      about: "关于我们",
      guide: "出行指南",
      legal: "法律与条款",
      follow: "关注我们",
    },
    links: {
      companyIntro: "公司简介",
      team: "团队介绍",
      careers: "加入我们",
      bookingProcess: "购票流程",
      baggage: "行李与安全",
      services: "航班服务",
      privacy: "隐私政策",
      terms: "使用条款",
    },
    wechat: "微信公众号",
    qrCaption: "扫码关注 ZJC 航空",
    copyright: "© 2025 ZJC 航空出行 · 航空订票系统 版权所有",
  },
  "en-US": {
    brand: "ZJC Airlines Travel",
    description:
      "We provide convenient, safe and professional online ticket booking services so that every flight feels assured.",
    sections: {
      about: "About Us",
      guide: "Travel Guide",
      legal: "Legal & Terms",
      follow: "Follow Us",
    },
    links: {
      companyIntro: "Company",
      team: "Our Team",
      careers: "Careers",
      bookingProcess: "Booking Guide",
      baggage: "Baggage & Safety",
      services: "Flight Services",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
    },
    wechat: "WeChat",
    qrCaption: "Scan to follow ZJC Airlines",
    copyright: "© 2025 ZJC Airlines · Booking System. All rights reserved.",
  },
} as const;

export function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const { language } = useLanguage();
  const t = footerI18n[language as keyof typeof footerI18n] || footerI18n["zh-CN"];

  return (
    <Box
      as="footer"
      mt={isAuthPage ? 2 : 4}
      bg="gray.100"
      color="gray.800"
    >
      <Box
        maxW="1200px"
        mx="auto"
        px={{ base: 6, md: 10 }}
        py={isAuthPage ? 2 : 8}
      >
        {!isAuthPage && (
          <>
        <SimpleGrid columns={{ base: 1, md: 6 }} spacing={10}>
          <Stack spacing={3} pr={{ md: 4 }}>
            <Text fontSize="lg" fontWeight="bold" color="gray.900">
              {t.brand}
            </Text>
            <Text fontSize="sm" color="gray.600" lineHeight="1.8">
              {t.description}
            </Text>
          </Stack>

          {/* 中间竖线 */}
          <Flex
            display={{ base: "none", md: "flex" }}
            justify="center"
            align="stretch"
          >
            <Box
              borderLeft="1px solid"
              borderColor="gray.300"
              height="100%"
            />
          </Flex>

          {INFO_LINKS.map((section) => (
            <Stack key={section.titleKey} spacing={3}>
            <Text fontWeight="bold" color="gray.900">
                {t.sections[section.titleKey as keyof typeof t.sections]}
            </Text>
            <Stack spacing={2} fontSize="sm" color="gray.600">
                {section.items.map((item) => (
                <Link
                    key={item.key}
                  as={NextLink}
                  href={item.href}
                  _hover={{ color: "blue.600" }}
                >
                    {t.links[item.key as keyof typeof t.links]}
                </Link>
              ))}
            </Stack>
          </Stack>
          ))}

          <Stack spacing={3}>
            <Text fontWeight="bold" color="gray.900">
              {t.sections.legal}
            </Text>
            <Stack spacing={2} fontSize="sm" color="gray.600">
              {POLICY_LINKS.map((item) => (
                <Link
                  key={item.key}
                  as={NextLink}
                  href={item.href}
                  _hover={{ color: "blue.600" }}
                >
                  {t.links[item.key as keyof typeof t.links]}
                </Link>
              ))}
            </Stack>
          </Stack>

          <Stack spacing={3} position="relative" align="flex-start">
            <Text fontWeight="bold" color="gray.900">
              {t.sections.follow}
            </Text>
            <Box role="group" position="relative" fontSize="sm" color="gray.700">
              {t.wechat}
              <Box
                position="absolute"
                top="calc(100% + 12px)"
                left="50%"
                transform="translateX(-50%)"
                bg="white"
                borderRadius="md"
                boxShadow="lg"
                p={3}
                opacity={0}
                pointerEvents="none"
                transition="opacity 0.2s ease"
                _groupHover={{ opacity: 1 }}
                zIndex={10}
              >
                <Box
                  width="140px"
                  height="140px"
                  borderRadius="md"
                  overflow="hidden"
              >
                <Image
                    src="/globe.svg"
                    alt="QR code"
                    width="100%"
                    height="100%"
                  objectFit="cover"
                />
                </Box>
                <Text mt={2} fontSize="xs" color="gray.500" textAlign="center">
                  {t.qrCaption}
                </Text>
              </Box>
            </Box>
          </Stack>
        </SimpleGrid>

        <Divider borderColor="gray.200" my={8} />
          </>
        )}

        <Flex
          justify="center"
          align="center"
          fontSize="sm"
          color="gray.600"
        >
          <Text textAlign="center">{t.copyright}</Text>
        </Flex>
      </Box>
    </Box>
  );
}
