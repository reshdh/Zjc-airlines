import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Spinner,
  StackDivider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flightApi } from "@/lib/flights";

const FETCH_DEBOUNCE_MS = 200;
const DEFAULT_LIMIT = 20;

const cityGroups: Record<string, string[]> = {
  热门城市: [
    "北京",
    "上海",
    "广州",
    "深圳",
    "成都",
    "重庆",
    "厦门",
    "昆明",
    "杭州",
    "西安",
    "武汉",
    "长沙",
    "南京",
    "大连",
    "郑州",
    "青岛",
    "天津",
    "三亚",
    "海口",
    "乌鲁木齐",
  ],
  ABCDE: [
    "鞍山",
    "安庆",
    "保定",
    "包头",
    "长春",
    "常州",
    "长沙",
    "大连",
    "东莞",
    "鄂尔多斯",
  ],
  FGHJ: [
    "福州",
    "佛山",
    "广州",
    "桂林",
    "贵阳",
    "哈尔滨",
    "合肥",
    "呼和浩特",
    "杭州",
    "济南",
  ],
  KLMNP: [
    "昆明",
    "兰州",
    "连云港",
    "洛阳",
    "绵阳",
    "牡丹江",
    "南昌",
    "南宁",
    "宁波",
    "攀枝花",
  ],
  QRSTW: [
    "青岛",
    "泉州",
    "日照",
    "上海",
    "沈阳",
    "深圳",
    "石家庄",
    "台州",
    "太原",
    "温州",
    "武汉",
    "无锡",
  ],
  XYZ: [
    "西安",
    "徐州",
    "烟台",
    "银川",
    "盐城",
    "扬州",
    "珠海",
    "中山",
    "张家界",
  ],
};

const groupKeys = Object.keys(cityGroups);

export interface CityPickerProps {
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  icon?: ReactNode;
  size?: string;
  variant?: "classic" | "fuzzy";
}

type InternalCityPickerProps = Omit<CityPickerProps, "variant">;

export function CityPicker({ variant = "classic", ...rest }: CityPickerProps) {
  if (variant === "fuzzy") {
    return <FuzzyCityPicker {...rest} />;
  }
  return <ClassicCityPicker {...rest} />;
}

function FuzzyCityPicker({
  value,
  placeholder = "请选择城市",
  onChange,
  onSelect,
  icon,
  size = "md",
}: InternalCityPickerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const latestKeywordRef = useRef<string>("");
  const normalizedInput = useMemo(() => inputValue.trim(), [inputValue]);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const fetchCities = useCallback(async (keyword: string) => {
    const normalized = keyword.trim();
    latestKeywordRef.current = normalized;

    if (!normalized) {
      setSuggestions([]);
      setIsLoading(false);
      setFetchError(null);
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await flightApi.searchCities(normalized, DEFAULT_LIMIT);
      if (latestKeywordRef.current === normalized) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error("获取城市列表失败:", error);
      if (latestKeywordRef.current === normalized) {
        setFetchError("无法获取城市列表，请稍后重试");
        setSuggestions([]);
      }
    } finally {
      if (latestKeywordRef.current === normalized) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handle = window.setTimeout(() => {
      fetchCities(inputValue);
    }, FETCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [inputValue, isOpen, fetchCities]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!isOpen) {
      onOpen();
    }
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    onSelect?.(city);
    onClose();
    window.setTimeout(() => {
      inputRef.current?.blur();
    }, 0);
  };

  const renderHighlightedCity = (city: string) => {
    if (!normalizedInput) {
      return <Text as="span">{city}</Text>;
    }
    const regex = new RegExp(`(${normalizedInput})`, "ig");
    const segments = city.split(regex);
    return (
      <Text as="span">
        {segments.map((segment, index) => {
          const isMatch =
            segment &&
            normalizedInput &&
            segment.toLowerCase() === normalizedInput.toLowerCase() &&
            index % 2 === 1;
          return (
            <Box
              as="span"
              key={`${segment}-${index}`}
              color={isMatch ? "blue.600" : undefined}
              fontWeight={isMatch ? "semibold" : undefined}
            >
              {segment}
            </Box>
          );
        })}
      </Text>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Center py={4}>
          <Spinner size="sm" color="blue.500" />
        </Center>
      );
    }
    if (fetchError) {
      return (
        <Box py={4}>
          <Text fontSize="sm" color="red.400" textAlign="center">
            {fetchError}
          </Text>
        </Box>
      );
    }
    if (!normalizedInput) {
      return (
        <Box py={4}>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            输入城市关键词
          </Text>
        </Box>
      );
    }
    if (suggestions.length === 0) {
      return (
        <Box py={4}>
          <Text fontSize="sm" color="gray.400" textAlign="center">
            暂无匹配城市
          </Text>
        </Box>
      );
    }
    return (
      <VStack
        align="stretch"
        spacing={0}
        divider={<StackDivider borderColor="gray.100" />}
        maxH="260px"
        overflowY="auto"
      >
        {suggestions.map((city) => (
          <Button
            key={city}
            variant="ghost"
            justifyContent="flex-start"
            size="sm"
            borderRadius={0}
            px={4}
            py={3}
            onClick={() => handleSelect(city)}
            _hover={{ bg: "blue.50", color: "blue.600" }}
          >
            <HStack spacing={3}>
              <SearchIcon color="gray.400" />
              <Text fontWeight="medium">{renderHighlightedCity(city)}</Text>
            </HStack>
          </Button>
        ))}
      </VStack>
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const updateMenuRect = useCallback(() => {
    if (!isOpen) {
      setMenuRect(null);
      return;
    }
    const container = containerRef.current;
    if (!container) {
      setMenuRect(null);
      return;
    }
    const rect = container.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (menuRef.current && menuRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setMenuRect(null);
      return;
    }
    updateMenuRect();
    const handle = () => updateMenuRect();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [isOpen, updateMenuRect]);

  return (
    <Box position="relative" ref={containerRef}>
      <InputGroup>
        {icon && <InputLeftElement pointerEvents="none">{icon}</InputLeftElement>}
        <Input
          ref={inputRef}
          value={inputValue}
          placeholder={placeholder}
          cursor="text"
          size={size}
          bg="gray.50"
          autoComplete="off"
          onChange={handleInputChange}
          onFocus={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const trimmed = inputValue.trim();
              if (trimmed) {
                onChange(trimmed);
                onSelect?.(trimmed);
                onClose();
                window.setTimeout(() => {
                  inputRef.current?.blur();
                }, 0);
              }
              event.preventDefault();
            } else if (event.key === "Escape") {
              onClose();
            }
          }}
          _focus={{
            bg: "white",
            borderColor: "blue.500",
            boxShadow: "0 0 0 1px #3182ce",
          }}
        />
      </InputGroup>
      {isOpen && menuRect && (
        <Portal>
          <Box
            ref={menuRef}
            position="absolute"
            top={`${menuRect.top}px`}
            left={`${menuRect.left}px`}
            width={`${menuRect.width}px`}
            zIndex={1400}
            mt={1}
            borderRadius="xl"
            bg="rgba(255,255,255,0.97)"
            backdropFilter="blur(8px)"
            boxShadow="2xl"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
          >
            <Box px={0}>
              {renderContent()}
              <Box px={4} py={2} borderTop="1px solid" borderColor="gray.100">
                <Text fontSize="xs" color="gray.500">
                  支持模糊输入（中文 / 拼音 / 英文），按回车或点击城市即可选择
                </Text>
              </Box>
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
}

function ClassicCityPicker({
  value,
  placeholder = "请选择城市",
  onChange,
  onSelect,
  icon,
  size = "md",
}: InternalCityPickerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inputValue, setInputValue] = useState(value || "");
  const [tabIndex, setTabIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyword = inputValue.trim().toLowerCase();

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const cityTabs = useMemo(
    () => groupKeys.map((key) => ({ label: key, cities: cityGroups[key] })),
    []
  );

  const filterCity = useCallback(
    (city: string) => {
      if (!keyword) {
        return true;
      }
      return city.toLowerCase().includes(keyword);
    },
    [keyword]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!isOpen) {
      onOpen();
    }
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    onSelect?.(city);
    onClose();
    window.setTimeout(() => {
      inputRef.current?.blur();
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (popoverContentRef.current && popoverContentRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  return (
    <Box ref={containerRef}>
      <Popover
        isOpen={isOpen}
        closeOnBlur
        placement="bottom-start"
        offset={[0, 6]}
        returnFocusOnClose={false}
      >
        <PopoverTrigger>
          <Box>
            <InputGroup>
              {icon && <InputLeftElement pointerEvents="none">{icon}</InputLeftElement>}
              <Input
                ref={inputRef}
                value={inputValue}
                placeholder={placeholder}
                cursor="text"
                size={size}
                bg="gray.50"
                autoComplete="off"
                onFocus={onOpen}
                onChange={handleInputChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const trimmed = inputValue.trim();
                    if (trimmed) {
                      onChange(trimmed);
                      onSelect?.(trimmed);
                      onClose();
                      window.setTimeout(() => {
                        inputRef.current?.blur();
                      }, 0);
                    }
                    event.preventDefault();
                  } else if (event.key === "Escape") {
                    onClose();
                  }
                }}
                _focus={{
                  bg: "white",
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px #3182ce",
                }}
              />
            </InputGroup>
          </Box>
        </PopoverTrigger>
        <PopoverContent
          ref={popoverContentRef}
          w="520px"
          maxW="90vw"
          borderRadius="xl"
          _focus={{ boxShadow: "lg" }}
        >
          <PopoverArrow />
          <PopoverBody>
            <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed" size="sm">
              <TabList mb={4} flexWrap="wrap" gap={2}>
                {cityTabs.map((tab) => (
                  <Tab key={tab.label}>{tab.label}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {cityTabs.map((tab) => {
                  const filtered = tab.cities.filter(filterCity);
                  return (
                    <TabPanel key={tab.label} px={0}>
                      {filtered.length > 0 ? (
                        <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2}>
                          {filtered.map((city) => (
                            <Button
                              key={city}
                              variant="ghost"
                              justifyContent="flex-start"
                              size="sm"
                              onClick={() => handleSelect(city)}
                            >
                              {city}
                            </Button>
                          ))}
                        </SimpleGrid>
                      ) : (
                        <Box py={4}>
                          <Text fontSize="sm" color="gray.400" textAlign="center">
                            暂无匹配城市
                          </Text>
                        </Box>
                      )}
                    </TabPanel>
                  );
                })}
              </TabPanels>
              <Text fontSize="xs" color="gray.500" mt={3}>
                支持模糊输入（中文 / 拼音 / 英文），可直接键入或点击城市
              </Text>
            </Tabs>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
}
