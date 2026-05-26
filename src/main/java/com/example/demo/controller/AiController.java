package com.example.demo.controller;

import com.example.demo.dto.AIChatRequest;
import com.example.demo.dto.ApiResponse;
import com.example.demo.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(@RequestBody AIChatRequest request) {
        try {
            String content = aiService.chat(request != null ? request.getMessages() : null);
            Map<String, String> data = new HashMap<>();
            data.put("content", content);
            return ResponseEntity.ok(ApiResponse.success("AI 响应成功", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}


