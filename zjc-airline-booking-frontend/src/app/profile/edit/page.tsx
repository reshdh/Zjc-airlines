"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Skeleton,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useRouter } from "next/navigation";
import { getAuth, isAuthenticated, saveAuth, UserInfo } from "@/lib/auth";
import { profileApi } from "@/lib/profile";

export default function EditProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      const auth = getAuth();
      if (!auth?.id) {
        setError("无法获取用户信息，请重新登录");
        setLoading(false);
        return;
      }
      try {
        // 先尝试从API获取最新数据
        const userData = await profileApi.getProfile();
        if (userData) {
          setUser(userData);
          setFormData({
            username: userData.username || "",
            phone: userData.phone || "",
            address: userData.address || "",
          });
          // 更新本地存储
          saveAuth({
            ...auth,
            ...userData,
          });
        } else {
          // 如果接口失败，使用缓存的数据
          setUser(auth);
          setFormData({
            username: auth.username || "",
            phone: auth.phone || "",
            address: auth.address || "",
          });
        }
      } catch (err) {
        console.warn("获取用户信息失败，使用缓存数据:", err);
        // 接口失败时使用缓存数据
        setUser(auth);
        setFormData({
          username: auth.username || "",
          phone: auth.phone || "",
          address: auth.address || "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordError) setPasswordError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user?.id) {
      setError("无法获取用户ID，请重新登录");
      return;
    }

    // 验证用户名
    if (!formData.username || formData.username.trim().length < 3) {
      setError("用户名长度至少为3位");
      return;
    }

    // 验证手机号格式（如果填写了）
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError("请输入有效的手机号");
      return;
    }

    setSubmitting(true);

    try {
      const updatedUser = await profileApi.updateProfile(user.id, {
        name: user.name || user.fullName || "", // 确保 name 字段始终有值
        username: formData.username.trim(),
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });

      // 更新本地存储的用户信息
      // 优先使用表单中的值（用户刚刚输入的值），然后是返回的数据，最后是缓存的数据
      const auth = getAuth();
      const mergedUser: UserInfo = {
        ...auth,
        ...updatedUser,
        id: updatedUser.id || auth?.id,
        name: updatedUser.name || updatedUser.fullName || auth?.name || auth?.fullName || "",
        fullName: updatedUser.fullName || updatedUser.name || auth?.fullName || auth?.name || "",
        username: formData.username.trim() || updatedUser.username || auth?.username || "",
        // 电话：优先使用表单值，然后是返回的值，最后是缓存的值
        phone: formData.phone || updatedUser.phone || auth?.phone || "",
        // 地址：优先使用表单值，然后是返回的值，最后是缓存的值
        address: formData.address || updatedUser.address || auth?.address || "",
      };
      saveAuth(mergedUser);

      // 直接使用返回的数据更新表单，不重新获取
      // 确保使用表单中提交的值，因为后端可能不会返回所有字段
      setUser(mergedUser);
      setFormData({
        username: formData.username.trim(), // 使用表单中的值
        phone: formData.phone || "", // 使用表单中的值
        address: formData.address || "", // 使用表单中的值
      });

      toast({
        title: "更新成功",
        description: "个人信息已成功更新",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error("更新用户信息失败:", err);
      const serverMsg = err?.response?.data?.message;
      setError(serverMsg || err.message || "更新失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!user?.id) {
      setPasswordError("无法获取用户ID，请重新登录");
      return;
    }

    // 验证原密码
    if (!passwordData.oldPassword) {
      setPasswordError("请输入原密码");
      return;
    }

    // 验证新密码
    if (!passwordData.newPassword) {
      setPasswordError("请输入新密码");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("新密码长度至少为6位");
      return;
    }

    // 验证确认密码
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }

    setChangingPassword(true);

    try {
      await profileApi.changePassword(
        user.id,
        passwordData.oldPassword,
        passwordData.newPassword
      );

      toast({
        title: "密码修改成功",
        description: "您的密码已成功修改，请妥善保管",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // 清空密码表单
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error("修改密码失败:", err);
      const serverMsg = err?.response?.data?.message;
      setPasswordError(serverMsg || err.message || "修改密码失败，请稍后重试");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="2xl" py={10}>
        <VStack spacing={4} align="stretch">
          <Skeleton height="40px" />
          <Skeleton height="300px" />
        </VStack>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxW="2xl" py={10}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>无法加载用户信息</AlertTitle>
            <AlertDescription>
              {error || "请重新登录后再试"}
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="2xl" py={10}>
      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="lg"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <VStack spacing={6} align="stretch">
          <Heading size="lg" textAlign="center" color="blue.600">
            编辑个人信息
          </Heading>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>更新失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              {/* 不可编辑的字段 */}
              <FormControl>
                <FormLabel fontWeight="medium" color="gray.500">
                  真实姓名
                </FormLabel>
                <Input
                  value={user.name || user.fullName || "未设置"}
                  isDisabled
                  bg="gray.50"
                  cursor="not-allowed"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium" color="gray.500">
                  身份证号
                </FormLabel>
                <Input
                  value={user.idNumber || "未填写"}
                  isDisabled
                  bg="gray.50"
                  cursor="not-allowed"
                />
              </FormControl>

              <Box width="100%" pt={4} borderTopWidth="1px" borderColor="gray.200">
                <Heading size="sm" mb={4} color="gray.600">
                  可编辑信息
                </Heading>
              </Box>

              {/* 可编辑的字段 */}
              <FormControl isRequired>
                <FormLabel fontWeight="medium">用户名</FormLabel>
                <Input
                  name="username"
                  type="text"
                  placeholder="请输入用户名（至少3位）"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={submitting}
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
                <FormLabel fontWeight="medium">联系电话</FormLabel>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={submitting}
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
                <FormLabel fontWeight="medium">通讯地址</FormLabel>
                <Textarea
                  name="address"
                  placeholder="请输入通讯地址"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={submitting}
                  size="lg"
                  rows={3}
                  bg="gray.50"
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
                isLoading={submitting}
                loadingText="保存中..."
                mt={4}
              >
                保存修改
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="lg"
                width="full"
                onClick={() => router.back()}
                disabled={submitting}
              >
                取消
              </Button>
            </VStack>
          </form>

          <Divider my={6} />

          {/* 修改密码表单 */}
          <Box width="100%">
            <Heading size="md" mb={4} color="gray.700">
              修改密码
            </Heading>

            {passwordError && (
              <Alert status="error" borderRadius="md" mb={4}>
                <AlertIcon />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleChangePassword}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">原密码</FormLabel>
                  <InputGroup>
                    <Input
                      name="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      placeholder="请输入原密码"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
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
                        aria-label={showOldPassword ? "隐藏密码" : "显示密码"}
                        icon={showOldPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">新密码</FormLabel>
                  <InputGroup>
                    <Input
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="请输入新密码（至少6位）"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
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
                        aria-label={showNewPassword ? "隐藏密码" : "显示密码"}
                        icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="medium">确认新密码</FormLabel>
                  <InputGroup>
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="请再次输入新密码"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
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
                        aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={changingPassword}
                  loadingText="修改中..."
                  mt={2}
                >
                  修改密码
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
}

