/** 沖帳事件方向（BankSettleEventDto.side）顯示文字：0銷項／1進項 */
export function sideLabel(side: number): string {
  return side === 0 ? '銷項' : '進項';
}

/** 現金收付方向（BankSettleEventDto.cashDirection）顯示文字：0匯入／1提出 */
export function cashDirectionLabel(cashDirection: number): string {
  return cashDirection === 0 ? '匯入' : '提出';
}
