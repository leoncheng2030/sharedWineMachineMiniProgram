/**
 * 微信支付工具类
 * @author wqs
 * @date 2025/01/30
 */
import { paymentApi, PaymentType, WechatPayCreateParam } from '@/api/payment'
import { WX_PAY_CONFIG } from '@/config'
import { useAuthStore } from '@/store/modules/auth'

/**
 * 微信支付参数接口
 */
export interface WechatPayParams {
  orderNo: string           // 订单号
  amount: number           // 支付金额（元）
  description: string      // 商品描述
  attach?: string         // 附加数据
  timeExpire?: number     // 过期时间（分钟）
}

/**
 * 微信支付结果接口
 */
export interface WechatPayResult {
  success: boolean        // 支付是否成功
  message: string        // 结果消息
  data?: any            // 支付结果数据
}

/**
 * 微信支付工具类
 */
export class WechatPayUtil {
  private static paymentApiInstance = paymentApi

  /**
   * 微信小程序支付
   * @param params 支付参数
   * @returns 支付结果
   */
  static async miniProgramPay(params: WechatPayParams): Promise<WechatPayResult> {
    try {
      // 1. 检查用户登录状态
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return {
          success: false,
          message: '用户未登录'
        }
      }

      // 2. 获取用户openid
      const openid = authStore.userInfo?.openid
      if (!openid) {
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
        return {
          success: false,
          message: '获取用户openid失败'
        }
      }

      // 3. 创建支付订单
      const payParam: WechatPayCreateParam = {
        outTradeNo: params.orderNo,
        totalAmount: params.amount,
        description: params.description,
        openid: openid,
        payType: PaymentType.WECHAT_MINI,
        attach: params.attach,
        timeExpire: params.timeExpire || WX_PAY_CONFIG.timeExpire
      }

      uni.showLoading({
        title: '创建支付订单...'
      })

      const payResult = await this.paymentApiInstance.createWechatPayOrder(payParam)
      
      uni.hideLoading()

      // 4. 调用微信支付
      return new Promise((resolve) => {
        uni.requestPayment({
          provider: 'wxpay',
          orderInfo: {
            timeStamp: payResult.timeStamp!,
            nonceStr: payResult.nonceStr!,
            package: payResult.packageValue!,
            signType: payResult.signType!,
            paySign: payResult.paySign!
          },
          success: (res) => {
            console.log('微信支付成功', res)
            uni.showToast({
              title: '支付成功',
              icon: 'success'
            })
            resolve({
              success: true,
              message: '支付成功',
              data: res
            })
          },
          fail: (err) => {
            console.error('微信支付失败', err)
            let message = '支付失败'
            
            if (err.errMsg?.includes('cancel')) {
              message = '支付已取消'
              uni.showToast({
                title: message,
                icon: 'none'
              })
            } else {
              uni.showToast({
                title: message,
                icon: 'error'
              })
            }
            
            resolve({
              success: false,
              message: message,
              data: err
            })
          }
        })
      })

    } catch (error) {
      uni.hideLoading()
      console.error('创建支付订单失败', error)
      
      const message = error instanceof Error ? error.message : '创建支付订单失败'
      uni.showToast({
        title: message,
        icon: 'error'
      })
      
      return {
        success: false,
        message: message,
        data: error
      }
    }
  }

  /**
   * 查询支付状态
   * @param orderNo 订单号
   * @returns 支付状态查询结果
   */
  static async queryPaymentStatus(orderNo: string): Promise<WechatPayResult> {
    try {
      const result = await this.paymentApiInstance.queryPaymentOrder({
        outTradeNo: orderNo
      })
      
      return {
        success: true,
        message: '查询成功',
        data: result
      }
    } catch (error) {
      console.error('查询支付状态失败', error)
      const message = error instanceof Error ? error.message : '查询支付状态失败'
      
      return {
        success: false,
        message: message,
        data: error
      }
    }
  }

  /**
   * 申请退款
   * @param orderNo 订单号
   * @param refundAmount 退款金额
   * @param refundReason 退款原因
   * @returns 退款申请结果
   */
  static async requestRefund(
    orderNo: string, 
    refundAmount: number, 
    refundReason: string
  ): Promise<WechatPayResult> {
    try {
      const result = await this.paymentApiInstance.refundOrder({
        outTradeNo: orderNo,
        outRefundNo: this.generateOrderNo('REF'),
        refundAmount: refundAmount,
        totalAmount: refundAmount, // 这里需要传入原订单金额，实际使用时需要获取
        reason: refundReason
      })
      
      uni.showToast({
        title: '退款申请成功',
        icon: 'success'
      })
      
      return {
        success: true,
        message: '退款申请成功',
        data: result
      }
    } catch (error) {
      console.error('申请退款失败', error)
      const message = error instanceof Error ? error.message : '申请退款失败'
      
      uni.showToast({
        title: message,
        icon: 'error'
      })
      
      return {
        success: false,
        message: message,
        data: error
      }
    }
  }

  /**
   * 验证支付金额
   * @param amount 支付金额
   * @returns 是否有效
   */
  static validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 999999.99
  }

  /**
   * 格式化支付金额显示
   * @param amount 金额
   * @returns 格式化后的金额字符串
   */
  static formatAmount(amount: number): string {
    return `¥${amount.toFixed(2)}`
  }

  /**
   * 生成订单号
   * @param prefix 前缀
   * @returns 订单号
   */
  static generateOrderNo(prefix: string = 'WQS'): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${timestamp}${random}`
  }
}

/**
 * 微信支付快捷方法
 * @param params 支付参数
 * @returns 支付结果
 */
export const wechatPay = (params: WechatPayParams): Promise<WechatPayResult> => {
  return WechatPayUtil.miniProgramPay(params)
}

/**
 * 导出默认实例
 */
export default WechatPayUtil 