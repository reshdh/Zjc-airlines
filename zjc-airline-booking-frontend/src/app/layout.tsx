import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ChakraProvider, Box, Container } from "@chakra-ui/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomerServiceAI } from "@/components/customer-service/CustomerServiceAI";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZJC 航空公司机票预订系统",
  description: "基于 Spring Boot + Next.js + MySQL 的 ZJC 航空公司机票预订系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <LanguageProvider>
        <ChakraProvider>
            <Box minH="100vh" bg="gray.50" display="flex" flexDirection="column">
            <Header />
              <Container
                maxW="6xl"
                mt={6}
                mb={6}
                px={6}
                bg="white"
                boxShadow="sm"
                borderRadius="md"
                flex="1"
                width="100%"
              >
              {children}
            </Container>
            <Footer />
              <CustomerServiceAI />
          </Box>
        </ChakraProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
