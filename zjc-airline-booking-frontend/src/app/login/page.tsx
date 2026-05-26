"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Link,
  HStack,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { userApi, LoginRequest } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";

const loginI18n = {
  "zh-CN": {
    title: "用户登录",
    subtitle: "欢迎回来，请登录您的账号",
    username: "用户名",
    usernamePlaceholder: "请输入用户名",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    submit: "登录",
    loading: "登录中...",
    noAccount: "还没有账号？",
    register: "立即注册",
    errorEmpty: "用户名和密码不能为空",
    errorTitle: "登录失败",
    loginFailed: "登录失败，请重试",
    networkError: "登录失败，请检查网络连接或稍后重试",
  },
  "en-US": {
    title: "Sign In",
    subtitle: "Welcome back, please log in",
    username: "Username",
    usernamePlaceholder: "Enter username",
    password: "Password",
    passwordPlaceholder: "Enter password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Sign In",
    loading: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Register now",
    errorEmpty: "Username and password are required",
    errorTitle: "Sign-in failed",
    loginFailed: "Sign-in failed, please try again",
    networkError: "Sign-in failed. Check network or try later",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = loginI18n[language as keyof typeof loginI18n] || loginI18n["zh-CN"];
  const [formData, setFormData] = useState<LoginRequest>({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.password) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);

    try {
      const response = await userApi.login(formData);
      
      // 根据后端返回的数据结构处理
      if (response.code === 200 || response.code === 0 || !response.code) {
        // 保存用户信息和 token
        const userInfo = {
          ...response.data?.user,
          token: response.data?.token || response.token,
        };
        saveAuth(userInfo);

        const role = (userInfo?.role || "").toString().toUpperCase();
        router.push(role === "ADMIN" ? "/admin" : "/");
        router.refresh();
      } else {
        setError(response.message || t.loginFailed);
      }
    } catch (err: any) {
      console.error("登录错误:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(t.networkError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="lg"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg" textAlign="center" color="blue.600">
              {t.title}
            </Heading>
            <Text color="gray.500" fontSize="sm">
              {t.subtitle}
            </Text>
          </VStack>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>{t.errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="medium">{t.username}</FormLabel>
                <Input
                  name="username"
                  type="text"
                  placeholder={t.usernamePlaceholder}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  size="lg"
                  bg="gray.50"
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">{t.password}</FormLabel>
                <InputGroup size="lg">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    bg="gray.50"
                    _focus={{
                      bg: "white",
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce",
                    }}
                  />
                  <InputRightElement h="full" pr={2}>
                    <IconButton
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                      icon={showPassword ?  <ViewIcon /> :<ViewOffIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText={t.loading}
                mt={2}
              >
                {t.submit}
              </Button>
            </VStack>
          </form>

          <Divider />

          <HStack justify="center" spacing={2}>
            <Text color="gray.600" fontSize="sm">
              {t.noAccount}
            </Text>
            <Link href="/register" color="blue.500" fontWeight="medium">
              {t.register}
            </Link>
          </HStack>
        </VStack>
      </Box>
    </Container>
  );
}

