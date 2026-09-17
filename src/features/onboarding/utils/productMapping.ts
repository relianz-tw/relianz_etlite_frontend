import type { OnboardingState } from '../state/onboardingReducer';
import type {
  PaymentService,
  PaymentServiceList,
} from '@/api/onboarding/paymentServices';

export interface ProductSummaryItem {
  code: string;
  name: string;
  price: number;
  action: number;
}

export interface ProductMappingResult {
  productIds: string[];
  totalAmount: number;
  productSummary: ProductSummaryItem[];
}

/**
 * 依 onboarding state（計費週期、主方案、加購）+ 服務清單，
 * 計算出付款 API 所需的 productIds 與金額摘要
 */
export function mapStateToProducts(
  state: Pick<
    OnboardingState,
    'billingCycle' | 'selectedPlanId' | 'selectedAddOnCodes'
  >,
  serviceList: PaymentServiceList
): ProductMappingResult {
  const list: PaymentService[] =
    state.billingCycle === 1
      ? serviceList.acYearSer ?? []
      : serviceList.acMonthSer ?? [];

  const selectedItems = list.filter(
    s =>
      s.code === state.selectedPlanId ||
      state.selectedAddOnCodes.includes(s.code)
  );

  const productIds = selectedItems.map(s => s.code);
  const totalAmount = selectedItems.reduce((sum, s) => sum + s.price, 0);
  const productSummary: ProductSummaryItem[] = selectedItems.map(s => ({
    code: s.code,
    name: s.name,
    price: s.price,
    action: s.action,
  }));

  return { productIds, totalAmount, productSummary };
}

export function formatProductName(summary: ProductSummaryItem[]): string {
  return summary.map(s => s.name).join('、');
}
