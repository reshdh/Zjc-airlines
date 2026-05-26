package com.example.demo.dto;

import com.example.demo.entity.SupportTicket;

import java.time.LocalDateTime;

public class SupportTicketResponse {
    private Long id;
    private String subject;
    private String content;
    private String userName;
    private String contactInfo;
    private String status;
    private String priority;
    private String adminReply;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SupportTicketResponse fromEntity(SupportTicket ticket) {
        SupportTicketResponse response = new SupportTicketResponse();
        response.setId(ticket.getId());
        response.setSubject(ticket.getSubject());
        response.setContent(ticket.getContent());
        response.setUserName(ticket.getUserName());
        response.setContactInfo(ticket.getContactInfo());
        response.setStatus(ticket.getStatus());
        response.setPriority(ticket.getPriority());
        response.setAdminReply(ticket.getAdminReply());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getAdminReply() {
        return adminReply;
    }

    public void setAdminReply(String adminReply) {
        this.adminReply = adminReply;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

