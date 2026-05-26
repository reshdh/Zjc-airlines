"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  HStack,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getAuth, type UserInfo } from "@/lib/auth";
import { ticketApi, type SupportTicketPage, type SupportTicket } from "@/lib/tickets";

const ticketI18n = {
  "zh-CN": {
    title: "我的工单",
    subtitle: "在这里查看已提交工单的处理进度与管理员回复。",
    btnContact: "提交新工单",
    btnBack: "返回帮助中心",
    btnPrev: "上一页",
    btnNext: "下一页",
    btnRefresh: "刷新",
    priority: {
      LOW: "低",
      NORMAL: "普通",
      HIGH: "高",
      URGENT: "紧急",
    },
    labels: {
      ticketId: "工单号",
      accepted: "已受理",
      pending: "未受理",
      submittedAt: "提交时间",
      updatedAt: "更新时间",
      contact: "联系方式",
      description: "问题描述",
      adminReply: "管理员回复",
      waitingReply: "等待管理员回复，请耐心等待。",
      refreshedAt: "最近刷新",
      emptyTitle: "暂无工单",
      emptyDesc: "当你提交问题后，可在此跟踪处理进度。",
      needLogin: "请先登录后再查看工单进度。",
      redirecting: "系统正在为你跳转至登录页...",
    },
  },
  "en-US": {
    title: "My Support Tickets",
    subtitle: "Track the progress and replies from administrators.",
    btnContact: "Open a new ticket",
    btnBack: "Help center",
    btnPrev: "Previous",
    btnNext: "Next",
    btnRefresh: "Refresh",
    priority: {
      LOW: "Low",
      NORMAL: "Normal",
      HIGH: "High",
      URGENT: "Urgent",
    },
    labels: {
      ticketId: "Ticket ID",
      accepted: "Accepted",
      pending: "Pending",
      submittedAt: "Submitted at",
      updatedAt: "Updated at",
      contact: "Contact",
      description: "Description",
      adminReply: "Admin reply",
      waitingReply: "Waiting for administrator response.",
      refreshedAt: "Last refresh",
      emptyTitle: "No tickets yet",
      emptyDesc: "Submit a ticket to track its progress here.",
      needLogin: "Please sign in to view your support tickets.",
      redirecting: "Redirecting to login...",
    },
  },
} as const;

const PAGE_SIZE = 6;

const priorityColorMap: Record<string, string> = {
  LOW: "gray",
  NORMAL: "blue",
  HIGH: "orange",
  URGENT: "red",
};

export default function TicketTimelinePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = ticketI18n[language as keyof typeof ticketI18n] || ticketI18n["zh-CN"];
  const [authInfo, setAuthInfo] = useState<UserInfo | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageData, setPageData] = useState<SupportTicketPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      setCheckingAuth(false);
      router.replace(`/login?redirect=${encodeURIComponent("/profile/tickets")}`);
      return;
    }
    setAuthInfo(auth);
    setCheckingAuth(false);
  }, [router]);

  const fetchTickets = useCallback(
    async (userName: string, page = 0) => {
      setLoading(true);
      setError(null);
      try {
        const data = await ticketApi.listByUser({
          userName,
          page,
          size: PAGE_SIZE,
        });
        setPageData({
          ...data,
          content: Array.isArray(data?.content) ? data.content : [],
        });
        setLastRefresh(dayjs().format("YYYY-MM-DD HH:mm:ss"));
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "加载失败";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authInfo?.username) {
      fetchTickets(authInfo.username, pageIndex);
    }
  }, [authInfo?.username, fetchTickets, pageIndex]);

  const tickets = useMemo<SupportTicket[]>(() => {
    return pageData?.content ?? [];
  }, [pageData]);

  const totalPages = pageData?.totalPages ?? 0;

  const handlePageChange = (next: number) => {
    if (loading || !authInfo?.username) return;
    if (next < 0 || (totalPages && next >= totalPages)) return;
    setPageIndex(next);
  };

  if (checkingAuth) {
    return (
      <Box maxW="960px" mx="auto" px={4} py={12}>
        <Skeleton height="24px" mb={4} />
        <Skeleton height="160px" borderRadius="lg" />
      </Box>
    );
  }

  if (!authInfo) {
    return (
      <Box maxW="960px" mx="auto" px={4} py={12}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>{t.labels.needLogin}</AlertTitle>
            <Text mt={1}>{t.labels.redirecting}</Text>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxW="960px" mx="auto" px={{ base: 4, md: 6 }} py={10}>
      <HStack justify="space-between" align={{ base: "flex-start", md: "center" }} mb={6} spacing={4}>
        <Box>
          <Text fontSize="sm" color="gray.500">
            {t.labels.refreshedAt}：{lastRefresh || "--"}
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {t.title}
          </Text>
          <Text color="gray.600" mt={1}>
            {t.subtitle}
          </Text>
        </Box>
        <ButtonGroup size="sm" variant="solid">
          <Button colorScheme="blue" onClick={() => router.push("/contact")}>
            {t.btnContact}
          </Button>
          <Button variant="outline" onClick={() => router.push("/help")}>
            {t.btnBack}
          </Button>
        </ButtonGroup>
      </HStack>

      {error && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Flex justify="flex-end" mb={4}>
        <Button
          size="sm"
          leftIcon={<RepeatIcon />}
          variant="ghost"
          onClick={() => authInfo.username && fetchTickets(authInfo.username, pageIndex)}
          isLoading={loading}
        >
          {t.btnRefresh}
        </Button>
      </Flex>

      {loading && tickets.length === 0 ? (
        <Stack spacing={4}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} height="140px" borderRadius="xl" />
          ))}
        </Stack>
      ) : tickets.length === 0 ? (
        <Box
          borderWidth="1px"
          borderRadius="xl"
          borderStyle="dashed"
          p={10}
          textAlign="center"
          color="gray.600"
        >
          <Text fontSize="lg" fontWeight="semibold">
            {t.labels.emptyTitle}
          </Text>
          <Text mt={2}>{t.labels.emptyDesc}</Text>
          <Button mt={4} colorScheme="blue" onClick={() => router.push("/contact")}>
            {t.btnContact}
          </Button>
        </Box>
      ) : (
        <Stack spacing={4}>
          {tickets.map((ticket) => (
            <Box key={ticket.id} borderWidth="1px" borderRadius="xl" p={5} bg="white" boxShadow="sm">
              <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    {t.labels.ticketId} #{ticket.id}
                  </Text>
                  <Text fontWeight="semibold" fontSize="lg">
                    {ticket.subject}
                  </Text>
                </Box>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge colorScheme={priorityColorMap[ticket.priority] || "gray"} variant="outline">
                    {t.priority[ticket.priority as keyof typeof t.priority] || ticket.priority}
                  </Badge>
                  <Badge colorScheme={ticket.adminReply ? "green" : "orange"}>
                    {ticket.adminReply ? t.labels.accepted : t.labels.pending}
                  </Badge>
                </HStack>
              </HStack>

              <Text mt={3} color="gray.700">
                {ticket.content}
              </Text>

              <Divider my={4} />

              <Stack spacing={1} fontSize="sm" color="gray.600">
                <Text>
                  {t.labels.submittedAt}：{ticket.createdAt ? dayjs(ticket.createdAt).format("YYYY-MM-DD HH:mm") : "--"}
                </Text>
                <Text>
                  {t.labels.updatedAt}：{ticket.updatedAt ? dayjs(ticket.updatedAt).format("YYYY-MM-DD HH:mm") : "--"}
                </Text>
                <Text>
                  {t.labels.contact}：{ticket.contactInfo || "--"}
                </Text>
              </Stack>

              <Box mt={4}>
                {ticket.adminReply ? (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="semibold">{t.labels.adminReply}</Text>
                      <Text mt={1} color="gray.700">
                        {ticket.adminReply}
                      </Text>
                    </Box>
                  </Alert>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text>{t.labels.waitingReply}</Text>
                  </Alert>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {tickets.length > 0 && (
        <Flex justify="space-between" align="center" mt={8} flexWrap="wrap" gap={3}>
          <Text fontSize="sm" color="gray.600">
            {totalPages > 0 ? `${pageIndex + 1} / ${totalPages}` : "—"}
          </Text>
          <ButtonGroup variant="outline" size="sm">
            <Button onClick={() => handlePageChange(pageIndex - 1)} isDisabled={pageIndex === 0}>
              {t.btnPrev}
            </Button>
            <Button
              onClick={() => handlePageChange(pageIndex + 1)}
              isDisabled={totalPages === 0 || pageIndex >= totalPages - 1}
            >
              {t.btnNext}
            </Button>
          </ButtonGroup>
        </Flex>
      )}
    </Box>
  );
}


