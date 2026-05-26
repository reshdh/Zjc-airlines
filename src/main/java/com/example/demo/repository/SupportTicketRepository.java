package com.example.demo.repository;

import com.example.demo.entity.SupportTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    Page<SupportTicket> findAllByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<SupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<SupportTicket> findAllByUserNameOrderByCreatedAtDesc(String userName, Pageable pageable);
}





