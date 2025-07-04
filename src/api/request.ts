import { BASE_URL, USER_TOKEN } from '@/constant';
import { getStorage } from '@/utils';

/**
 * 网络请求配置
 */
const config = {
    baseURL: BASE_URL,
    timeout: 10000,
    header: {
        'Content-Type': 'application/json'
    }
};

/**
 * 请求拦截器
 */
const requestInterceptor = (options: UniApp.RequestOptions) => {
    // 添加基础URL
    if (!options.url.startsWith('http')) {
        options.url = config.baseURL + options.url;
    }
    
    // 添加认证头
    const token = getStorage(USER_TOKEN);
    if (token) {
        options.header = {
            ...options.header,
            'token': `${token}`,
        };
    }
    
    // 添加设备信息
    const systemInfo = uni.getSystemInfoSync();
    options.header = {
        ...options.header,
        'X-Device-Type': 'miniprogram',
        'X-Platform': systemInfo.platform,
        'X-App-Version': systemInfo.version,
    };
    
    // 请求日志
    console.log(`🚀 [${options.method?.toUpperCase() || 'GET'}] ${options.url}`, {
        data: options.data,
        header: options.header
    });
    
    return options;
};

/**
 * 响应拦截器
 */
const responseInterceptor = (response: UniApp.RequestSuccessCallbackResult, request: UniApp.RequestOptions) => {
    const { statusCode, data } = response;
    
    // 响应日志
    console.log(`📦 [${statusCode}] ${request.url}`, data);
    
    // HTTP状态码检查
    if (statusCode >= 200 && statusCode < 300) {
        // 业务状态码检查
        if ((data as any).code === 200 || (data as any).success === true) {
            return Promise.resolve((data as any).data || data);
        } else {
            return handleBusinessError(data as any, request);
        }
    } else {
        return handleHttpError(response, request);
    }
};

/**
 * 业务错误处理
 */
const handleBusinessError = (data: any, request: UniApp.RequestOptions) => {
    switch (data.code) {
        case 401:
            // Token过期或无效
            showError('登录已过期，请重新登录');
            // 清除token并跳转登录页
            uni.removeStorageSync(USER_TOKEN);
            break;
        case 403:
            showError('权限不足，无法访问');
            break;
        case 404:
            showError('请求的资源不存在');
            break;
        case 500:
            showError('服务器内部错误');
            break;
        default:
            showError(data.message || '操作失败');
    }
    
    return Promise.reject(new Error(data.message || '请求失败'));
};

/**
 * HTTP错误处理
 */
const handleHttpError = (response: UniApp.RequestSuccessCallbackResult, request: UniApp.RequestOptions) => {
    const { statusCode } = response;
    let message = '网络错误';
    
    switch (statusCode) {
        case 400:
            message = '请求参数错误';
            break;
        case 401:
            message = '未授权，请重新登录';
            break;
        case 403:
            message = '拒绝访问';
            break;
        case 404:
            message = '请求资源不存在';
            break;
        case 408:
            message = '请求超时';
            break;
        case 500:
            message = '服务器内部错误';
            break;
        case 502:
            message = '网关错误';
            break;
        case 503:
            message = '服务不可用';
            break;
        case 504:
            message = '网关超时';
            break;
        default:
            message = `连接错误${statusCode}`;
    }
    
    showError(message);
    return Promise.reject(new Error(message));
};

/**
 * 显示错误提示
 */
const showError = (message: string) => {
    uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    });
};

/**
 * 主请求函数
 */
export const request = <T = any>(
    url: string, 
    data: any = {}, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    options: Partial<UniApp.RequestOptions> = {}
): Promise<T> => {
    return new Promise((resolve, reject) => {
        // 合并请求选项
        const requestOptions: UniApp.RequestOptions = {
            url,
            data,
            method,
            timeout: config.timeout,
            header: config.header,
            ...options,
            success: (response) => {
                responseInterceptor(response, requestOptions)
                    .then(resolve)
                    .catch(reject);
            },
            fail: (error) => {
                console.error('Request failed:', error);
                showError('网络连接失败，请检查网络设置');
                reject(new Error('网络连接失败'));
            }
        };
        
        // 应用请求拦截器
        const interceptedOptions = requestInterceptor(requestOptions);
        
        // 发送请求
        uni.request(interceptedOptions);
    });
};

/**
 * GET请求
 */
export const get = <T = any>(url: string, params?: any, options?: Partial<UniApp.RequestOptions>): Promise<T> => {
    return request<T>(url, params, 'GET', options);
};

/**
 * POST请求
 */
export const post = <T = any>(url: string, data?: any, options?: Partial<UniApp.RequestOptions>): Promise<T> => {
    return request<T>(url, data, 'POST', options);
};

/**
 * PUT请求
 */
export const put = <T = any>(url: string, data?: any, options?: Partial<UniApp.RequestOptions>): Promise<T> => {
    return request<T>(url, data, 'PUT', options);
};

/**
 * DELETE请求
 */
export const del = <T = any>(url: string, params?: any, options?: Partial<UniApp.RequestOptions>): Promise<T> => {
    return request<T>(url, params, 'DELETE', options);
}; 