package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.UserStatsResponse;
import com.example.demo.dto.UserStatusRequest;
import com.example.demo.dto.WalletRechargeRequest;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            // 不返回密码
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("注册成功", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request);
            // 不返回密码
            user.setPassword(null);
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", user);
            data.put("token", "mock-token-" + user.getId()); // 简化版，实际应使用 JWT
            
            return ResponseEntity.ok(ApiResponse.success("登录成功", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats() {
        try {
            UserStatsResponse stats = userService.getUserStats();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            users.forEach(user -> user.setPassword(null));
            return ResponseEntity.ok(ApiResponse.success(users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Long id,
            @RequestBody User userDetails) {
        try {
            User user = userService.updateUser(id, userDetails);
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("更新成功", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<User>> resetPassword(
            @PathVariable Long id,
            @RequestBody(required = false) ResetPasswordRequest request) {
        try {
            User user = userService.resetPassword(id, request != null ? request.getNewPassword() : null);
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("密码已重置", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<User>> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {
        try {
            User user = userService.changePassword(id, request);
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("密码修改成功", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<User>> updateStatus(
            @PathVariable Long id,
            @RequestBody UserStatusRequest request) {
        try {
            if (request == null || request.getStatus() == null) {
                throw new RuntimeException("缺少启用状态参数");
            }
            User user = userService.updateStatus(id, request.getStatus());
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("状态已更新", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/wallet/recharge")
    public ResponseEntity<ApiResponse<User>> rechargeWallet(
            @PathVariable Long id,
            @RequestBody WalletRechargeRequest request) {
        try {
            if (request == null || request.getAmount() == null) {
                throw new RuntimeException("充值金额不能为空");
            }
            User user = userService.rechargeWallet(id, request.getAmount());
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("充值成功", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/wallet/withdraw")
    public ResponseEntity<ApiResponse<User>> withdrawWallet(
            @PathVariable Long id,
            @RequestBody WalletRechargeRequest request) {
        try {
            if (request == null || request.getAmount() == null) {
                throw new RuntimeException("提现金额不能为空");
            }
            User user = userService.withdrawWallet(id, request.getAmount());
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success("提现成功，资金将自动退回原账户", user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}

