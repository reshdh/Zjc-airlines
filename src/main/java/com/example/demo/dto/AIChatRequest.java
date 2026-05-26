package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

public class AIChatRequest {
    private List<AIChatMessage> messages = new ArrayList<>();

    public AIChatRequest() {
    }

    public List<AIChatMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<AIChatMessage> messages) {
        this.messages = messages;
    }
}


