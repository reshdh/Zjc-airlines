package com.example.demo.service;

import com.example.demo.dto.SupportTicketReplyRequest;
import com.example.demo.dto.SupportTicketRequest;
import com.example.demo.entity.SupportTicket;
import com.example.demo.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SupportTicketService {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    public SupportTicket createTicket(SupportTicketRequest request) {
        SupportTicket ticket = new SupportTicket();
        ticket.setSubject(request.getSubject());
        ticket.setContent(request.getContent());
        ticket.setUserName(request.getUserName());
        ticket.setContactInfo(request.getContactInfo());
        ticket.setPriority(
                StringUtils.hasText(request.getPriority()) ? request.getPriority().toUpperCase() : "NORMAL");
        ticket.setStatus("OPEN");
        return supportTicketRepository.save(ticket);
    }

    public Page<SupportTicket> listTickets(int page, int size, String status) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        if (StringUtils.hasText(status)) {
            return supportTicketRepository.findAllByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        }
        return supportTicketRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public SupportTicket getTicket(Long id) {
        return supportTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工单不存在"));
    }

    public SupportTicket updateTicket(Long id, SupportTicketReplyRequest request) {
        SupportTicket ticket = getTicket(id);
        if (StringUtils.hasText(request.getStatus())) {
            ticket.setStatus(request.getStatus().toUpperCase());
        }
        if (StringUtils.hasText(request.getAdminReply())) {
            ticket.setAdminReply(request.getAdminReply());
        }
        return supportTicketRepository.save(ticket);
    }

    public void deleteTicket(Long id) {
        supportTicketRepository.deleteById(id);
    }
}

