import { get } from './request';

/**
 * 酒品信息类型（与后端WineProductSimplePojo保持一致）
 */
export interface WineProduct {
    /** 主键 */
    id: string;
    /** 酒品编码 */
    productCode: string;
    /** 酒品名称 */
    productName: string;
    /** 分类名称 */
    categoryName?: string;
    /** 品牌 */
    brand?: string;
    /** 供应商名称 */
    supplierName?: string;
    /** 酒精度数 */
    alcoholContent?: number;
    /** 净含量(ml) */
    volume?: number;
    /** 建议零售价 */
    suggestedPrice?: number;
    /** 当前门店价格 */
    currentPrice?: number;
    /** 酒品图片URL */
    imageUrl?: string;
    /** 状态 */
    status?: string;
    /** 排序码 */
    sortCode?: number;
}

/**
 * 酒品详情类型（与后端WineProductPojo保持一致）
 */
export interface WineProductDetail extends WineProduct {
    /** 酒品分类ID */
    categoryId?: string;
    /** 酒品类型 */
    productType?: string;
    /** 产地 */
    origin?: string;
    /** 生产厂家 */
    manufacturer?: string;
    /** 供应商客户端ID */
    supplierId?: string;
    /** 成本价 */
    costPrice?: number;
    /** 酒品描述 */
    description?: string;
    /** 备注 */
    remark?: string;
    /** 扩展信息 */
    extJson?: string;
    /** 创建时间 */
    createTime?: string;
    /** 创建用户 */
    createUser?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 更新用户 */
    updateUser?: string;
    /** 删除标志 */
    deleteFlag?: string;
}

/**
 * 酒品查询参数
 */
export interface WineProductQuery {
    /** 酒品名称（模糊查询） */
    productName?: string;
    /** 酒品分类ID */
    categoryId?: string;
    /** 酒品类型 */
    productType?: string;
    /** 品牌 */
    brand?: string;
    /** 最小价格 */
    minPrice?: number;
    /** 最大价格 */
    maxPrice?: number;
    /** 状态 */
    status?: string;
    /** 排序字段 */
    sortField?: string;
    /** 排序方向 */
    sortOrder?: string;
    /** 页码 */
    pageNum?: number;
    /** 每页数量 */
    pageSize?: number;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
    /** 记录列表 */
    records: T[];
    /** 总记录数 */
    total: number;
    /** 当前页 */
    current: number;
    /** 每页大小 */
    size: number;
    /** 总页数 */
    pages: number;
}

/**
 * 酒品API接口
 */
export class WineApi {
    /**
     * 获取推荐酒品（首页热门推荐）
     * @param limit 数量限制，默认10个
     * @returns 推荐酒品列表
     */
    static getRecommendedWines(limit: number = 10): Promise<WineProduct[]> {
        return get<WineProduct[]>(`/miniprogram/wine/recommended?limit=${limit}`);
    }

    /**
     * 根据分类获取酒品
     * @param categoryId 分类ID
     * @param params 查询参数
     * @returns 酒品分页列表
     */
    static getWinesByCategory(categoryId: string, params?: WineProductQuery): Promise<PageResult<WineProduct>> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });
        }
        const queryString = queryParams.toString();
        return get<PageResult<WineProduct>>(`/miniprogram/wine/category/${categoryId}${queryString ? '?' + queryString : ''}`);
    }

    /**
     * 搜索酒品
     * @param keyword 搜索关键词
     * @param pageNum 页码，默认1
     * @param pageSize 每页大小，默认10
     * @returns 酒品分页列表
     */
    static searchWines(keyword: string, pageNum: number = 1, pageSize: number = 10): Promise<PageResult<WineProduct>> {
        return get<PageResult<WineProduct>>(`/miniprogram/wine/search?keyword=${encodeURIComponent(keyword)}&pageNum=${pageNum}&pageSize=${pageSize}`);
    }

    /**
     * 获取酒品详情
     * @param productId 酒品ID
     * @returns 酒品详细信息
     */
    static getWineDetail(productId: string): Promise<WineProductDetail> {
        return get<WineProductDetail>(`/miniprogram/wine/detail?id=${productId}`);
    }

    /**
     * 获取热门酒品（首页使用）
     * @param limit 数量限制，默认20个
     * @returns 热门酒品列表
     */
    static getHotWines(limit: number = 20): Promise<WineProduct[]> {
        return get<WineProduct[]>(`/miniprogram/wine/hot?limit=${limit}`);
    }

    /**
     * 获取新品酒品
     * @param limit 数量限制，默认10个
     * @returns 新品酒品列表
     */
    static getNewWines(limit: number = 10): Promise<WineProduct[]> {
        return get<WineProduct[]>(`/miniprogram/wine/new?limit=${limit}`);
    }

    /**
     * 获取特价酒品
     * @param limit 数量限制，默认10个
     * @returns 特价酒品列表
     */
    static getDiscountWines(limit: number = 10): Promise<WineProduct[]> {
        return get<WineProduct[]>(`/miniprogram/wine/discount?limit=${limit}`);
    }
} 