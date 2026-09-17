import { apiFetch } from '@/api/client';

export interface PaymentService {
  code: string;
  name: string;
  /** 單位：元 */
  price: number;
  /** 0: 一次性  1: 月繳  2: 年繳 */
  action: number;
  content: string;
  /** true: 必選（強制加入）  false: 可加購 */
  needed: boolean;
}

export interface PaymentServiceList {
  acYearSer: PaymentService[];
  acMonthSer: PaymentService[];
}

/** 取得付款服務清單（含月繳 / 年繳方案與加購項目） */
export function getPaymentServiceList(): Promise<PaymentServiceList> {
  return apiFetch<PaymentServiceList>(
    '/ael/onboarding/payment/getPaymentServiceListForSetup'
  );
}
