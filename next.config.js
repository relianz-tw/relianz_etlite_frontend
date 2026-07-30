/** @type {import('next').NextConfig} */
const nextConfig = {
  // 後端 API 尚未開放 CORS，開發/部署時一律經 Next.js 代理轉發 /ael/** 到後端，
  // 前端程式碼中呼叫時一律使用相對路徑（見 src/api/client.ts），不直接帶後端網域。
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) return [];
    return [
      {
        source: '/ael/:path*',
        destination: `${apiBaseUrl}/ael/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
