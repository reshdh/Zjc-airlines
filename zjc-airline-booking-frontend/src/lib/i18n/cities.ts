import type { Language } from "@/context/LanguageContext";

type CityLanguage = Language;

const cityNameMap: Record<
  string,
  {
    "zh-CN": string;
    "en-US": string;
  }
> = {
  北京: { "zh-CN": "北京", "en-US": "Beijing" },
  上海: { "zh-CN": "上海", "en-US": "Shanghai" },
  广州: { "zh-CN": "广州", "en-US": "Guangzhou" },
  深圳: { "zh-CN": "深圳", "en-US": "Shenzhen" },
  杭州: { "zh-CN": "杭州", "en-US": "Hangzhou" },
  成都: { "zh-CN": "成都", "en-US": "Chengdu" },
  武汉: { "zh-CN": "武汉", "en-US": "Wuhan" },
  重庆: { "zh-CN": "重庆", "en-US": "Chongqing" },
  郑州: { "zh-CN": "郑州", "en-US": "Zhengzhou" },
  西安: { "zh-CN": "西安", "en-US": "Xi'an" },
  南京: { "zh-CN": "南京", "en-US": "Nanjing" },
  青岛: { "zh-CN": "青岛", "en-US": "Qingdao" },
  厦门: { "zh-CN": "厦门", "en-US": "Xiamen" },
  昆明: { "zh-CN": "昆明", "en-US": "Kunming" },
  天津: { "zh-CN": "天津", "en-US": "Tianjin" },
  济南: { "zh-CN": "济南", "en-US": "Jinan" },
  大连: { "zh-CN": "大连", "en-US": "Dalian" },
  香港: { "zh-CN": "香港", "en-US": "Hong Kong" },
  澳门: { "zh-CN": "澳门", "en-US": "Macau" },
  台北: { "zh-CN": "台北", "en-US": "Taipei" },
};

export const translateCity = (
  city?: string,
  lang: CityLanguage = "zh-CN"
) => cityNameMap[city || ""]?.[lang] || city || "";

export const formatRoute = (
  from?: string,
  to?: string,
  lang: CityLanguage = "zh-CN"
) => {
  const fromName = translateCity(from, lang);
  const toName = translateCity(to, lang);
  if (!fromName && !toName) return "";
  const arrow = lang === "en-US" ? " → " : " → ";
  return `${fromName}${fromName && toName ? arrow : ""}${toName}`;
};

export const parseRouteString = (route?: string) => {
  if (!route) {
    return { from: "", to: "" };
  }
  const parts = route.split(/→|-/).map((part) => part.trim());
  if (parts.length >= 2) {
    return { from: parts[0], to: parts[1] };
  }
  return { from: route, to: "" };
};

export const getRouteLabel = (
  flight: { from?: string; to?: string; route?: string },
  lang: CityLanguage
) => {
  const resolvedFrom = flight.from || parseRouteString(flight.route).from;
  const resolvedTo = flight.to || parseRouteString(flight.route).to;
  return (
    formatRoute(resolvedFrom, resolvedTo, lang) ||
    flight.route ||
    ""
  );
};




