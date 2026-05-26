package com.example.demo.service;

import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;
import com.example.demo.entity.FlightSeat;
import com.example.demo.entity.FlightPrice;
import com.example.demo.repository.FlightRepository;
import com.example.demo.repository.FlightSeatRepository;
import com.example.demo.repository.FlightPriceRepository;
import com.example.demo.repository.SeatRepository;
import com.example.demo.repository.BookingSeatRepository;
import com.example.demo.repository.BookingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class FlightService {

    private static final Logger log = LoggerFactory.getLogger(FlightService.class);

    private static final Set<String> LEGACY_FLIGHT_NUMBERS = new HashSet<>(
            Arrays.asList(
                    "ZJC001",
                    "ZJC002",
                    "ZJC003",
                    "ZJC004",
                    "ZJC005",
                    "ZJC006",
                    "ZJC007",
                    "ZJC008",
                    "ZJC009",
                    "ZJC010",
                    "ZJC011",
                    "ZJC012",
                    "ZJC013",
                    "ZJC014",
                    "ZJC015",
                    "ZJC017",
                    "999",
                    "CA444",
                    "CA2222"
            )
    );
    
    private static final Map<String, List<String>> DEFAULT_CABIN_COLUMNS = new HashMap<>();
    static {
        DEFAULT_CABIN_COLUMNS.put("FIRST", Arrays.asList("A", "D"));
        DEFAULT_CABIN_COLUMNS.put("BUSINESS", Arrays.asList("A", "B", "C", "D"));
        DEFAULT_CABIN_COLUMNS.put("ECONOMY", Arrays.asList("A", "B", "C", "D", "E", "F"));
    }

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private FlightSeatRepository flightSeatRepository;

    @Autowired
    private FlightPriceRepository flightPriceRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private BookingSeatRepository bookingSeatRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @PostConstruct
    public void purgeLegacyFlightsOnStartup() {
        try {
            int legacyRemoved = purgeLegacyFlights();
            int invalidRemoved = purgeInvalidFlights();
            if (legacyRemoved > 0) {
                log.info("自动清理 {} 条旧版航班记录", legacyRemoved);
            }
            if (invalidRemoved > 0) {
                log.info("自动清理 {} 条异常航班记录", invalidRemoved);
            }
        } catch (Exception ex) {
            log.warn("自动清理旧版航班记录失败: {}", ex.getMessage(), ex);
        }
    }

    public List<Flight> getAllFlights(boolean includePast) {
        // 按照创建时间降序排列（最新的航班在前面）
        List<Flight> flights = flightRepository.findAllByOrderByCreatedAtDesc();
        return prepareFlightList(flights, includePast);
    }

    public Flight getFlightById(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("航班不存在"));
        loadFlightSeats(flight);
        return flight;
    }

    public Flight getFlightByNumber(String flightNumber) {
        Flight flight = flightRepository.findByFlightNumber(flightNumber)
                .orElseThrow(() -> new RuntimeException("航班不存在"));
        loadFlightSeats(flight);
        return flight;
    }

    public List<Flight> searchFlights(FlightSearchRequest request, boolean includePast) {
        String originKeyword = normalizeKeyword(request.getOrigin());
        String destinationKeyword = normalizeKeyword(request.getDestination());

        List<Flight> flights;
        if (originKeyword != null && destinationKeyword != null) {
            flights = flightRepository.findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(
                    originKeyword,
                    destinationKeyword
            );
        } else if (originKeyword != null) {
            flights = flightRepository.findByOriginContainingIgnoreCase(originKeyword);
        } else if (destinationKeyword != null) {
            flights = flightRepository.findByDestinationContainingIgnoreCase(destinationKeyword);
        } else {
            flights = flightRepository.findAvailableFlights();
        }
        return prepareFlightList(flights, includePast);
    }

    public List<Flight> getAvailableFlights(boolean includePast) {
        // findAvailableFlights() 已经过滤了过去的航班，但如果 includePast=true，需要获取所有航班
        List<Flight> flights = includePast 
            ? flightRepository.findAll() 
            : flightRepository.findAvailableFlights();
        return prepareFlightList(flights, includePast);
    }

    public Flight createFlight(Flight flight) {
        // 检查航班号是否已存在
        if (flightRepository.findByFlightNumber(flight.getFlightNumber()).isPresent()) {
            throw new RuntimeException("航班号已存在");
        }
        validateFlightTimings(flight);
        flight.setRemarks(sanitizeRemarks(flight.getRemarks()));
        if (flight.getRemarks() != null && flight.getRemarks().length() > 500) {
            throw new RuntimeException("备注长度不能超过 500 字符");
        }
        prepareSeatEntities(flight);
        Flight savedFlight = flightRepository.save(flight);
        syncSeatSystemFromLegacySeats(savedFlight);
        loadFlightSeats(savedFlight);
        return savedFlight;
    }

    public Flight updateFlight(Long id, Flight flightDetails) {
        validateFlightTimings(flightDetails);
        Flight flight = getFlightById(id);
        flight.setFlightNumber(flightDetails.getFlightNumber());
        flight.setAircraftType(flightDetails.getAircraftType());
        flight.setOrigin(flightDetails.getOrigin());
        flight.setDestination(flightDetails.getDestination());
        flight.setDepartureTime(flightDetails.getDepartureTime());
        flight.setArrivalTime(flightDetails.getArrivalTime());
        flight.setRemarks(sanitizeRemarks(flightDetails.getRemarks()));
        if (flight.getRemarks() != null && flight.getRemarks().length() > 500) {
            throw new RuntimeException("备注长度不能超过 500 字符");
        }
        flight.setDestination(flightDetails.getDestination());
        flight.setDepartureTime(flightDetails.getDepartureTime());
        flight.setArrivalTime(flightDetails.getArrivalTime());

        flight.getSeats().clear();
        if (flightDetails.getSeats() != null) {
            for (FlightSeat seat : flightDetails.getSeats()) {
                seat.setFlight(flight);
                normalizeSeatCounts(seat);
                flight.getSeats().add(seat);
            }
        }

        Flight savedFlight = flightRepository.save(flight);
        syncSeatSystemFromLegacySeats(savedFlight);
        loadFlightSeats(savedFlight);
        return savedFlight;
    }

    public void deleteFlight(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("航班不存在"));

        long totalBookings = bookingRepository.countByFlightId(id);
        if (totalBookings > 0) {
            throw new RuntimeException("该航班仍有关联订单，无法删除，请先处理相关订单");
        }

        seatRepository.deleteByFlightId(id);
        flightRepository.delete(flight);
    }

    private int purgeLegacyFlights() {
        List<Flight> legacyFlights = flightRepository.findByFlightNumberIn(LEGACY_FLIGHT_NUMBERS);
        List<Long> legacyIds = extractFlightIds(legacyFlights);
        return cascadeDeleteFlights(legacyIds);
    }

    private int purgeInvalidFlights() {
        List<Flight> allFlights = flightRepository.findAll();
        List<Long> invalidIds = allFlights.stream()
                .filter(Objects::nonNull)
                .filter(flight -> !isScheduleValid(flight))
                .map(Flight::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return cascadeDeleteFlights(invalidIds);
    }

    private List<Long> extractFlightIds(List<Flight> flights) {
        if (flights == null || flights.isEmpty()) {
            return new ArrayList<>();
        }
        return flights.stream()
                .map(Flight::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private int cascadeDeleteFlights(List<Long> flightIds) {
        if (flightIds == null || flightIds.isEmpty()) {
            return 0;
        }
        bookingRepository.deleteByFlightIdIn(flightIds);
        flightPriceRepository.deleteByFlightIdIn(flightIds);
        flightSeatRepository.deleteByFlightIdIn(flightIds);
        seatRepository.deleteByFlightIdIn(flightIds);
        flightRepository.deleteAllById(flightIds);
        return flightIds.size();
    }

    public List<Flight> getRecommendedFlights(int limit, boolean includePast) {
        int effectiveLimit = limit > 0 ? limit : 3;
        List<Flight> recommendations = new ArrayList<>();
        Set<Long> usedIds = new HashSet<>();

        List<Flight> topBooked = flightRepository.findTopFlightsByBookingCount(effectiveLimit);
        for (Flight flight : topBooked) {
            if (usedIds.add(flight.getId())) {
                recommendations.add(flight);
                if (recommendations.size() >= effectiveLimit) {
                    return recommendations;
                }
            }
        }

        if (recommendations.size() < effectiveLimit) {
            int remaining = effectiveLimit - recommendations.size();
            Page<Flight> fallbackPage = flightRepository.findAllByOrderByRemainingSeatsDesc(
                    PageRequest.of(0, Math.max(remaining, 1)));
            for (Flight flight : fallbackPage.getContent()) {
                if (usedIds.add(flight.getId())) {
                    recommendations.add(flight);
                    if (recommendations.size() >= effectiveLimit) {
                        return recommendations;
                    }
                }
            }
        }

        if (recommendations.isEmpty()) {
            List<Flight> available = flightRepository.findAvailableFlights();
            for (Flight flight : available) {
                if (usedIds.add(flight.getId())) {
                    recommendations.add(flight);
                    if (recommendations.size() >= effectiveLimit) {
                        break;
                    }
                }
            }
        }

        // 加载每个推荐航班的座位信息
        return prepareFlightList(recommendations, includePast);
    }

    @Transactional(readOnly = true)
    public List<String> searchCities(String keyword, int limit) {
        String normalized = normalizeKeyword(keyword);
        if (normalized == null || normalized.isEmpty()) {
            // 如果没有关键词，返回所有城市
            String lowered = null;
            List<String> origins = flightRepository.findDistinctOrigins(lowered);
            List<String> destinations = flightRepository.findDistinctDestinations(lowered);
            LinkedHashSet<String> merged = new LinkedHashSet<>();
            if (origins != null) {
                origins.stream()
                        .filter(city -> city != null && !city.isBlank())
                        .forEach(city -> merged.add(city.trim()));
            }
            if (destinations != null) {
                destinations.stream()
                        .filter(city -> city != null && !city.isBlank())
                        .forEach(city -> merged.add(city.trim()));
            }
            return new ArrayList<>(merged);
        }
        
        String lowered = normalized.toLowerCase();
        
        // 获取所有城市
        List<String> allOrigins = flightRepository.findDistinctOrigins(null);
        List<String> allDestinations = flightRepository.findDistinctDestinations(null);
        LinkedHashSet<String> allCities = new LinkedHashSet<>();
        if (allOrigins != null) {
            allOrigins.stream()
                    .filter(city -> city != null && !city.isBlank())
                    .forEach(city -> allCities.add(city.trim()));
        }
        if (allDestinations != null) {
            allDestinations.stream()
                    .filter(city -> city != null && !city.isBlank())
                    .forEach(city -> allCities.add(city.trim()));
        }
        
        // 先尝试直接匹配（中文、英文）
        LinkedHashSet<String> directMatched = new LinkedHashSet<>();
        List<String> origins = flightRepository.findDistinctOrigins(lowered);
        List<String> destinations = flightRepository.findDistinctDestinations(lowered);
        if (origins != null) {
            origins.stream()
                    .filter(city -> city != null && !city.isBlank())
                    .forEach(city -> directMatched.add(city.trim()));
        }
        if (destinations != null) {
            destinations.stream()
                    .filter(city -> city != null && !city.isBlank())
                    .forEach(city -> directMatched.add(city.trim()));
        }
        
        // 使用拼音匹配过滤城市
        List<String> pinyinMatched = allCities.stream()
                .filter(city -> matchesCityByPinyin(lowered, city))
                .collect(Collectors.toList());
        
        // 合并直接匹配和拼音匹配的结果
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        merged.addAll(directMatched);
        merged.addAll(pinyinMatched);

        int effectiveLimit = limit > 0 ? Math.min(limit, 50) : 20;
        if (merged.size() <= effectiveLimit) {
            return new ArrayList<>(merged);
        }
        List<String> limited = new ArrayList<>(effectiveLimit);
        int count = 0;
        for (String city : merged) {
            limited.add(city);
            count++;
            if (count >= effectiveLimit) {
                break;
            }
        }
        return limited;
    }
    
    /**
     * 使用拼音匹配城市
     */
    private boolean matchesCityByPinyin(String keyword, String cityName) {
        if (keyword == null || cityName == null) {
            return false;
        }
        
        String lowerKeyword = keyword.toLowerCase().trim();
        String lowerCity = cityName.toLowerCase().trim();
        
        // 1. 直接匹配中文城市名
        if (lowerCity.contains(lowerKeyword)) {
            return true;
        }
        
        // 2. 拼音全拼匹配（如 "beijing" 匹配 "北京"）
        String cityPinyin = getCityPinyin(cityName);
        if (cityPinyin != null) {
            if (cityPinyin.contains(lowerKeyword) || lowerKeyword.contains(cityPinyin)) {
                return true;
            }
            // 支持部分拼音匹配（如 "beij" 匹配 "beijing"）
            if (cityPinyin.startsWith(lowerKeyword) || lowerKeyword.startsWith(cityPinyin)) {
                return true;
            }
        }
        
        // 3. 拼音首字母匹配（如 "bj" 匹配 "北京"）
        String cityPinyinInitials = getCityPinyinInitials(cityName);
        if (cityPinyinInitials != null) {
            if (cityPinyinInitials.equals(lowerKeyword) || cityPinyinInitials.startsWith(lowerKeyword) || lowerKeyword.startsWith(cityPinyinInitials)) {
                return true;
            }
        }
        
        // 4. 如果拼音全拼不为空，检查关键词是否是拼音的一部分
        if (cityPinyin != null && lowerKeyword.length() >= 2) {
            // 检查关键词是否是拼音的开头部分
            if (cityPinyin.length() >= lowerKeyword.length() && cityPinyin.substring(0, Math.min(lowerKeyword.length(), cityPinyin.length())).equals(lowerKeyword)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 获取城市的拼音
     */
    private String getCityPinyin(String cityName) {
        return CITY_PINYIN_MAP.getOrDefault(cityName, null);
    }
    
    /**
     * 获取城市的拼音首字母
     */
    private String getCityPinyinInitials(String cityName) {
        return CITY_PINYIN_INITIALS_MAP.getOrDefault(cityName, null);
    }
    
    // 常用城市拼音映射表
    private static final Map<String, String> CITY_PINYIN_MAP = createCityPinyinMap();
    
    private static Map<String, String> createCityPinyinMap() {
        Map<String, String> map = new HashMap<>();
        map.put("北京", "beijing");
        map.put("上海", "shanghai");
        map.put("广州", "guangzhou");
        map.put("深圳", "shenzhen");
        map.put("成都", "chengdu");
        map.put("重庆", "chongqing");
        map.put("杭州", "hangzhou");
        map.put("武汉", "wuhan");
        map.put("西安", "xian");
        map.put("南京", "nanjing");
        map.put("天津", "tianjin");
        map.put("苏州", "suzhou");
        map.put("长沙", "changsha");
        map.put("郑州", "zhengzhou");
        map.put("沈阳", "shenyang");
        map.put("青岛", "qingdao");
        map.put("大连", "dalian");
        map.put("厦门", "xiamen");
        map.put("昆明", "kunming");
        map.put("哈尔滨", "haerbin");
        map.put("济南", "jinan");
        map.put("合肥", "hefei");
        map.put("福州", "fuzhou");
        map.put("石家庄", "shijiazhuang");
        map.put("太原", "taiyuan");
        map.put("南昌", "nanchang");
        map.put("南宁", "nanning");
        map.put("海口", "haikou");
        map.put("乌鲁木齐", "wulumuqi");
        map.put("兰州", "lanzhou");
        map.put("银川", "yinchuan");
        map.put("西宁", "xining");
        map.put("拉萨", "lasa");
        map.put("呼和浩特", "huhehaote");
        map.put("三亚", "sanya");
        map.put("无锡", "wuxi");
        map.put("佛山", "foshan");
        map.put("东莞", "dongguan");
        map.put("宁波", "ningbo");
        map.put("温州", "wenzhou");
        map.put("珠海", "zhuhai");
        map.put("中山", "zhongshan");
        map.put("烟台", "yantai");
        map.put("泉州", "quanzhou");
        map.put("台州", "taizhou");
        map.put("嘉兴", "jiaxing");
        map.put("绍兴", "shaoxing");
        map.put("湖州", "huzhou");
        map.put("金华", "jinhua");
        map.put("镇江", "zhenjiang");
        map.put("扬州", "yangzhou");
        map.put("泰州", "taizhou");
        map.put("盐城", "yancheng");
        map.put("南通", "nantong");
        map.put("徐州", "xuzhou");
        map.put("连云港", "lianyungang");
        map.put("洛阳", "luoyang");
        map.put("开封", "kaifeng");
        map.put("张家界", "zhangjiajie");
        return map;
    }
    
    // 常用城市拼音首字母映射表
    private static final Map<String, String> CITY_PINYIN_INITIALS_MAP = createCityPinyinInitialsMap();
    
    private static Map<String, String> createCityPinyinInitialsMap() {
        Map<String, String> map = new HashMap<>();
        map.put("北京", "bj");
        map.put("上海", "sh");
        map.put("广州", "gz");
        map.put("深圳", "sz");
        map.put("成都", "cd");
        map.put("重庆", "cq");
        map.put("杭州", "hz");
        map.put("武汉", "wh");
        map.put("西安", "xa");
        map.put("南京", "nj");
        map.put("天津", "tj");
        map.put("苏州", "sz");
        map.put("长沙", "cs");
        map.put("郑州", "zz");
        map.put("沈阳", "sy");
        map.put("青岛", "qd");
        map.put("大连", "dl");
        map.put("厦门", "xm");
        map.put("昆明", "km");
        map.put("哈尔滨", "heb");
        map.put("济南", "jn");
        map.put("合肥", "hf");
        map.put("福州", "fz");
        map.put("石家庄", "sjz");
        map.put("太原", "ty");
        map.put("南昌", "nc");
        map.put("南宁", "nn");
        map.put("海口", "hk");
        map.put("乌鲁木齐", "wlmq");
        map.put("兰州", "lz");
        map.put("银川", "yc");
        map.put("西宁", "xn");
        map.put("拉萨", "ls");
        map.put("呼和浩特", "hhht");
        map.put("三亚", "sy");
        map.put("无锡", "wx");
        map.put("佛山", "fs");
        map.put("东莞", "dg");
        map.put("宁波", "nb");
        map.put("温州", "wz");
        map.put("珠海", "zh");
        map.put("中山", "zs");
        map.put("烟台", "yt");
        map.put("泉州", "qz");
        map.put("台州", "tz");
        map.put("嘉兴", "jx");
        map.put("绍兴", "sx");
        map.put("湖州", "hz");
        map.put("金华", "jh");
        map.put("镇江", "zj");
        map.put("扬州", "yz");
        map.put("泰州", "tz");
        map.put("盐城", "yc");
        map.put("南通", "nt");
        map.put("徐州", "xz");
        map.put("连云港", "lyg");
        map.put("洛阳", "ly");
        map.put("开封", "kf");
        map.put("张家界", "zjj");
        return map;
    }

    /**
     * 加载航班的座位信息
     * 从新的座位系统（seats 表和 flight_prices 表）加载数据，转换为 FlightSeat 格式以保持前端兼容性
     */
    private void loadFlightSeats(Flight flight) {
        if (flight == null || flight.getId() == null) {
            return;
        }

        try {
            List<FlightPrice> prices = flightPriceRepository.findByFlightId(flight.getId());
            if (prices != null && !prices.isEmpty()) {
                Map<String, SeatRepository.CabinSeatSummary> seatSummaryMap = seatRepository
                        .summarizeSeatsByFlight(flight.getId())
                        .stream()
                        .collect(Collectors.toMap(
                                summary -> summary.getCabinClass().toUpperCase(),
                                summary -> summary
                        ));

                Map<String, Long> occupiedMap = bookingSeatRepository
                        .summarizeOccupiedSeats(flight.getId())
                        .stream()
                        .collect(Collectors.toMap(
                                summary -> summary.getCabinClass().toUpperCase(),
                                summary -> summary.getOccupiedSeats()
                        ));

                List<FlightSeat> flightSeats = new ArrayList<>();
                for (FlightPrice price : prices) {
                    String cabinClass = price.getCabinClass() != null
                            ? price.getCabinClass().toUpperCase()
                            : "ECONOMY";
                    SeatRepository.CabinSeatSummary seatSummary = seatSummaryMap.get(cabinClass);

                    long totalSeats = seatSummary != null
                            ? defaultLong(seatSummary.getTotalSeats())
                            : seatRepository.countByFlightIdAndCabinClass(flight.getId(), cabinClass);
                    long availableSeats = seatSummary != null
                            ? defaultLong(seatSummary.getAvailableSeats())
                            : seatRepository.countByFlightIdAndCabinClassAndIsAvailableTrue(flight.getId(), cabinClass);
                    long occupiedSeats = occupiedMap.getOrDefault(cabinClass, 0L);
                    long remainingSeats = Math.max(availableSeats - occupiedSeats, 0);

                    FlightSeat flightSeat = new FlightSeat();
                    flightSeat.setFlight(flight);
                    flightSeat.setCabinClass(cabinClass);
                    flightSeat.setPrice(price.getBasePrice());
                    flightSeat.setTotalSeats((int) Math.max(totalSeats, 0));
                    flightSeat.setRemainingSeats((int) Math.max(remainingSeats, 0));
                    flightSeats.add(flightSeat);
                }

                flight.setTransientSeats(flightSeats);
                if (flight.getSeats() == null) {
                    flight.setSeats(new ArrayList<>());
                } else {
                    flight.getSeats().clear();
                }
                return;
            }

            // 如果没有 flight_prices 记录，回退到旧的 flight_seats 表
            List<FlightSeat> oldSeats = flightSeatRepository.findByFlightId(flight.getId());
            if (oldSeats != null && !oldSeats.isEmpty()) {
                flight.setTransientSeats(new ArrayList<>());
                if (flight.getSeats() == null) {
                    flight.setSeats(new ArrayList<>());
                } else {
                    flight.getSeats().clear();
                }
                flight.getSeats().addAll(oldSeats);
            } else {
                ensureSeatCollectionsInitialized(flight);
            }
        } catch (Exception e) {
            System.out.println("加载航班座位信息失败: " + e.getMessage());
            ensureSeatCollectionsInitialized(flight);
        }
    }

    private List<Flight> prepareFlightList(List<Flight> flights, boolean includePast) {
        if (flights == null) {
            return new ArrayList<>();
        }
        LocalDateTime now = LocalDateTime.now();
        List<Flight> futureFlights = new ArrayList<>();
        for (Flight flight : flights) {
            if (flight == null) {
                continue;
            }
            LocalDateTime departureTime = flight.getDepartureTime();
            if (departureTime == null) {
                continue;
            }
            if (!includePast && departureTime.isBefore(now)) {
                continue;
            }
            if (!isScheduleValid(flight)) {
                log.debug("过滤异常时刻表航班: {}", flight.getFlightNumber());
                continue;
            }
            loadFlightSeats(flight);
            if (!hasPositivePricing(flight)) {
                log.debug("过滤票价为 0 的航班: {}", flight.getFlightNumber());
                continue;
            }
            futureFlights.add(flight);
        }
        return futureFlights;
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void syncFlightSeats(Flight flight, List<FlightSeat> incomingSeats) {
        if (incomingSeats == null || incomingSeats.isEmpty()) {
            throw new RuntimeException("请至少配置一个舱位信息");
        }
        List<FlightSeat> existingSeats = flightSeatRepository.findByFlightId(flight.getId());
        Map<String, FlightSeat> existingMap = new HashMap<>();
        for (FlightSeat seat : existingSeats) {
            existingMap.put(seat.getCabinClass().toUpperCase(), seat);
        }
        Set<String> updatedCabins = new HashSet<>();
        for (FlightSeat incoming : incomingSeats) {
            if (incoming == null || incoming.getCabinClass() == null) {
                continue;
            }
            String cabin = incoming.getCabinClass().toUpperCase();
            FlightSeat target = existingMap.get(cabin);
            FlightSeat merged = createOrUpdateSeatEntity(flight, target, incoming);
            flightSeatRepository.save(merged);
            updatedCabins.add(cabin);
        }
        for (FlightSeat seat : existingSeats) {
            if (!updatedCabins.contains(seat.getCabinClass().toUpperCase())) {
                flightSeatRepository.delete(seat);
            }
        }
    }

    private FlightSeat createOrUpdateSeatEntity(Flight flight, FlightSeat target, FlightSeat payload) {
        if (payload.getCabinClass() == null || payload.getCabinClass().isBlank()) {
            throw new RuntimeException("舱位类型不能为空");
        }
        if (payload.getPrice() == null) {
            throw new RuntimeException("舱位票价不能为空");
        }
        if (payload.getTotalSeats() == null || payload.getTotalSeats() <= 0) {
            throw new RuntimeException("舱位总座位数必须大于 0");
        }
        int remaining = payload.getRemainingSeats() != null
                ? Math.max(payload.getRemainingSeats(), 0)
                : payload.getTotalSeats();
        remaining = Math.min(remaining, payload.getTotalSeats());
        FlightSeat seat = target != null ? target : new FlightSeat();
        seat.setFlight(flight);
        seat.setCabinClass(payload.getCabinClass().toUpperCase());
        seat.setPrice(payload.getPrice());
        seat.setTotalSeats(payload.getTotalSeats());
        seat.setRemainingSeats(remaining);
        return seat;
    }

    /**
     * 为即将保存的航班准备座位实体，确保关联关系与余票数有效
     */
    private void prepareSeatEntities(Flight flight) {
        if (flight.getSeats() == null) {
            flight.setSeats(new ArrayList<>());
            return;
        }
        for (FlightSeat seat : flight.getSeats()) {
            seat.setFlight(flight);
            normalizeSeatCounts(seat);
        }
    }

    private void normalizeSeatCounts(FlightSeat seat) {
        if (seat.getTotalSeats() == null) {
            seat.setTotalSeats(0);
        }
        if (seat.getRemainingSeats() == null) {
            seat.setRemainingSeats(seat.getTotalSeats());
        } else if (seat.getRemainingSeats() > seat.getTotalSeats()) {
            seat.setRemainingSeats(seat.getTotalSeats());
        }
    }

    private void ensureSeatCollectionsInitialized(Flight flight) {
        flight.setTransientSeats(new ArrayList<>());
        if (flight.getSeats() == null) {
            flight.setSeats(new ArrayList<>());
        } else {
            flight.getSeats().clear();
        }
    }

    private long defaultLong(Long value) {
        return value != null ? value : 0L;
    }

    private boolean isScheduleValid(Flight flight) {
        if (flight == null) {
            return false;
        }
        LocalDateTime departure = flight.getDepartureTime();
        LocalDateTime arrival = flight.getArrivalTime();
        return departure != null && arrival != null && arrival.isAfter(departure);
    }

    private boolean hasPositivePricing(Flight flight) {
        List<FlightSeat> seats = flight.getTransientSeats();
        if (seats == null || seats.isEmpty()) {
            seats = flight.getSeats();
        }
        if (seats == null || seats.isEmpty()) {
            return false;
        }
        for (FlightSeat seat : seats) {
            if (seat != null && seat.getPrice() != null
                    && seat.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                return true;
            }
        }
        return false;
    }

    private void validateFlightTimings(Flight flight) {
        if (flight == null) {
            throw new RuntimeException("航班数据不能为空");
        }
        LocalDateTime departure = flight.getDepartureTime();
        LocalDateTime arrival = flight.getArrivalTime();
        if (departure == null || arrival == null) {
            throw new RuntimeException("起飞时间与到达时间不能为空");
        }
        if (!arrival.isAfter(departure)) {
            throw new RuntimeException("到达时间必须晚于起飞时间");
        }
    }

    private String sanitizeRemarks(String remarks) {
        if (remarks == null) {
            return null;
        }
        String trimmed = remarks.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
    
    /**
     * 将旧系统的舱位配置同步到 flight_prices 和 seats 表，确保新座位系统可用
     */
    private void syncSeatSystemFromLegacySeats(Flight flight) {
        if (flight == null || flight.getId() == null) {
            return;
        }
        try {
            long activeSeatBindings = bookingSeatRepository.countActiveSeatBindings(flight.getId());
            if (activeSeatBindings > 0) {
                log.info("检测到航班 {} 存在 {} 条已售座位，跳过自动生成座位以避免破坏订单记录",
                        flight.getFlightNumber(), activeSeatBindings);
                return;
            }
            List<FlightSeat> legacySeats = flightSeatRepository.findByFlightId(flight.getId());
            seatRepository.deleteByFlightId(flight.getId());
            flightPriceRepository.deleteByFlightId(flight.getId());
            // 先清理旧的座位与票价配置
            if (legacySeats == null || legacySeats.isEmpty()) {
                return;
            }
            List<FlightPrice> priceEntities = new ArrayList<>();
            List<com.example.demo.entity.Seat> seatEntities = new ArrayList<>();
            for (FlightSeat legacySeat : legacySeats) {
                if (legacySeat == null) {
                    continue;
                }
                String cabin = legacySeat.getCabinClass() != null
                        ? legacySeat.getCabinClass().toUpperCase()
                        : "ECONOMY";
                // 同步票价
                FlightPrice price = new FlightPrice();
                price.setFlight(flight);
                price.setCabinClass(cabin);
                price.setBasePrice(legacySeat.getPrice());
                priceEntities.add(price);
                // 生成具体座位
                seatEntities.addAll(generateSeatLayoutForCabin(
                        flight,
                        cabin,
                        legacySeat.getTotalSeats() != null ? legacySeat.getTotalSeats() : 0
                ));
            }
            if (!priceEntities.isEmpty()) {
                flightPriceRepository.saveAll(priceEntities);
            }
            if (!seatEntities.isEmpty()) {
                seatRepository.saveAll(seatEntities);
            }
        } catch (Exception ex) {
            log.warn("同步新座位系统数据失败: {}", ex.getMessage(), ex);
        }
    }
    
    private List<com.example.demo.entity.Seat> generateSeatLayoutForCabin(
            Flight flight,
            String cabinClass,
            int totalSeats
    ) {
        List<String> columns = DEFAULT_CABIN_COLUMNS.getOrDefault(
                cabinClass,
                DEFAULT_CABIN_COLUMNS.get("ECONOMY")
        );
        if (columns == null || columns.isEmpty() || totalSeats <= 0) {
            return new ArrayList<>();
        }
        List<com.example.demo.entity.Seat> seats = new ArrayList<>(totalSeats);
        String seatPrefix = resolveSeatPrefix(cabinClass);
        int columnsPerRow = columns.size();
        int seatCounter = 0;
        int row = 1;
        while (seatCounter < totalSeats) {
            for (String column : columns) {
                if (seatCounter >= totalSeats) {
                    break;
                }
                com.example.demo.entity.Seat seat = new com.example.demo.entity.Seat();
                seat.setFlight(flight);
                seat.setCabinClass(cabinClass);
                seat.setSeatRow(row);
                seat.setSeatColumn(column);
                seat.setSeatNumber(seatPrefix + row + column);
                seat.setSeatType(resolveSeatType(column, columns));
                seat.setPriceSurcharge(BigDecimal.ZERO);
                seat.setIsAvailable(true);
                seats.add(seat);
                seatCounter++;
            }
            row++;
        }
        return seats;
    }
    
    private String resolveSeatPrefix(String cabinClass) {
        if (cabinClass == null || cabinClass.isBlank()) {
            return "E";
        }
        String normalized = cabinClass.trim().toUpperCase();
        if (normalized.startsWith("ECONOMY")) {
            return "E";
        }
        if (normalized.startsWith("BUSINESS")) {
            return "B";
        }
        if (normalized.startsWith("FIRST")) {
            return "F";
        }
        return normalized.substring(0, Math.min(2, normalized.length()));
    }
    
    private String resolveSeatType(String column, List<String> columns) {
        if (column == null || columns == null || columns.isEmpty()) {
            return "NORMAL";
        }
        String upper = column.trim().toUpperCase();
        String first = columns.get(0).toUpperCase();
        String last = columns.get(columns.size() - 1).toUpperCase();
        if (upper.equals(first) || upper.equals(last)) {
            return "WINDOW";
        }
        if (columns.size() > 2) {
            String second = columns.get(1).toUpperCase();
            String penultimate = columns.get(columns.size() - 2).toUpperCase();
            if (upper.equals(second) || upper.equals(penultimate)) {
                return "AISLE";
            }
        }
        return "NORMAL";
    }
}

