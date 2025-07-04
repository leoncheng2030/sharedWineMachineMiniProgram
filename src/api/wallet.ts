import { get, post } from './request'

// ======================== 类型定义 ========================

/**
 * 账户流水记录
 */
export interface AccountFlowRecord {
  id: string
  userId: string
  userNickname?: string
  flowNo: string
  flowType: string
  amount: number
  balanceChange: number
  relatedId?: string
  relatedType?: string
  description: string
  beforeBalance: number
  afterBalance: number
  status: string
  transactionTime: string
  createTime: string
  remark?: string
}

/**
 * 账户流水分页查询参数
 */
export interface AccountFlowPageParams {
  pageNum?: number
  pageSize?: number
  flowType?: string
  status?: string
  startTime?: string
  endTime?: string
  sortField?: string
  sortOrder?: string
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 账户流水统计
 */
export interface FlowStatistics {
  totalIncome: number
  totalExpense: number
  netAmount: number
  todayIncome: number
  todayExpense: number
  monthIncome: number
  monthExpense: number
}

/**
 * 佣金记录
 */
export interface CommissionRecord {
  id: string
  userId: string
  orderId?: string
  commissionType: string
  commissionAmount: number
  commissionRate: number
  baseAmount: number
  status: string
  settleTime?: string
  createTime: string
  remark?: string
}

/**
 * 佣金分页查询参数
 */
export interface CommissionPageParams {
  pageNum?: number
  pageSize?: number
  status?: string
  commissionType?: string
  startTime?: string
  endTime?: string
  sortField?: string
  sortOrder?: string
}

/**
 * 佣金统计
 */
export interface CommissionStatistics {
  totalCommission: number
  settledCommission: number
  pendingCommission: number
  frozenCommission: number
  directCommission: number
  indirectCommission: number
}

/**
 * 账户信息
 */
export interface AccountInfo {
  userId: string
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  totalIncome: number
  totalWithdraw: number
  accountStatus: string
  createTime: string
  updateTime: string
}

/**
 * 提现申请参数
 */
export interface WithdrawApplyParams {
  amount: number
  withdrawType: string
  accountInfo: string
  remark?: string
}

/**
 * 提现记录
 */
export interface WithdrawRecord {
  id: string
  userId: string
  withdrawNo: string
  amount: number
  fee: number
  actualAmount: number
  withdrawType: string
  accountInfo: string
  status: string
  applyTime: string
  auditTime?: string
  completeTime?: string
  remark?: string
}

// ======================== API接口类 ========================

/**
 * 钱包相关API
 */
export class WalletApi {
  
  // ======================== 账户流水相关接口 ========================
  
  /**
   * 获取账户流水分页列表
   */
  static getFlowRecords(params: AccountFlowPageParams = {}): Promise<PageResult<AccountFlowRecord>> {
    return get<PageResult<AccountFlowRecord>>('/miniprogram/account/flow/records', params)
  }
  
  /**
   * 获取最近流水记录
   */
  static getRecentFlowRecords(limit: number = 10): Promise<AccountFlowRecord[]> {
    return get<AccountFlowRecord[]>(`/miniprogram/account/flow/recent?limit=${limit}`)
  }
  
  /**
   * 根据流水类型获取流水记录
   */
  static getFlowRecordsByType(
    flowType: string, 
    pageNum: number = 1, 
    pageSize: number = 10
  ): Promise<PageResult<AccountFlowRecord>> {
    return get<PageResult<AccountFlowRecord>>(
      `/miniprogram/account/flow/type/${flowType}?pageNum=${pageNum}&pageSize=${pageSize}`
    )
  }
  
  /**
   * 获取账户流水统计
   */
  static getFlowStatistics(): Promise<FlowStatistics> {
    return get<FlowStatistics>('/miniprogram/account/flow/statistics')
  }
  
  // ======================== 佣金管理相关接口 ========================
  
  /**
   * 获取佣金记录分页列表
   */
  static getCommissionRecords(params: CommissionPageParams = {}): Promise<PageResult<CommissionRecord>> {
    return get<PageResult<CommissionRecord>>('/miniprogram/commission/records', params)
  }
  
  /**
   * 获取佣金统计信息
   */
  static getCommissionStatistics(): Promise<CommissionStatistics> {
    return get<CommissionStatistics>('/miniprogram/commission/statistics')
  }
  
  /**
   * 获取佣金汇总信息
   */
  static getCommissionSummary(): Promise<Record<string, number>> {
    return get<Record<string, number>>('/miniprogram/commission/summary')
  }
  
  /**
   * 获取账户信息
   */
  static getAccountInfo(): Promise<AccountInfo> {
    return get<AccountInfo>('/miniprogram/commission/account')
  }
  
  // ======================== 提现管理相关接口 ========================
  
  /**
   * 申请提现
   */
  static applyWithdraw(params: WithdrawApplyParams): Promise<string> {
    return post<string>('/miniprogram/commission/withdraw/apply', params)
  }
  
  /**
   * 获取提现记录
   */
  static getWithdrawRecords(params: { pageNum?: number; pageSize?: number } = {}): Promise<PageResult<WithdrawRecord>> {
    return get<PageResult<WithdrawRecord>>('/miniprogram/commission/withdraw/records', params)
  }
  
  /**
   * 取消提现申请
   */
  static cancelWithdraw(withdrawId: string): Promise<boolean> {
    return post<boolean>('/miniprogram/commission/withdraw/cancel', { withdrawId })
  }
  
  // ======================== 便捷方法 ========================
  
  /**
   * 获取钱包首页数据
   */
  static async getWalletHomeData(): Promise<{
    accountInfo: AccountInfo
    recentFlows: AccountFlowRecord[]
    statistics: FlowStatistics
  }> {
    const [accountInfo, recentFlows, statistics] = await Promise.all([
      this.getAccountInfo(),
      this.getRecentFlowRecords(5),
      this.getFlowStatistics()
    ])
    
    return {
      accountInfo,
      recentFlows,
      statistics
    }
  }
  
  /**
   * 获取交易记录页面数据
   */
  static async getRecordsPageData(params: AccountFlowPageParams = {}): Promise<{
    records: PageResult<AccountFlowRecord>
    statistics: FlowStatistics
  }> {
    const [records, statistics] = await Promise.all([
      this.getFlowRecords(params),
      this.getFlowStatistics()
    ])
    
    return {
      records,
      statistics
    }
  }
}

// ======================== 导出便捷方法 ========================

/**
 * 获取账户流水记录
 */
export const getFlowRecords = WalletApi.getFlowRecords

/**
 * 获取最近流水记录
 */
export const getRecentFlowRecords = WalletApi.getRecentFlowRecords

/**
 * 根据类型获取流水记录
 */
export const getFlowRecordsByType = WalletApi.getFlowRecordsByType

/**
 * 获取流水统计
 */
export const getFlowStatistics = WalletApi.getFlowStatistics

/**
 * 获取佣金记录
 */
export const getCommissionRecords = WalletApi.getCommissionRecords

/**
 * 获取佣金统计
 */
export const getCommissionStatistics = WalletApi.getCommissionStatistics

/**
 * 获取账户信息
 */
export const getAccountInfo = WalletApi.getAccountInfo

/**
 * 申请提现
 */
export const applyWithdraw = WalletApi.applyWithdraw

/**
 * 获取提现记录
 */
export const getWithdrawRecords = WalletApi.getWithdrawRecords

/**
 * 获取钱包首页数据
 */
export const getWalletHomeData = WalletApi.getWalletHomeData

/**
 * 获取交易记录页面数据
 */
export const getRecordsPageData = WalletApi.getRecordsPageData

// 默认导出
export default WalletApi 