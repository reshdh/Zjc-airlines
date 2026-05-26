package com.example.demo.dto;

import java.util.List;

public class UserStatsResponse {
    private long totalUsers;
    private long adminUsers;
    private long activeUsers;
    private long disabledUsers;
    private List<DailyStat> recentRegistrations;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getAdminUsers() {
        return adminUsers;
    }

    public void setAdminUsers(long adminUsers) {
        this.adminUsers = adminUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getDisabledUsers() {
        return disabledUsers;
    }

    public void setDisabledUsers(long disabledUsers) {
        this.disabledUsers = disabledUsers;
    }

    public List<DailyStat> getRecentRegistrations() {
        return recentRegistrations;
    }

    public void setRecentRegistrations(List<DailyStat> recentRegistrations) {
        this.recentRegistrations = recentRegistrations;
    }

    public static class DailyStat {
        private String date;
        private long count;

        public DailyStat() {
        }

        public DailyStat(String date, long count) {
            this.date = date;
            this.count = count;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }
    }
}





