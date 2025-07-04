/**
 * 微信支付工具类
 * @author wqs
 * @date 2025/01/30
 */
import { paymentApi, PaymentType, WechatPayCreateParam, WechatPayCreateResult } from '@/api/payment'
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
      const openid = authStore.userInfo?.wechatOpenid
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

      // 检查数据结构 - 处理可能的嵌套结构
      let payData = payResult
      
      // 如果payResult有data字段，说明响应拦截器没有正确处理
      if (payResult && typeof payResult === 'object' && 'data' in payResult) {
        payData = (payResult as any).data
      }
      
      // 验证支付参数 - 检查所有必需的字段
      const requiredFields: (keyof WechatPayCreateResult)[] = ['timeStamp', 'nonceStr', 'packageValue', 'signType', 'paySign']
      const missingFields = requiredFields.filter(field => !payData[field])
      
      if (missingFields.length > 0) {
        uni.showToast({
          title: '支付参数错误',
          icon: 'error'
        })
        return {
          success: false,
          message: `支付参数缺失: ${missingFields.join(', ')}`,
          data: payData
        }
      }

      // 确保所有参数都是字符串类型
      const paymentParams = {
        timeStamp: String(payData.timeStamp || ''),
        nonceStr: String(payData.nonceStr || ''),
        package: String(payData.packageValue || ''), // 注意：这里要使用 package 而不是 packageValue
        signType: String(payData.signType || ''),
        paySign: String(payData.paySign || '')
      }

      // 再次验证转换后的参数
      const emptyFields = Object.entries(paymentParams)
        .filter(([key, value]) => !value || value === 'undefined' || value === 'null')
        .map(([key]) => key)

      if (emptyFields.length > 0) {
        uni.showToast({
          title: '支付参数错误',
          icon: 'error'
        })
        return {
          success: false,
          message: `支付参数为空: ${emptyFields.join(', ')}`,
          data: { original: payData, converted: paymentParams }
        }
      }

      // 4. 调用微信支付
      console.log('🚀 发起微信支付，订单号:', payParam.outTradeNo)
      
      return new Promise((resolve) => {
        // 调用微信小程序支付API
        // @ts-ignore
        wx.requestPayment({
          timeStamp: paymentParams.timeStamp,
          nonceStr: paymentParams.nonceStr,
          package: paymentParams.package,
          signType: paymentParams.signType as any,
          paySign: paymentParams.paySign,
          success: (res) => {
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
            let message = '支付失败'
            
            // 根据错误类型提供更友好的提示
            if (err.errMsg) {
              if (err.errMsg.includes('cancel')) {
                message = '支付已取消'
              } else if (err.errMsg.includes('parameter error')) {
                message = '支付参数错误'
              } else if (err.errMsg.includes('network')) {
                message = '网络错误，请重试'
              } else if (err.errMsg.includes('timeout')) {
                message = '支付超时，请重试'
              }
            }
            
            if (message === '支付已取消') {
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