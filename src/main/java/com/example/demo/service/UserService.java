package com.example.demo.service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UserStatsResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final BigDecimal DEFAULT_WALLET_AMOUNT = new BigDecimal("200.00");

    @PostConstruct
    public void initializeWalletForExistingUsers() {
        try {
            List<User> users = userRepository.findAll();
            int initialized = 0;
            for (User user : users) {
                if (user.getWalletBalance() == null) {
                    user.setWalletBalance(determineInitialWallet(user));
                    userRepository.save(user);
                    initialized++;
                }
            }
            if (initialized > 0) {
                log.info("自动初始化了 {} 个用户的钱包余额", initialized);
            }
        } catch (Exception ex) {
            log.warn("自动初始化用户钱包余额失败: {}", ex.getMessage(), ex);
        }
    }

    public User register(RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查身份证号是否已存在
        if (userRepository.existsByIdNumber(request.getIdNumber())) {
            throw new RuntimeException("身份证号已存在");
        }

        // 检查手机号是否已存在
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("手机号已存在");
        }

        // 创建新用户
        User user = new User();
        user.setName(request.getName());
        user.setIdNumber(request.getIdNumber());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setStatus(1);
        user.setWalletBalance(DEFAULT_WALLET_AMOUNT);

        return ensureWalletInitialized(userRepository.save(user));
    }

    public User login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户名或密码错误");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        return ensureWalletInitialized(user);
    }

    public User getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return ensureWalletInitialized(user);
    }

    public User getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return ensureWalletInitialized(user);
    }

    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::ensureWalletInitialized)
                .collect(Collectors.toList());
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        // 只更新非空字段，必填字段（name, username）必须保留原有值（如果新值为空）
        if (userDetails.getName() != null && !userDetails.getName().trim().isEmpty()) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getUsername() != null && !userDetails.getUsername().trim().isEmpty()) {
            // 检查用户名是否与其他用户冲突
            String newUsername = userDetails.getUsername().trim();
            if (!newUsername.equals(user.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new RuntimeException("用户名已存在");
                }
                user.setUsername(newUsername);
            }
        }
        if (userDetails.getPhone() != null) {
            user.setPhone(userDetails.getPhone());
        }
        if (userDetails.getAddress() != null) {
            user.setAddress(userDetails.getAddress());
        }
        return ensureWalletInitialized(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User resetPassword(Long id, String newPassword) {
        User user = getUserById(id);
        String passwordToUse = StringUtils.hasText(newPassword) ? newPassword : "123456";
        user.setPassword(passwordEncoder.encode(passwordToUse));
        return ensureWalletInitialized(userRepository.save(user));
    }

    public User changePassword(Long id, ChangePasswordRequest request) {
        if (request == null) {
            throw new RuntimeException("请求参数不能为空");
        }
        if (!StringUtils.hasText(request.getOldPassword())) {
            throw new RuntimeException("原密码不能为空");
        }
        if (!StringUtils.hasText(request.getNewPassword())) {
            throw new RuntimeException("新密码不能为空");
        }
        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("新密码长度至少为6位");
        }

        User user = getUserById(id);
        
        // 验证原密码
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("原密码错误");
        }

        // 更新为新密码
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return ensureWalletInitialized(userRepository.save(user));
    }

    public User updateStatus(Long id, int status) {
        User user = getUserById(id);
        user.setStatus(status);
        return ensureWalletInitialized(userRepository.save(user));
    }

    public UserStatsResponse getUserStats() {
        long total = userRepository.count();
        long admin = userRepository.countByRole("ADMIN");
        long active = userRepository.countByStatus(1);
        long disabled = userRepository.countByStatus(0);

        LocalDate startDate = LocalDate.now().minusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        List<Object[]> rows = userRepository.countRegistrationsSince(start);
        Map<LocalDate, Long> grouping = rows.stream()
                .collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> (Long) row[1],
                        Long::sum));

        List<UserStatsResponse.DailyStat> dailyStats = startDate
                .datesUntil(LocalDate.now().plusDays(1))
                .map(date -> new UserStatsResponse.DailyStat(date.toString(),
                        grouping.getOrDefault(date, 0L)))
                .collect(Collectors.toList());

        UserStatsResponse response = new UserStatsResponse();
        response.setTotalUsers(total);
        response.setAdminUsers(admin);
        response.setActiveUsers(active);
        response.setDisabledUsers(disabled);
        response.setRecentRegistrations(dailyStats);
        return response;
    }

    public User rechargeWallet(Long id, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("充值金额必须大于 0");
        }
        if (amount.compareTo(new BigDecimal("1000000")) > 0) {
            throw new RuntimeException("单次充值金额过大，请分批操作");
        }
        User user = getUserById(id);
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("管理员账号无需充值钱包");
        }
        BigDecimal current = user.getWalletBalance() != null ? user.getWalletBalance() : DEFAULT_WALLET_AMOUNT;
        user.setWalletBalance(current.add(amount));
        return userRepository.save(user);
    }

    public User withdrawWallet(Long id, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("提现金额必须大于 0");
        }
        User user = getUserById(id);
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("管理员账号无需提现");
        }
        BigDecimal current = user.getWalletBalance() != null ? user.getWalletBalance() : DEFAULT_WALLET_AMOUNT;
        if (amount.compareTo(current) > 0) {
            throw new RuntimeException("提现金额不能大于钱包余额");
        }
        user.setWalletBalance(current.subtract(amount));
        return userRepository.save(user);
    }

    private BigDecimal determineInitialWallet(User user) {
        if (user != null && user.getRole() != null && user.getRole().equalsIgnoreCase("ADMIN")) {
            return BigDecimal.ZERO;
        }
        return DEFAULT_WALLET_AMOUNT;
    }

    private User ensureWalletInitialized(User user) {
        if (user == null) {
            return null;
        }
        if (user.getWalletBalance() == null) {
            user.setWalletBalance(determineInitialWallet(user));
            user = userRepository.save(user);
        }
        return user;
    }
}

