import { baseURLMap } from "@/config";

// #ifdef   H5  || APP  || APP-PLUS
// @ts-ignore
export const DEV = import.meta.env.MODE === "development" ? "develop" : "release";
// #endif

// #ifdef   MP
// @ts-ignore
export const DEV = uni.getAccountInfoSync().miniProgram.envVersion;
// #endif

export const USER_TOKEN = "USER_TOKEN";
export const BASE_PATH = "/mobile";
export const BASE_URL = (baseURLMap as any)[DEV].api_url;
export const APPID = "APPID";
export const CONGIG = "CONFIG";
export const USER_INFO = "USER_INFO";
export const VERSION = "3.0.3";
export const CONFIG = "CONFIG";
export const BASE64 = "data:image/png;base64,";
export const SELECT_ADDRESS = "SELECT_ADDRESS";
export const SELECT_STORE = "SELECT_STORE";
export const REFRESH_ORDER = "refreshorder";
