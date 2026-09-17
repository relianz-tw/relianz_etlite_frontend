/**
 * 建立 Adaptive Card 格式的 Teams 訊息 payload
 * 使用 Power Automate Workflows webhook（非舊版 Office 365 Connector）
 */
function buildAdaptiveCard(message: string) {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: message,
              wrap: true,
              size: 'Medium',
            },
          ],
        },
      },
    ],
  };
}

/**
 * 發送文字通知到 Microsoft Teams 頻道（伺服器端使用）
 * 透過 Power Automate Workflows webhook（環境變數 TEAMS_WEBHOOK_URL）
 *
 * - 未設定 TEAMS_WEBHOOK_URL 時靜默略過
 * - 發送失敗只記錄 log，不拋錯、不阻斷主流程
 */
export async function notifyTeams(message: string): Promise<void> {
  const url = process.env.TEAMS_WEBHOOK_URL;

  if (!url) {
    // 未設定 webhook 則略過，不影響主流程
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAdaptiveCard(message)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Teams 通知失敗不應影響主業務流程，僅記錄 log
    console.error('Teams 通知發送失敗:', error);
  }
}
