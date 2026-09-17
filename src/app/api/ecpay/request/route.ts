import {
  createBindCard,
  creditDoAction,
  getCreditDetail,
  getTokenByBindingCard,
} from '@/lib/ecpayServer';
import { NextRequest, NextResponse } from 'next/server';

/**
 * onboarding 綠界請求代理：前端不能直接帶金鑰打綠界，統一經此 route 加解密。
 * 只支援 onboarding 流程需要的 4 個操作，其餘（訂閱制付款、幕後授權等）不搬。
 */
export async function POST(req: NextRequest) {
  try {
    const { operation, params } = await req.json();

    let data: unknown;
    switch (operation) {
      case 'getTokenByBindingCard':
        data = await getTokenByBindingCard(params);
        break;
      case 'createBindCard':
        data = await createBindCard(params);
        break;
      case 'getCreditDetail':
        data = await getCreditDetail(params);
        break;
      case 'creditDoAction':
        data = await creditDoAction(params);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('ECPay request API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
