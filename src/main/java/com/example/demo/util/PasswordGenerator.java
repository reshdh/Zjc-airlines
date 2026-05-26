package com.example.demo.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码生成工具类
 * 用于生成 BCrypt 加密后的密码哈希值
 * 
 * 使用方法：
 * 1. 运行 main 方法
 * 2. 输入要加密的密码
 * 3. 将生成的哈希值复制到数据库脚本中
 */
public class PasswordGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // 生成默认密码 "123456" 的哈希值
        String defaultPassword = "123456";
        String hashedPassword = encoder.encode(defaultPassword);
        
        System.out.println("============================================");
        System.out.println("密码生成工具");
        System.out.println("============================================");
        System.out.println("原始密码: " + defaultPassword);
        System.out.println("BCrypt 哈希值: " + hashedPassword);
        System.out.println("============================================");
        System.out.println("\n验证密码:");
        System.out.println("匹配结果: " + encoder.matches(defaultPassword, hashedPassword));
        System.out.println("============================================");
        
        // 如果需要生成其他密码，可以取消下面的注释
        /*
        String[] passwords = {"admin123", "user123", "test123"};
        for (String pwd : passwords) {
            String hash = encoder.encode(pwd);
            System.out.println("密码: " + pwd + " -> 哈希: " + hash);
        }
        */
    }
}

