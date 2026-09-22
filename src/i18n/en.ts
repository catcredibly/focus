import zhCN from "./zh-CN";

const en = Object.fromEntries(Object.keys(zhCN).map((key) => [key, key])) as Record<keyof typeof zhCN, string>;

export default en;
