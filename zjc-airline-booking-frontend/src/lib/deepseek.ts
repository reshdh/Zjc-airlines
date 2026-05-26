import apiClient from "./api";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export const deepseekApi = {
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await apiClient.post(
        "/api/ai/chat",
        { messages },
        {
          timeout: 45000,
        }
      );
      const data = response.data?.data;
      return (
        data?.content ||
        response.data?.message ||
        "AI 服务暂不可用，请稍后重试"
      );
    } catch (error: any) {
      if (error?.code === "ECONNABORTED") {
        throw new Error("AI 接口请求超时，请稍后再试");
      }
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        throw new Error(serverMessage);
      }
      throw error;
    }
  },
};


