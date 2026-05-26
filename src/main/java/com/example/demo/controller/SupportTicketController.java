package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.SupportTicketReplyRequest;
import com.example.demo.dto.SupportTicketRequest;
import com.example.demo.dto.SupportTicketResponse;
import com.example.demo.entity.SupportTicket;
import com.example.demo.service.SupportTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class SupportTicketController {

    @Autowired
    private SupportTicketService supportTicketService;

    @PostMapping
    public ApiResponse<SupportTicketResponse> createTicket(@RequestBody SupportTicketRequest request) {
        SupportTicket ticket = supportTicketService.createTicket(request);
        return ApiResponse.success("工单提交成功", SupportTicketResponse.fromEntity(ticket));
    }

    @GetMapping
    public ApiResponse<Page<SupportTicketResponse>> listTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Page<SupportTicket> tickets = supportTicketService.listTickets(page, size, status);
        Page<SupportTicketResponse> mapped = tickets.map(SupportTicketResponse::fromEntity);
        return ApiResponse.success(mapped);
    }

    @GetMapping("/{id}")
    public ApiResponse<SupportTicketResponse> getTicket(@PathVariable Long id) {
        return ApiResponse.success(SupportTicketResponse.fromEntity(supportTicketService.getTicket(id)));
    }

    @GetMapping("/user")
    public ApiResponse<Page<SupportTicketResponse>> listUserTickets(
            @RequestParam String userName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!StringUtils.hasText(userName)) {
            return ApiResponse.error("用户名不能为空");
        }
        Page<SupportTicket> tickets = supportTicketService.listTicketsByUser(userName, page, size);
        Page<SupportTicketResponse> mapped = tickets.map(SupportTicketResponse::fromEntity);
        return ApiResponse.success(mapped);
    }

    @PutMapping("/{id}")
    public ApiResponse<SupportTicketResponse> updateTicket(
            @PathVariable Long id,
            @RequestBody SupportTicketReplyRequest request) {
        SupportTicket updated = supportTicketService.updateTicket(id, request);
        return ApiResponse.success("工单已更新", SupportTicketResponse.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTicket(@PathVariable Long id) {
        supportTicketService.deleteTicket(id);
        return ApiResponse.success("工单已删除", null);
    }
}





