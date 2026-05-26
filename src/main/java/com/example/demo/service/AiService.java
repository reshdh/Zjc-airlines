package com.example.demo.service;

import com.example.demo.dto.AIChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final RestTemplate restTemplate;

    @Value("${deepseek.api.key:}")
    private String deepseekApiKey;

    @Value("${deepseek.api.base-url:https://api.deepseek.com/v1}")
    private String deepseekBaseUrl;

    public AiService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(60))
                .build();
    }

    public String chat(List<AIChatMessage> messages) {
        if (CollectionUtils.isEmpty(messages)) {
            throw new RuntimeException("消息内容不能为空");
        }

        if (!StringUtils.hasText(deepseekApiKey)) {
            return "AI 功能暂未配置，请联系管理员设置 DeepSeek API Key。";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(deepseekApiKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", "deepseek-chat");
            payload.put("temperature", 0.7);
            payload.put("messages", messages.stream()
                    .map(m -> {
                        Map<String, String> msg = new HashMap<>();
                        msg.put("role", StringUtils.hasText(m.getRole()) ? m.getRole() : "user");
                        msg.put("content", StringUtils.hasText(m.getContent()) ? m.getContent() : "");
                        return msg;
                    })
                    .collect(Collectors.toList()));

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

            String endpoint = (deepseekBaseUrl != null && deepseekBaseUrl.endsWith("/"))
                    ? deepseekBaseUrl + "chat/completions"
                    : deepseekBaseUrl + "/chat/completions";

            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, requestEntity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("choices")) {
                List choices = (List) body.get("choices");
                if (!choices.isEmpty()) {
                    Object choiceObj = choices.get(0);
                    if (choiceObj instanceof Map choice) {
                        Object messageObj = choice.get("message");
                        if (messageObj instanceof Map message) {
                            Object content = message.get("content");
                            if (content != null) {
                                return content.toString().trim();
                            }
                        }
                    }
                }
            }

            return "AI 服务暂时无法获取有效回复，请稍后再试。";
        } catch (HttpStatusCodeException ex) {
            StringBuilder message = new StringBuilder("AI 服务返回错误：")
                    .append(ex.getStatusCode().value());
            String body = ex.getResponseBodyAsString();
            if (StringUtils.hasText(body)) {
                message.append(" - ").append(body);
            }
            throw new RuntimeException(message.toString(), ex);
        } catch (ResourceAccessException ex) {
            throw new RuntimeException("AI 服务连接或读取超时，请稍后再试。", ex);
        } catch (Exception ex) {
            throw new RuntimeException("AI 服务调用失败：" + ex.getMessage(), ex);
        }
    }
}

