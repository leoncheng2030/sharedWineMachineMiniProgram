import { get } from './request';

/**
 * 轮播图数据类型
 */
export interface SlideshowItem {
    /** 主键ID */
    id: string;
    /** 轮播图标题 */
    title: string;
    /** 轮播图图片 */
    image: string;
    /** 跳转链接 */
    link?: string;
    /** 轮播图位置 */
    place?: string;
    /** 排序号 */
    sortCode?: number;
    /** 状态 */
    status?: string;
    /** 创建时间 */
    createTime?: Date;
}

/**
 * 轮播图查询参数
 */
export interface SlideshowListParam {
    /** 展示位置 */
    place?: string;
}

/**
 * 首页API接口
 */
export class HomeApi {
    /**
     * 获取轮播图列表
     * @param params 查询参数
     * @returns 轮播图列表
     */
    static getSlideshowList(params?: SlideshowListParam): Promise<SlideshowItem[]> {
        const queryParams = params?.place ? `?place=${params.place}` : '';
        return get<SlideshowItem[]>(`/mini/slideshow/list${queryParams}`);
    }

    /**
     * 根据位置获取轮播图列表
     * @param place 展示位置
     * @returns 轮播图列表
     */
    static getSlideshowListByPlace(place: string): Promise<SlideshowItem[]> {
        return get<SlideshowItem[]>(`/mini/slideshow/listByPlace?place=${place}`);
    }

    /**
     * 获取小程序首页轮播图
     * @returns 轮播图列表
     */
    static getMiniHomeBanner(): Promise<SlideshowItem[]> {
        return this.getSlideshowListByPlace('MINI_HOME');
    }
}

export default HomeApi; 