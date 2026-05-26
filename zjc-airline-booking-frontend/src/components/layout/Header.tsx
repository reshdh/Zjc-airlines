"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Flex,
  HStack,
  Tabs,
  TabList,
  Tab,
  Button,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import { getAuth, clearAuth, isAuthenticated, UserInfo } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { CityPicker } from "@/components/common/CityPicker";

const navItems = [
  { key: "home", href: "/" },
  { key: "flights", href: "/flights" },
  { key: "admin", href: "/admin", role: "ADMIN", requiresAuth: true },
  { key: "help", href: "/help" },
];

const i18n = {
  "zh-CN": {
    logo: "ZJC 航空公司",
    nav: {
      home: "首页",
      flights: "航班信息",
      admin: "管理员面板",
      help: "帮助",
    },
    searchPlaceholder: "搜索目的地城市",
    search: "搜索",
    login: "登录",
    register: "注册",
    myBookings: "我的订票单",
    supportTickets: "我的工单",
    profile: "个人中心",
    adminPanel: "管理员面板",
    logout: "退出登录",
    tooltip: "切换到英文",
  },
  "en-US": {
    logo: "ZJC Airlines",
    nav: {
      home: "Home",
      flights: "Flights",
      admin: "Admin Panel",
      help: "Help",
    },
    searchPlaceholder: "Search destination",
    search: "Search",
    login: "Log In",
    register: "Sign Up",
    myBookings: "My Bookings",
    supportTickets: "Support Tickets",
    profile: "Profile",
    adminPanel: "Admin Panel",
    logout: "Log Out",
    tooltip: "Switch to Chinese",
  },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const t = i18n[language as keyof typeof i18n] || i18n["zh-CN"];

  useEffect(() => {
    // 客户端检查登录状态
    const auth = getAuth();
    setUserInfo(auth);
    setIsLoggedIn(isAuthenticated());
  }, [pathname]); // 当路径变化时重新检查（登录后跳转）

  const handleLogout = () => {
    clearAuth();
    setUserInfo(null);
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  const isAdmin = userInfo?.role === "ADMIN" || userInfo?.role === "admin";
  const isAdminRoute = pathname?.startsWith("/admin");
  const activeIndex = navItems.findIndex((item) => item.href === pathname);

  const handleSearch = () => {
    const keyword = searchValue.trim();
    if (!keyword) {
      router.push("/flights");
      return;
    }
    router.push(`/flights?to=${encodeURIComponent(keyword)}`);
  };

  if (isAdminRoute) {
  return (
    <Box as="header" borderBottomWidth="1px" borderColor="gray.100" bg="white">
      <Flex
        maxW="1240px"
        mx="auto"
        px={6}
        py={4}
        align="center"
          justify="space-between"
      >
          <HStack spacing={3}>
          <Image
              src="/globe.svg"
            alt="ZJC Airline Logo"
            width={48}
            height={48}
            style={{ borderRadius: 8 }}
          />
          <Box fontWeight="bold" fontSize="lg">
              {t.logo}
            </Box>
          </HStack>

          {isLoggedIn ? (
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                colorScheme="blue"
                rightIcon={<ChevronDownIcon />}
              >
                <HStack spacing={2}>
              <Text>{userInfo?.username || (language === "zh-CN" ? "用户" : "User")}</Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={handleLogout} color="red.500">
                  {t.logout}
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <HStack spacing={2}>
              <Button size="sm" variant="outline" colorScheme="blue" as={Link} href="/login">
                {t.login}
              </Button>
              <Button size="sm" colorScheme="blue" as={Link} href="/register">
                {t.register}
              </Button>
            </HStack>
          )}
        </Flex>
      </Box>
    );
  }

  return (
    <Box as="header" borderBottomWidth="1px" borderColor="gray.100" bg="white">
      <Flex
        maxW="1240px"
        mx="auto"
        px={{ base: 4, md: 4, lg: 6 }}
        py={4}
        align="center"
        gap={{ base: 2, md: 2, lg: 4 }}
        direction={{ base: "column", md: "row" }}
        wrap={{ base: "wrap", md: "nowrap" }}
        overflow="hidden"
      >
        <HStack spacing={{ base: 2, md: 2, lg: 3 }} flexShrink={0}>
          <Image
            src="/globe.svg"
            alt="ZJC Airline Logo"
            width={48}
            height={48}
            style={{ 
              borderRadius: 8, 
              flexShrink: 0,
              width: "clamp(40px, 4vw, 48px)",
              height: "clamp(40px, 4vw, 48px)"
            }}
          />
          <Box 
            fontWeight="bold" 
            fontSize={{ base: "sm", md: "md", lg: "lg" }} 
            whiteSpace="nowrap"
            flexShrink={0}
          >
            {t.logo}
          </Box>
        </HStack>

        <Tabs
          index={activeIndex === -1 ? 0 : activeIndex}
          variant="enclosed"
          size="sm"
          flex="1"
          display={{ base: "none", md: "block" }}
          width={{ base: "100%", md: "auto" }}
          minW={0}
          overflow="visible"
        >
          <TabList 
            gap={{ base: 0, md: 0.5, lg: 1 }} 
            flexWrap="nowrap" 
            overflow="visible"
            justifyContent="flex-start"
          >
            {navItems.map((item) => {
              if (item.role === "ADMIN" && !isAdmin) {
                return null;
              }
              if (!isLoggedIn && item.requiresAuth) {
                return null;
              }
              return (
                <Tab
                  key={item.href}
                  as={Link}
                  href={item.href}
                  px={{ base: 1.5, md: 2, lg: 2.5 }}
                  py={2}
                  whiteSpace="nowrap"
                  fontWeight="medium"
                  fontSize={{ base: "xs", md: "xs", lg: "sm" }}
                  flexShrink={0}
                  minW="fit-content"
                  overflow="visible"
                >
                  {t.nav[item.key as keyof typeof t.nav] || item.key}
                </Tab>
              );
            })}
          </TabList>
        </Tabs>

        <Spacer display={{ base: "none", md: "block" }} minW={{ base: 0, md: 1 }} flexShrink={1} />

        <Flex 
          align="center" 
          gap={{ base: 2, md: 1.5, lg: 2 }} 
          minW={{ base: "100%", md: "auto" }}
          width={{ base: "100%", md: "auto" }}
          direction={{ base: "column", md: "row" }}
          flexShrink={{ base: 0, md: 0 }}
        >
          <HStack 
            spacing={{ base: 2, md: 1.5 }} 
            width={{ base: "100%", md: "auto" }}
            align="stretch"
            flexShrink={0}
          >
            <Box flex="1" minW={{ base: "auto", md: "120px" }} maxW={{ base: "100%", md: "200px" }}>
              <CityPicker
                value={searchValue}
                placeholder={t.searchPlaceholder}
                onChange={(val) => setSearchValue(val)}
                onSelect={(val) => {
                  setSearchValue(val);
                  router.push(`/flights?to=${encodeURIComponent(val)}`);
                }}
                icon={<SearchIcon color="gray.400" />}
              size="sm"
                variant="fuzzy"
            />
            </Box>
            <Button 
              size="sm" 
              colorScheme="blue" 
              px={{ base: 2, md: 3, lg: 4 }}
              onClick={handleSearch}
              minW="auto"
              flexShrink={0}
              whiteSpace="nowrap"
              fontSize={{ base: "xs", md: "xs", lg: "sm" }}
            >
              {t.search}
              </Button>
          </HStack>
          {isLoggedIn ? (
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                colorScheme="blue"
                rightIcon={<ChevronDownIcon />}
                width={{ base: "100%", md: "auto" }}
                flexShrink={0}
                whiteSpace="nowrap"
              >
                <HStack spacing={2}>
                  <Text>{userInfo?.username || (language === "zh-CN" ? "用户" : "User")}</Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => router.push("/bookings")}>
                  {t.myBookings}
                </MenuItem>
                <MenuItem onClick={() => router.push("/profile/tickets")}>
                  {t.supportTickets}
                </MenuItem>
                <MenuItem onClick={() => router.push("/profile")}>
                  {t.profile}
                </MenuItem>
                {isAdmin && (
                  <MenuItem onClick={() => router.push("/admin")}>
                    {t.adminPanel}
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} color="red.500">
                  {t.logout}
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <HStack spacing={2} width={{ base: "100%", md: "auto" }} flexShrink={0}>
              <Button 
                size="sm" 
                variant="outline" 
                colorScheme="blue"
                as={Link}
                href="/login"
                flex={{ base: "1", md: "none" }}
                whiteSpace="nowrap"
                px={{ base: 3, md: 4 }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                {t.login}
            </Button>
              <Button 
                size="sm" 
                colorScheme="blue"
                as={Link}
                href="/register"
                flex={{ base: "1", md: "none" }}
                whiteSpace="nowrap"
                px={{ base: 3, md: 4 }}
                fontSize={{ base: "xs", md: "sm" }}
              >
                {t.register}
            </Button>
            </HStack>
          )}
          <Tooltip label={t.tooltip} placement="bottom">
            <IconButton
              aria-label="切换语言"
              icon={<Text fontSize="lg">🌐</Text>}
              size="sm"
              variant="ghost"
              onClick={toggleLanguage}
              flexShrink={0}
            />
          </Tooltip>
        </Flex>
      </Flex>
    </Box>
  );
}
