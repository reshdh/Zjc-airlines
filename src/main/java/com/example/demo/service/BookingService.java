package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.ChangeBookingRequest;
import com.example.demo.dto.ChangePriceResponse;
import com.example.demo.dto.SeatSelectionRequest;
import com.example.demo.dto.SeatSelectionResponse;
import com.example.demo.entity.Booking;
import com.example.demo.entity.BookingSeat;
import com.example.demo.entity.Flight;
import com.example.demo.entity.FlightSeat;
import com.example.demo.entity.FlightPrice;
import com.example.demo.entity.Seat;
import com.example.demo.entity.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.BookingSeatRepository;
import com.example.demo.repository.FlightRepository;
import com.example.demo.repository.FlightSeatRepository;
import com.example.demo.repository.FlightPriceRepository;
import com.example.demo.repository.SeatRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class BookingService {

    private static final BigDecimal DEFAULT_WALLET_AMOUNT = new BigDecimal("200.00");
    private static final int URGENT_WINDOW_HOURS = 12;
    private static final BigDecimal URGENT_SURCHARGE_RATE = new BigDecimal("0.10");
    private static final BigDecimal URGENT_REFUND_FEE_RATE = new BigDecimal("0.01");
    private static final int CHANGE_MIN_HOURS_BEFORE_DEPARTURE = 2; // 改签最少提前小时数
    private static final BigDecimal CHANGE_FEE_RATE = new BigDecimal("0.05"); // 改签手续费率 5%

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private FlightSeatRepository flightSeatRepository;

    @Autowired
    private FlightPriceRepository flightPriceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SeatService seatService;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private BookingSeatRepository bookingSeatRepository;

    public Booking createBooking(BookingRequest request) {
        // 获取航班和用户
        Flight flight = flightRepository.findById(request.getFlightId())
                .orElseThrow(() -> new RuntimeException("航班不存在"));
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 检查用户状态
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用，暂无法购买机票，请联系管理员");
        }

        validatePassengerIdentities(request);
        List<String> passengerNames = resolvePassengerNames(request, user);

        // 获取指定舱位的座位信息
        if (request.getCabinClass() == null || request.getCabinClass().isEmpty()) {
            throw new RuntimeException("请选择舱位等级");
        }

        boolean useNewSeatSystem = false;
        FlightSeat legacyFlightSeat = null;
        FlightPrice flightPrice = flightPriceRepository
                .findByFlightIdAndCabinClass(request.getFlightId(), request.getCabinClass())
                .orElse(null);

        BigDecimal cabinPrice;
        int remainingSeats;

        if (flightPrice != null) {
            useNewSeatSystem = true;
            cabinPrice = flightPrice.getBasePrice();
            remainingSeats = calculateRemainingSeatsFromSeatTable(request.getFlightId(), request.getCabinClass());
        } else {
            legacyFlightSeat = flightSeatRepository
                    .findByFlightIdAndCabinClass(request.getFlightId(), request.getCabinClass())
                    .orElseThrow(() -> new RuntimeException("该航班不存在指定的舱位等级"));
            cabinPrice = legacyFlightSeat.getPrice();
            remainingSeats = legacyFlightSeat.getRemainingSeats();
        }

        if (remainingSeats < request.getTicketCount()) {
            throw new RuntimeException("该舱位剩余座位不足");
        }

        boolean urgentDeparture = isWithinUrgentWindow(flight.getDepartureTime());
        BigDecimal baseAmount = cabinPrice
                .multiply(BigDecimal.valueOf(request.getTicketCount()));
        BigDecimal surchargeRate = urgentDeparture ? URGENT_SURCHARGE_RATE : BigDecimal.ZERO;
        BigDecimal totalAmount = baseAmount
                .add(baseAmount.multiply(surchargeRate))
                .setScale(2, RoundingMode.HALF_UP);

        boolean payLater = Boolean.TRUE.equals(request.getPayLater());

        BigDecimal walletBalance = user.getWalletBalance();
        if (walletBalance == null) {
            walletBalance = isAdmin(user) ? BigDecimal.ZERO : DEFAULT_WALLET_AMOUNT;
            user.setWalletBalance(walletBalance);
        }

        if (!payLater && walletBalance.compareTo(totalAmount) < 0) {
            throw new RuntimeException("钱包余额不足，请先充值或减少购票数量");
        }

        // 创建预订
        Booking booking = new Booking();
        booking.setFlight(flight);
        booking.setUser(user);
        booking.setCabinClass(request.getCabinClass());
        booking.setTicketCount(request.getTicketCount());
        booking.setTotalAmount(totalAmount);
        booking.setUrgentSurchargeRate(surchargeRate);
        booking.setRefundFeeRate(BigDecimal.ZERO);
        booking.setRefundFeeAmount(BigDecimal.ZERO);
        booking.setStatus(payLater ? "CREATED" : "PAID");
        booking.setPaymentDueAt(payLater ? LocalDateTime.now().plusMinutes(15) : null);

        // 更新舱位剩余座位数（仅旧系统使用）
        if (!useNewSeatSystem && legacyFlightSeat != null) {
            legacyFlightSeat.setRemainingSeats(legacyFlightSeat.getRemainingSeats() - request.getTicketCount());
            flightSeatRepository.save(legacyFlightSeat);
        }

        // 扣减钱包余额（仅立即支付）
        if (!payLater) {
            user.setWalletBalance(walletBalance.subtract(totalAmount));
            userRepository.save(user);
        } else {
            // 确保钱包初始化
            userRepository.save(user);
        }

        Booking savedBooking = bookingRepository.save(booking);

        assignSeatsIfNeeded(request, savedBooking, useNewSeatSystem, passengerNames);

        return savedBooking;
    }

    private int calculateRemainingSeatsFromSeatTable(Long flightId, String cabinClass) {
        String normalizedCabin = cabinClass != null ? cabinClass.toUpperCase() : "ECONOMY";
        long availableSeats = seatRepository.countByFlightIdAndCabinClassAndIsAvailableTrue(flightId, normalizedCabin);
        long occupied = bookingSeatRepository.countOccupiedSeats(flightId, normalizedCabin);
        long remaining = Math.max(availableSeats - occupied, 0);
        return (int) remaining;
    }

    private void assignSeatsIfNeeded(BookingRequest request, Booking savedBooking, boolean useNewSeatSystem, List<String> passengerNames) {
        if (!useNewSeatSystem) {
            // 旧系统：只有用户主动选择座位列时才尝试分配
            if (request.getSelectedSeatColumns() == null || request.getSelectedSeatColumns().isEmpty()) {
                return;
            }
        }

        SeatSelectionRequest seatRequest = new SeatSelectionRequest();
        seatRequest.setFlightId(request.getFlightId());
        seatRequest.setCabinClass(request.getCabinClass());
        seatRequest.setTicketCount(request.getTicketCount());
        seatRequest.setSelectedColumns(request.getSelectedSeatColumns() != null
                ? new ArrayList<>(request.getSelectedSeatColumns())
                : new ArrayList<>());

        SeatSelectionResponse seatResponse = seatService.selectSeats(seatRequest);

        if (useNewSeatSystem) {
            if (seatResponse.getAssignedSeats() == null
                    || seatResponse.getAssignedSeats().size() < request.getTicketCount()) {
                throw new RuntimeException("该舱位剩余座位不足，请稍后再试");
            }
        } else {
            if (seatResponse.getAssignedSeats() == null || seatResponse.getAssignedSeats().isEmpty()) {
                return;
            }
        }

        // 如果有已满的列，记录日志提示
        if (seatResponse.getUnavailableColumns() != null && !seatResponse.getUnavailableColumns().isEmpty()) {
            System.out.println("警告：以下列座位已满，已自动分配其他列：" + seatResponse.getUnavailableColumns());
        }

        List<String> assignedSeats = seatResponse.getAssignedSeats();
        for (int i = 0; i < assignedSeats.size() && i < request.getTicketCount(); i++) {
            String seatNumber = assignedSeats.get(i);
            Optional<Seat> seatOpt = seatRepository.findByFlightIdAndSeatNumber(
                    request.getFlightId(), seatNumber);

            if (seatOpt.isPresent()) {
                Seat seat = seatOpt.get();
                BookingSeat bookingSeat = new BookingSeat();
                bookingSeat.setBooking(savedBooking);
                bookingSeat.setSeat(seat);
                bookingSeat.setPassengerIndex(i);
                if (passengerNames != null && i < passengerNames.size()) {
                    bookingSeat.setPassengerName(passengerNames.get(i));
                }
                bookingSeatRepository.save(bookingSeat);
                if (savedBooking.getBookingSeats() != null) {
                    savedBooking.getBookingSeats().add(bookingSeat);
                }
            }
        }
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预订不存在"));
    }

    public List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Booking> getFlightBookings(Long flightId) {
        return bookingRepository.findByFlightId(flightId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getRecentBookings(int limit) {
        int pageSize = limit > 0 ? limit : 6;
        Pageable pageable = PageRequest.of(0, pageSize);
        return bookingRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Booking updateBookingStatus(Long id, String status) {
        Booking booking = getBookingById(id);
        
        if (status == null || status.trim().isEmpty()) {
            throw new RuntimeException("状态不能为空");
        }
        String normalizedStatus = status.trim().toUpperCase();
        String currentStatus = booking.getStatus() != null ? booking.getStatus().toUpperCase() : "";

        User bookingUser = booking.getUser();
        if (bookingUser != null && bookingUser.getStatus() != null && bookingUser.getStatus() == 0) {
            if ("PAID".equals(normalizedStatus)) {
                throw new RuntimeException("账号已被禁用，暂无法支付待支付的订单，请联系管理员");
            }
        }

        if ("CANCELED".equals(normalizedStatus) && !"CANCELED".equals(currentStatus)) {
            // 退票时恢复座位
            FlightSeat flightSeat = flightSeatRepository
                    .findByFlightIdAndCabinClass(booking.getFlight().getId(), booking.getCabinClass())
                    .orElseThrow(() -> new RuntimeException("该舱位信息不存在"));
            flightSeat.setRemainingSeats(flightSeat.getRemainingSeats() + booking.getTicketCount());
            flightSeatRepository.save(flightSeat);
        }
        
        booking.setStatus(normalizedStatus);
        return bookingRepository.save(booking);
    }

    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        
        // 删除预订时恢复座位
        if (!"CANCELED".equals(booking.getStatus())) {
            FlightSeat flightSeat = flightSeatRepository
                    .findByFlightIdAndCabinClass(booking.getFlight().getId(), booking.getCabinClass())
                    .orElseThrow(() -> new RuntimeException("该舱位信息不存在"));
            flightSeat.setRemainingSeats(flightSeat.getRemainingSeats() + booking.getTicketCount());
            flightSeatRepository.save(flightSeat);
        }
        
        bookingRepository.deleteById(id);
    }

    public Booking payPendingBooking(Long bookingId, Long userId) {
        Booking booking = getOwnedBooking(bookingId, userId);
        if (!"CREATED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("当前订单状态不可支付");
        }
        if (booking.getPaymentDueAt() == null || booking.getPaymentDueAt().isBefore(LocalDateTime.now())) {
            releasePendingBooking(booking);
            throw new RuntimeException("支付已超时，订单已自动取消，请重新下单");
        }
        User user = booking.getUser();
        BigDecimal walletBalance = user.getWalletBalance();
        if (walletBalance == null) {
            walletBalance = isAdmin(user) ? BigDecimal.ZERO : DEFAULT_WALLET_AMOUNT;
            user.setWalletBalance(walletBalance);
        }
        BigDecimal totalAmount = booking.getTotalAmount();
        if (walletBalance.compareTo(totalAmount) < 0) {
            throw new RuntimeException("钱包余额不足，请先充值或减少购票数量");
        }
        user.setWalletBalance(walletBalance.subtract(totalAmount));
        booking.setStatus("PAID");
        booking.setPaymentDueAt(null);
        userRepository.save(user);
        return bookingRepository.save(booking);
    }

    public Booking cancelPendingBooking(Long bookingId, Long userId) {
        Booking booking = getOwnedBooking(bookingId, userId);
        if (!"CREATED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("只有待支付订单可以取消");
        }
        restoreSeatsForBooking(booking);
        booking.setStatus("CANCELED");
        booking.setPaymentDueAt(null);
        return bookingRepository.save(booking);
    }

    public Booking requestRefund(Long bookingId, Long userId, String reason) {
        Booking booking = getOwnedBooking(bookingId, userId);
        if (!"PAID".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("只有已出票的订单才能申请退票");
        }
        LocalDateTime departureTime = booking.getFlight().getDepartureTime();
        if (departureTime == null) {
            throw new RuntimeException("无法获取航班起飞时间，暂无法退票");
        }
        LocalDateTime now = LocalDateTime.now();
        boolean within12Hours = isWithinUrgentWindow(departureTime);
        long canceledLast24h = bookingRepository.countByUserIdAndStatusAndUpdatedAtAfter(
                userId, "CANCELED", now.minusHours(24));
        boolean exceedCancelLimit = canceledLast24h >= 3;

        booking.setRefundReason(StringUtils.hasText(reason) ? reason.trim() : null);
        booking.setRefundRejectReason(null);

        if (within12Hours || exceedCancelLimit) {
            booking.setStatus("REFUND_REVIEW");
            return bookingRepository.save(booking);
        }

        return finalizeRefund(booking);
    }

    public Booking reviewRefund(Long bookingId, boolean approve, String rejectReason) {
        Booking booking = getBookingById(bookingId);
        if (!"REFUND_REVIEW".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("该订单不在退票审核状态");
        }
        if (approve) {
            booking.setRefundRejectReason(null);
            return finalizeRefund(booking);
        }
        if (!StringUtils.hasText(rejectReason)) {
            throw new RuntimeException("驳回退票必须填写理由");
        }
        booking.setRefundRejectReason(rejectReason.trim());
        booking.setStatus("REFUND_REJECTED");
        return bookingRepository.save(booking);
    }

    @Scheduled(fixedDelay = 60000)
    public void releaseExpiredPendingBookings() {
        List<Booking> expired = bookingRepository.findByStatusAndPaymentDueAtBefore(
                "CREATED", LocalDateTime.now());
        for (Booking booking : expired) {
            releasePendingBooking(booking);
        }
    }

    private Booking getOwnedBooking(Long bookingId, Long userId) {
        Booking booking = getBookingById(bookingId);
        if (booking.getUser() == null) {
            throw new RuntimeException("订单用户信息不存在");
        }
        Long bookingUserId = booking.getUser().getId();
        if (bookingUserId == null || !bookingUserId.equals(userId)) {
            throw new RuntimeException("您无权操作该订单");
        }
        return booking;
    }

    private void restoreSeatsForBooking(Booking booking) {
        if (booking.getFlight() == null || booking.getCabinClass() == null) {
            return;
        }
        flightSeatRepository
                .findByFlightIdAndCabinClass(booking.getFlight().getId(), booking.getCabinClass())
                .ifPresent(flightSeat -> {
                    flightSeat.setRemainingSeats(flightSeat.getRemainingSeats() + booking.getTicketCount());
                    flightSeatRepository.save(flightSeat);
                });
        // 如果找不到旧系统的 FlightSeat 记录，说明该航班使用新座位系统；
        // 新系统以 booking.status 是否为 CANCELED 作为占座判断，因此无需额外处理。
    }

    private void releasePendingBooking(Booking booking) {
        restoreSeatsForBooking(booking);
        booking.setStatus("CANCELED");
        booking.setPaymentDueAt(null);
        bookingRepository.save(booking);
    }

    private Booking finalizeRefund(Booking booking) {
        restoreSeatsForBooking(booking);
        booking.setStatus("CANCELED");
        booking.setPaymentDueAt(null);
        booking.setRefundRejectReason(null);

        User user = booking.getUser();
        BigDecimal walletBalance = user.getWalletBalance();
        if (walletBalance == null) {
            walletBalance = isAdmin(user) ? BigDecimal.ZERO : DEFAULT_WALLET_AMOUNT;
        }

        BigDecimal refundAmount = booking.getTotalAmount() != null
                ? booking.getTotalAmount()
                : BigDecimal.ZERO;
        boolean chargeFee = isWithinUrgentWindow(
                booking.getFlight() != null ? booking.getFlight().getDepartureTime() : null);
        BigDecimal feeRate = chargeFee ? URGENT_REFUND_FEE_RATE : BigDecimal.ZERO;
        BigDecimal feeAmount = refundAmount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netRefund = refundAmount.subtract(feeAmount);
        if (netRefund.compareTo(BigDecimal.ZERO) < 0) {
            netRefund = BigDecimal.ZERO;
        }

        booking.setRefundFeeRate(feeRate);
        booking.setRefundFeeAmount(feeAmount);

        user.setWalletBalance(walletBalance.add(netRefund));
        userRepository.save(user);

        return bookingRepository.save(booking);
    }

    private void validatePassengerIdentities(BookingRequest request) {
        if (request == null || request.getPassengers() == null || request.getPassengers().isEmpty()) {
            return;
        }
        Set<String> idNumbers = new HashSet<>();
        Set<String> phones = new HashSet<>();
        int index = 0;
        for (BookingRequest.PassengerInfo passenger : request.getPassengers()) {
            index++;
            if (passenger == null) {
                continue;
            }
            String idNumber = passenger.getIdNumber() != null ? passenger.getIdNumber().trim().toUpperCase() : "";
            String phone = passenger.getPhone() != null ? passenger.getPhone().trim() : "";
            if (idNumber.isEmpty()) {
                throw new RuntimeException("乘客 " + index + " 的身份证号不能为空");
            }
            if (phone.isEmpty()) {
                throw new RuntimeException("乘客 " + index + " 的联系电话不能为空");
            }
            if (!idNumbers.add(idNumber)) {
                throw new RuntimeException("身份证号 " + idNumber + " 已被重复使用，请为每位乘客填写不同的证件信息");
            }
            if (!phones.add(phone)) {
                throw new RuntimeException("联系电话 " + phone + " 已被重复使用，请为每位乘客填写不同的联系电话");
            }
        }
    }

    private List<String> resolvePassengerNames(BookingRequest request, User user) {
        List<String> names = new ArrayList<>();
        int ticketCount = request.getTicketCount() != null ? request.getTicketCount() : 0;
        if (ticketCount <= 0) {
            return names;
        }

        String fallbackName = user != null
                ? (user.getName() != null ? user.getName() : user.getUsername())
                : "乘客";

        if (request.getPassengers() != null) {
            for (BookingRequest.PassengerInfo passenger : request.getPassengers()) {
                if (passenger == null) {
                    continue;
                }
                String name = passenger.getName();
                if (name != null && !name.isBlank()) {
                    names.add(name.trim());
                } else {
                    names.add(fallbackName);
                }
                if (names.size() >= ticketCount) {
                    break;
                }
            }
        }

        while (names.size() < ticketCount) {
            names.add(fallbackName);
        }

        return names;
    }

    private boolean isWithinUrgentWindow(LocalDateTime departureTime) {
        if (departureTime == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (!departureTime.isAfter(now)) {
            return false;
        }
        return !departureTime.isAfter(now.plusHours(URGENT_WINDOW_HOURS));
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRole() != null && user.getRole().equalsIgnoreCase("ADMIN");
    }
    
    private CabinInventory resolveCabinInventory(Long flightId, String cabinClass) {
        if (flightId == null) {
            throw new RuntimeException("航班信息缺失，无法获取舱位信息");
        }
        String normalizedCabin = (cabinClass == null || cabinClass.isBlank())
                ? "ECONOMY"
                : cabinClass.trim().toUpperCase();
        CabinInventory inventory = new CabinInventory(normalizedCabin);
        FlightPrice price = flightPriceRepository
                .findByFlightIdAndCabinClass(flightId, normalizedCabin)
                .orElse(null);
        if (price != null) {
            inventory.setPrice(price.getBasePrice());
            inventory.setRemainingSeats(calculateRemainingSeatsFromSeatTable(flightId, normalizedCabin));
            inventory.setNewSeatSystem(true);
            return inventory;
        }
        FlightSeat legacySeat = flightSeatRepository
                .findByFlightIdAndCabinClass(flightId, normalizedCabin)
                .orElseThrow(() -> new RuntimeException("新航班不存在指定的舱位等级"));
        inventory.setPrice(legacySeat.getPrice());
        inventory.setRemainingSeats(
                legacySeat.getRemainingSeats() != null ? legacySeat.getRemainingSeats() : 0);
        inventory.setLegacyFlightSeat(legacySeat);
        inventory.setNewSeatSystem(false);
        return inventory;
    }
    
    private static class CabinInventory {
        private final String cabinClass;
        private BigDecimal price;
        private int remainingSeats;
        private FlightSeat legacyFlightSeat;
        private boolean newSeatSystem;
        
        CabinInventory(String cabinClass) {
            this.cabinClass = cabinClass;
        }
        
        public BigDecimal getPrice() {
            return price;
        }
        
        public void setPrice(BigDecimal price) {
            this.price = price;
        }
        
        public int getRemainingSeats() {
            return remainingSeats;
        }
        
        public void setRemainingSeats(int remainingSeats) {
            this.remainingSeats = remainingSeats;
        }
        
        public Optional<FlightSeat> getLegacyFlightSeat() {
            return Optional.ofNullable(legacyFlightSeat);
        }
        
        public void setLegacyFlightSeat(FlightSeat legacyFlightSeat) {
            this.legacyFlightSeat = legacyFlightSeat;
        }
        
        public String getCabinClass() {
            return cabinClass;
        }
        
        public boolean isNewSeatSystem() {
            return newSeatSystem;
        }
        
        public void setNewSeatSystem(boolean newSeatSystem) {
            this.newSeatSystem = newSeatSystem;
        }
    }

    /**
     * 检查订单是否可以改签
     */
    public boolean canChangeBooking(Long bookingId, Long userId) {
        Booking booking = getOwnedBooking(bookingId, userId);
        
        // 只有已支付的订单可以改签
        if (!"PAID".equalsIgnoreCase(booking.getStatus())) {
            return false;
        }
        
        // 改签后的新订单不能再次改签（如果 originalBookingId 不为 null 且不等于自己，说明这是改签产生的新订单）
        if (booking.getOriginalBookingId() != null && !booking.getOriginalBookingId().equals(bookingId)) {
            return false;
        }
        
        // 已改签的原订单不能再次改签（如果 originalBookingId 等于自己，说明这是已改签的原订单）
        if (booking.getOriginalBookingId() != null && booking.getOriginalBookingId().equals(bookingId)) {
            return false;
        }
        
        // 检查原航班是否已起飞
        Flight originalFlight = booking.getFlight();
        if (originalFlight == null || originalFlight.getDepartureTime() == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime departureTime = originalFlight.getDepartureTime();
        
        // 必须在起飞前至少2小时改签
        if (!departureTime.isAfter(now.plusHours(CHANGE_MIN_HOURS_BEFORE_DEPARTURE))) {
            return false;
        }
        
        return true;
    }

    /**
     * 计算改签价格
     */
    public ChangePriceResponse calculateChangePrice(Long bookingId, Long userId, ChangeBookingRequest request) {
        Booking booking = getOwnedBooking(bookingId, userId);
        
        if (!canChangeBooking(bookingId, userId)) {
            throw new RuntimeException("该订单不可改签");
        }
        
        // 获取新航班信息
        Flight newFlight = flightRepository.findById(request.getNewFlightId())
                .orElseThrow(() -> new RuntimeException("新航班不存在"));
        
        // 验证新航班必须与原航班有相同的出发地和目的地
        Flight originalFlight = booking.getFlight();
        if (originalFlight != null) {
            if (newFlight.getOrigin() != null && originalFlight.getOrigin() != null) {
                if (!newFlight.getOrigin().equals(originalFlight.getOrigin())) {
                    throw new RuntimeException("改签航班必须与原航班有相同的出发地");
                }
            }
            if (newFlight.getDestination() != null && originalFlight.getDestination() != null) {
                if (!newFlight.getDestination().equals(originalFlight.getDestination())) {
                    throw new RuntimeException("改签航班必须与原航班有相同的目的地");
                }
            }
        }
        
        // 验证新航班起飞时间不能早于原航班
        if (newFlight.getDepartureTime() != null && originalFlight.getDepartureTime() != null) {
            if (newFlight.getDepartureTime().isBefore(originalFlight.getDepartureTime())) {
                throw new RuntimeException("新航班起飞时间不能早于原航班");
            }
        }
        
        // 获取新舱位信息
        String newCabinClass = request.getNewCabinClass() != null
                ? request.getNewCabinClass().toUpperCase()
                : (booking.getCabinClass() != null ? booking.getCabinClass().toUpperCase() : "ECONOMY");
        if (Objects.equals(newFlight.getId(), originalFlight.getId())
                && newCabinClass.equalsIgnoreCase(booking.getCabinClass())) {
            throw new RuntimeException("请更换不同的航班或舱位，改签不能选择当前航班的相同舱位");
        }
        CabinInventory newCabin = resolveCabinInventory(request.getNewFlightId(), newCabinClass);
        
        // 获取票数（默认不变）
        int newTicketCount = request.getNewTicketCount() != null ? request.getNewTicketCount() : booking.getTicketCount();
        if (newTicketCount <= 0) {
            throw new RuntimeException("票数必须大于0");
        }
        
        // 检查新航班剩余座位
        if (newCabin.getRemainingSeats() < newTicketCount) {
            throw new RuntimeException("新航班该舱位剩余座位不足");
        }
        
        // 计算新订单金额
        boolean urgentDeparture = isWithinUrgentWindow(newFlight.getDepartureTime());
        BigDecimal baseAmount = newCabin.getPrice()
                .multiply(BigDecimal.valueOf(newTicketCount));
        BigDecimal surchargeRate = urgentDeparture ? URGENT_SURCHARGE_RATE : BigDecimal.ZERO;
        BigDecimal newAmount = baseAmount
                .add(baseAmount.multiply(surchargeRate))
                .setScale(2, RoundingMode.HALF_UP);
        
        // 计算原订单退款（扣除退票手续费）
        BigDecimal originalAmount = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        boolean chargeRefundFee = isWithinUrgentWindow(originalFlight.getDepartureTime());
        BigDecimal refundFeeRate = chargeRefundFee ? URGENT_REFUND_FEE_RATE : BigDecimal.ZERO;
        BigDecimal refundFeeAmount = originalAmount.multiply(refundFeeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal refundAmount = originalAmount.subtract(refundFeeAmount);
        
        // 计算改签手续费（基于新订单金额的5%）
        BigDecimal changeFee = newAmount.multiply(CHANGE_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
        
        // 计算差价（新订单金额 + 改签手续费 - 退款金额）
        BigDecimal priceDifference = newAmount.add(changeFee).subtract(refundAmount);
        
        return new ChangePriceResponse(newAmount, refundAmount, changeFee, priceDifference);
    }

    /**
     * 执行改签
     */
    @Transactional
    public Booking changeBooking(Long bookingId, Long userId, ChangeBookingRequest request) {
        Booking booking = getOwnedBooking(bookingId, userId);
        
        if (!canChangeBooking(bookingId, userId)) {
            throw new RuntimeException("该订单不可改签");
        }
        
        // 计算改签价格
        ChangePriceResponse priceInfo = calculateChangePrice(bookingId, userId, request);
        
        // 获取新航班和舱位信息
        Flight newFlight = flightRepository.findById(request.getNewFlightId())
                .orElseThrow(() -> new RuntimeException("新航班不存在"));
        
        String newCabinClass = request.getNewCabinClass() != null
                ? request.getNewCabinClass().toUpperCase()
                : (booking.getCabinClass() != null ? booking.getCabinClass().toUpperCase() : "ECONOMY");
        CabinInventory newCabin = resolveCabinInventory(request.getNewFlightId(), newCabinClass);
        
        int newTicketCount = request.getNewTicketCount() != null ? request.getNewTicketCount() : booking.getTicketCount();
        
        // 保存原订单信息（用于标记原订单为已改签）
        Flight originalFlight = booking.getFlight();
        int originalTicketCount = booking.getTicketCount(); // 保存原票数
        String originalCabinClass = booking.getCabinClass(); // 保存原舱位
        BigDecimal originalTotalAmount = booking.getTotalAmount(); // 保存原金额
        
        // 标记原订单为"已改签"（通过设置 originalBookingId 指向自己，并设置 changeFeeAmount）
        booking.setOriginalBookingId(booking.getId()); // 指向自己，表示这是原订单且已被改签
        booking.setChangeFeeAmount(priceInfo.getChangeFee()); // 设置改签手续费，用于前端判断
        booking.setChangeReason(StringUtils.hasText(request.getChangeReason()) ? request.getChangeReason().trim() : null);
        
        // 保存原订单信息到历史记录字段（保留在原订单中，用于显示）
        booking.setOriginalFlightId(originalFlight != null ? originalFlight.getId() : null);
        booking.setOriginalCabinClass(originalCabinClass);
        booking.setOriginalTotalAmount(originalTotalAmount);
        
        // 创建新订单（改签后的订单）
        Booking newBooking = new Booking();
        newBooking.setFlight(newFlight);
        newBooking.setUser(booking.getUser());
        newBooking.setCabinClass(newCabinClass);
        newBooking.setTicketCount(newTicketCount);
        newBooking.setTotalAmount(priceInfo.getNewAmount());
        
        // 计算并设置新的紧急加价率
        boolean urgentDeparture = isWithinUrgentWindow(newFlight.getDepartureTime());
        BigDecimal surchargeRate = urgentDeparture ? URGENT_SURCHARGE_RATE : BigDecimal.ZERO;
        newBooking.setUrgentSurchargeRate(surchargeRate);
        
        // 新订单状态为"已出票"（因为原订单已支付）
        newBooking.setStatus("PAID");
        newBooking.setPaymentDueAt(null); // 不需要支付期限，因为已支付
        
        // 新订单指向原订单
        newBooking.setOriginalBookingId(booking.getId());
        
        // 新订单不应该有改签手续费（只有原订单有）
        newBooking.setChangeFeeAmount(BigDecimal.ZERO);
        newBooking.setChangeReason(null);
        
        // 保存新订单的历史信息（可选，用于追溯）
        newBooking.setOriginalFlightId(originalFlight != null ? originalFlight.getId() : null);
        newBooking.setOriginalCabinClass(originalCabinClass);
        newBooking.setOriginalTotalAmount(originalTotalAmount);
        
        // 初始化退票相关字段
        newBooking.setRefundReason(null);
        newBooking.setRefundRejectReason(null);
        newBooking.setRefundFeeRate(BigDecimal.ZERO);
        newBooking.setRefundFeeAmount(BigDecimal.ZERO);
        
        // 恢复原航班座位（使用原票数）
        flightSeatRepository
                .findByFlightIdAndCabinClass(originalFlight.getId(), originalCabinClass)
                .ifPresent(originalFlightSeat -> {
                    originalFlightSeat.setRemainingSeats(
                            originalFlightSeat.getRemainingSeats() + originalTicketCount);
                    flightSeatRepository.save(originalFlightSeat);
                });
        
        // 扣减新航班座位
        if (newCabin.getLegacyFlightSeat().isPresent()) {
            FlightSeat legacySeat = newCabin.getLegacyFlightSeat().get();
            legacySeat.setRemainingSeats(legacySeat.getRemainingSeats() - newTicketCount);
            flightSeatRepository.save(legacySeat);
        }
        
        // 处理钱包余额
        User user = booking.getUser();
        BigDecimal walletBalance = user.getWalletBalance();
        if (walletBalance == null) {
            walletBalance = isAdmin(user) ? BigDecimal.ZERO : DEFAULT_WALLET_AMOUNT;
        }
        
        // 退款 + 补款
        walletBalance = walletBalance.add(priceInfo.getRefundAmount()).subtract(priceInfo.getNewAmount()).subtract(priceInfo.getChangeFee());
        
        // 检查余额是否足够
        if (walletBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("钱包余额不足，无法完成改签。需要支付: ¥" + walletBalance.abs());
        }
        
        user.setWalletBalance(walletBalance);
        userRepository.save(user);
        
        try {
            // 验证新订单的必填字段
            if (newBooking.getUser() == null) {
                throw new RuntimeException("新订单的 user 不能为 null");
            }
            if (newBooking.getFlight() == null) {
                throw new RuntimeException("新订单的 flight 不能为 null");
            }
            if (newBooking.getCabinClass() == null || newBooking.getCabinClass().isEmpty()) {
                throw new RuntimeException("新订单的 cabinClass 不能为空");
            }
            if (newBooking.getTicketCount() == null || newBooking.getTicketCount() <= 0) {
                throw new RuntimeException("新订单的 ticketCount 必须大于 0");
            }
            if (newBooking.getTotalAmount() == null) {
                throw new RuntimeException("新订单的 totalAmount 不能为 null");
            }
            if (newBooking.getStatus() == null || newBooking.getStatus().isEmpty()) {
                throw new RuntimeException("新订单的 status 不能为空");
            }
            
            System.out.println("[改签] 准备保存新订单，flightId: " + newFlight.getId() + ", userId: " + booking.getUser().getId() + ", cabinClass: " + newCabinClass + ", ticketCount: " + newTicketCount);
            System.out.println("[改签] 新订单字段验证通过，user: " + (newBooking.getUser() != null ? newBooking.getUser().getId() : "null") + ", flight: " + (newBooking.getFlight() != null ? newBooking.getFlight().getId() : "null") + ", status: " + newBooking.getStatus());
            
            Booking savedNewBooking = bookingRepository.save(newBooking); // 保存新订单
            bookingRepository.flush(); // 立即刷新，确保新订单已持久化并获得ID
            
            // 为新订单分配座位（仅限新座位系统）
            List<String> passengerNames = collectPassengerNamesForChange(booking, newTicketCount);
            assignSeatsForChangedBooking(savedNewBooking, newCabin, newTicketCount, passengerNames);
            
            System.out.println("[改签] 新订单已保存，ID: " + savedNewBooking.getId() + ", originalBookingId: " + savedNewBooking.getOriginalBookingId() + ", orderNo: " + savedNewBooking.getOrderNo() + ", status: " + savedNewBooking.getStatus() + ", userId: " + (savedNewBooking.getUser() != null ? savedNewBooking.getUser().getId() : "null"));
            
            // 验证新订单是否真的保存成功
            if (savedNewBooking.getId() == null) {
                throw new RuntimeException("新订单保存失败，ID为null");
            }
            if (savedNewBooking.getOrderNo() == null || savedNewBooking.getOrderNo().isEmpty()) {
                throw new RuntimeException("新订单保存失败，orderNo为null或空");
            }
            
            // 再保存原订单（标记为已改签）
            System.out.println("[改签] 准备保存原订单（标记为已改签），原订单ID: " + booking.getId());
            Booking savedOriginalBooking = bookingRepository.save(booking); // 保存原订单，标记为已改签
            bookingRepository.flush(); // 立即刷新
            
            System.out.println("[改签] 原订单已保存，ID: " + savedOriginalBooking.getId() + ", originalBookingId: " + savedOriginalBooking.getOriginalBookingId() + ", changeFeeAmount: " + savedOriginalBooking.getChangeFeeAmount());
            
            // 验证新订单能否被查询到
            Booking verifyBooking = bookingRepository.findById(savedNewBooking.getId()).orElse(null);
            if (verifyBooking == null) {
                throw new RuntimeException("新订单保存后无法查询到，可能保存失败。新订单ID: " + savedNewBooking.getId());
            }
            System.out.println("[改签] 验证新订单查询成功，ID: " + verifyBooking.getId() + ", orderNo: " + verifyBooking.getOrderNo());
            
            // 验证新订单在用户订单列表中能否被查询到
            List<Booking> userBookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(savedNewBooking.getUser().getId());
            boolean foundInList = userBookings.stream().anyMatch(b -> b.getId().equals(savedNewBooking.getId()));
            System.out.println("[改签] 新订单在用户订单列表中: " + (foundInList ? "是" : "否") + "，用户订单总数: " + userBookings.size());
            
            if (!foundInList) {
                System.err.println("[改签] 警告：新订单不在用户订单列表中！新订单ID: " + savedNewBooking.getId() + ", userId: " + savedNewBooking.getUser().getId());
                // 打印所有用户订单的ID
                System.out.println("[改签] 用户所有订单ID: " + userBookings.stream().map(b -> b.getId().toString()).collect(java.util.stream.Collectors.joining(", ")));
            }
            
            // 返回新订单
            return savedNewBooking;
        } catch (Exception e) {
            System.err.println("[改签] 保存新订单时发生异常: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("改签失败: " + e.getMessage(), e);
        }
    }

    private List<String> collectPassengerNamesForChange(Booking originalBooking, int expectedCount) {
        List<String> names = new ArrayList<>();
        if (originalBooking != null && originalBooking.getId() != null) {
            List<BookingSeat> seats = bookingSeatRepository.findByBookingId(originalBooking.getId());
            if (seats != null && !seats.isEmpty()) {
                seats.stream()
                        .sorted(Comparator.comparing(
                                seat -> seat.getPassengerIndex() != null ? seat.getPassengerIndex() : Integer.MAX_VALUE))
                        .forEach(seat -> {
                            if (seat.getPassengerName() != null && !seat.getPassengerName().isBlank()) {
                                names.add(seat.getPassengerName().trim());
                            }
                        });
            }
        }
        String fallbackName = originalBooking != null && originalBooking.getUser() != null
                ? (originalBooking.getUser().getName() != null
                        ? originalBooking.getUser().getName()
                        : originalBooking.getUser().getUsername())
                : "乘客";
        while (names.size() < expectedCount) {
            names.add(fallbackName);
        }
        if (names.size() > expectedCount) {
            return new ArrayList<>(names.subList(0, expectedCount));
        }
        return names;
    }

    private void assignSeatsForChangedBooking(Booking newBooking,
                                              CabinInventory cabinInventory,
                                              int ticketCount,
                                              List<String> passengerNames) {
        if (newBooking == null
                || newBooking.getFlight() == null
                || newBooking.getFlight().getId() == null
                || cabinInventory == null
                || !cabinInventory.isNewSeatSystem()) {
            return;
        }
        SeatSelectionRequest seatRequest = new SeatSelectionRequest();
        seatRequest.setFlightId(newBooking.getFlight().getId());
        seatRequest.setCabinClass(cabinInventory.getCabinClass());
        seatRequest.setTicketCount(ticketCount);
        seatRequest.setSelectedColumns(new ArrayList<>());

        SeatSelectionResponse response = seatService.selectSeats(seatRequest);
        if (response.getAssignedSeats() == null || response.getAssignedSeats().size() < ticketCount) {
            throw new RuntimeException("新舱位暂无足够的可用座位，请稍后再试");
        }

        List<BookingSeat> existingSeats = bookingSeatRepository.findByBookingId(newBooking.getId());
        if (existingSeats != null && !existingSeats.isEmpty()) {
            bookingSeatRepository.deleteAll(existingSeats);
        }

        for (int i = 0; i < ticketCount; i++) {
            String seatNumber = response.getAssignedSeats().get(i);
            Seat seat = seatRepository.findByFlightIdAndSeatNumber(newBooking.getFlight().getId(), seatNumber)
                    .orElseThrow(() -> new RuntimeException("分配的座位不存在: " + seatNumber));
            BookingSeat bookingSeat = new BookingSeat();
            bookingSeat.setBooking(newBooking);
            bookingSeat.setSeat(seat);
            bookingSeat.setPassengerIndex(i);
            if (passengerNames != null && i < passengerNames.size()) {
                bookingSeat.setPassengerName(passengerNames.get(i));
            }
            bookingSeatRepository.save(bookingSeat);
        }
    }
}