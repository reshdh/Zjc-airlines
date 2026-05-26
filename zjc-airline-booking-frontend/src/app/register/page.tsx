"use client";

import { useState, ChangeEvent } from "react";
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
  InputRightElement,
  InputGroup,
  IconButton,
  Textarea,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { userApi, RegisterRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const registerI18n = {
  "zh-CN": {
    title: "旅客注册",
    subtitle: "旅客在订票前必须完成实名注册，填写姓名、身份证号、联系电话与地址",
    errorTitle: "注册失败",
    successTitle: "注册成功",
    successDesc: "注册成功！正在跳转到登录页面...",
    sections: {
      accountTitle: "账号信息",
      accountDesc: "用于登录系统和管理订单",
      realTitle: "旅客实名信息",
      realDesc: "以下信息将用于实名验证与联系，请确保与证件一致",
    },
    fields: {
      usernameLabel: "用户名",
      usernamePlaceholder: "请输入用户名（至少3位）",
      passwordLabel: "密码",
      passwordPlaceholder: "请输入密码（至少6位）",
      confirmPasswordLabel: "确认密码",
      confirmPasswordPlaceholder: "请再次输入密码",
      fullNameLabel: "旅客姓名",
      fullNamePlaceholder: "请输入真实姓名",
      idLabel: "身份证号",
      idPlaceholder: "请输入18位身份证号",
      phoneLabel: "联系电话",
      phonePlaceholder: "请输入常用手机号码",
      addressLabel: "通讯地址",
      addressPlaceholder: "请输入详细通讯地址，便于联系与开票",
    },
    submit: "注册",
    submitting: "注册中...",
    successButton: "注册成功",
    bottomText: "已有账号？",
    bottomLink: "立即登录",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    showConfirmPassword: "显示确认密码",
    hideConfirmPassword: "隐藏确认密码",
    validation: {
      emptyUserPass: "用户名和密码不能为空",
      shortUsername: "用户名长度至少为3位",
      shortPassword: "密码长度至少为6位",
      confirmEmpty: "请再次输入密码以确认",
      mismatch: "两次输入的密码不一致",
      emptyFullName: "旅客姓名不能为空",
      invalidId: "请输入有效的身份证号",
      invalidPhone: "请输入有效的联系电话",
      invalidAddress: "通讯地址不能为空，且不少于5个字符",
    },
    apiFailed: "注册失败，请重试",
    networkError: "注册失败，请检查网络连接或稍后重试",
  },
  "en-US": {
    title: "Passenger Registration",
    subtitle:
      "Please complete real-name registration before booking. Fill in your name, ID number, phone and address.",
    errorTitle: "Registration failed",
    successTitle: "Registration successful",
    successDesc: "Registration successful! Redirecting to sign-in...",
    sections: {
      accountTitle: "Account Details",
      accountDesc: "Used to sign in and manage orders",
      realTitle: "Identity Information",
      realDesc: "These details are used for verification and contact, please match your ID",
    },
    fields: {
      usernameLabel: "Username",
      usernamePlaceholder: "Enter username (min 3 chars)",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password (min 6 chars)",
      confirmPasswordLabel: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter password",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Enter real name",
      idLabel: "ID number",
      idPlaceholder: "Enter 18-digit ID number",
      phoneLabel: "Phone number",
      phonePlaceholder: "Enter mobile number",
      addressLabel: "Mailing address",
      addressPlaceholder: "Enter full address for contact/invoice",
    },
    submit: "Register",
    submitting: "Registering...",
    successButton: "Registered",
    bottomText: "Already have an account?",
    bottomLink: "Sign in",
    showPassword: "Show password",
    hidePassword: "Hide password",
    showConfirmPassword: "Show confirm password",
    hideConfirmPassword: "Hide confirm password",
    validation: {
      emptyUserPass: "Username and password are required",
      shortUsername: "Username must be at least 3 characters",
      shortPassword: "Password must be at least 6 characters",
      confirmEmpty: "Please re-enter password to confirm",
      mismatch: "Passwords do not match",
      emptyFullName: "Full name is required",
      invalidId: "Please enter a valid ID number",
      invalidPhone: "Please enter a valid phone number",
      invalidAddress: "Address must be at least 5 characters",
    },
    apiFailed: "Registration failed, please retry",
    networkError: "Registration failed. Check network or try later",
  },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = registerI18n[language as keyof typeof registerI18n] || registerI18n["zh-CN"];
  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    password: "",
    fullName: "",
    idNumber: "",
    phone: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除错误信息
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 基本验证
    if (!formData.username || !formData.password) {
      setError(t.validation.emptyUserPass);
      return;
    }

    if (formData.username.length < 3) {
      setError(t.validation.shortUsername);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.validation.shortPassword);
      return;
    }

    if (!confirmPassword) {
      setError(t.validation.confirmEmpty);
      return;
    }

    if (formData.password !== confirmPassword) {
      setError(t.validation.mismatch);
      return;
    }

    // 姓名验证
    if (!formData.fullName.trim()) {
      setError(t.validation.emptyFullName);
      return;
    }

    // 身份证号验证：支持 15 位和 18 位，其中 18 位需要校验出生日期格式
    const idPattern =
      /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$|^[1-9]\d{7}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}$/;
    if (!idPattern.test(formData.idNumber.trim())) {
      setError(t.validation.invalidId);
      return;
    }

    // 联系电话验证（必填）
    if (!formData.phone || !/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError(t.validation.invalidPhone);
      return;
    }

    // 地址验证
    if (!formData.address || formData.address.trim().length < 5) {
      setError(t.validation.invalidAddress);
      return;
    }

    setLoading(true);

    try {
      const response = await userApi.register(formData);
      
      // 根据后端返回的数据结构处理
      if (response.code === 200 || response.code === 0 || !response.code) {
        setSuccess(true);
        setConfirmPassword("");
        // 注册成功，2秒后跳转到登录页面
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(response.message || t.apiFailed);
      }
    } catch (err: any) {
      console.error("注册错误:", err);
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

          {success && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>{t.successTitle}</AlertTitle>
                <AlertDescription>{t.successDesc}</AlertDescription>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="semibold" mb={1}>
                  {t.sections.accountTitle}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {t.sections.accountDesc}
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">
                  {t.fields.usernameLabel}
                </FormLabel>
                <Input
                  name="username"
                  type="text"
                  placeholder={t.fields.usernamePlaceholder}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading || success}
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
                <FormLabel fontWeight="medium">
                  {t.fields.passwordLabel}
                </FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.fields.passwordPlaceholder}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || success}
                    size="lg"
                    bg="gray.50"
                    _focus={{
                      bg: "white",
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce",
                    }}
                  />
                  <InputRightElement height="100%">
                    <IconButton
                      aria-label={
                        showPassword ? t.hidePassword : t.showPassword
                      }
                      icon={showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading || success}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="medium">
                  {t.fields.confirmPasswordLabel}
                </FormLabel>
                <InputGroup>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t.fields.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={loading || success}
                    size="lg"
                    bg="gray.50"
                    _focus={{
                      bg: "white",
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce",
                    }}
                  />
                  <InputRightElement height="100%">
                    <IconButton
                      aria-label={
                        showConfirmPassword
                          ? t.hideConfirmPassword
                          : t.showConfirmPassword
                      }
                      icon={
                        showConfirmPassword ? <ViewIcon /> : <ViewOffIcon />
                      }
                      variant="ghost"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={loading || success}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Divider />

              <Box>
                <Text fontWeight="semibold" mb={1}>
                  {t.sections.realTitle}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {t.sections.realDesc}
                </Text>
              </Box>

              <FormControl>
                <FormLabel fontWeight="medium">
                  {t.fields.fullNameLabel}
                </FormLabel>
                <Input
                  name="fullName"
                  type="text"
                  placeholder={t.fields.fullNamePlaceholder}
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading || success}
                  size="lg"
                  bg="gray.50"
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium">
                  {t.fields.idLabel}
                </FormLabel>
                <Input
                  name="idNumber"
                  type="text"
                  placeholder={t.fields.idPlaceholder}
                  value={formData.idNumber}
                  onChange={handleChange}
                  disabled={loading || success}
                  size="lg"
                  bg="gray.50"
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium">
                  {t.fields.phoneLabel}
                </FormLabel>
                <Input
                  name="phone"
                  type="tel"
                  placeholder={t.fields.phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading || success}
                  size="lg"
                  bg="gray.50"
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium">
                  {t.fields.addressLabel}
                </FormLabel>
                <Textarea
                  name="address"
                  placeholder={t.fields.addressPlaceholder}
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading || success}
                  size="lg"
                  bg="gray.50"
                  minH="110px"
                  _focus={{
                    bg: "white",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText={t.submitting}
                disabled={success}
                mt={2}
              >
                {success ? t.successButton : t.submit}
              </Button>
            </VStack>
          </form>

          <Divider />

          <HStack justify="center" spacing={2}>
            <Text color="gray.600" fontSize="sm">
              {t.bottomText}
            </Text>
            <Link href="/login" color="blue.500" fontWeight="medium">
              {t.bottomLink}
            </Link>
          </HStack>
        </VStack>
      </Box>
    </Container>
  );
}

