/** @type {import('next').NextConfig} */
const nextConfig = {
  // ETLite 掛在既有 domain 的 /etlite 底下，非 root，部署路徑依賴此設定，變更需與後端一併確認。
  basePath: '/etlite',
  // 後端已開放 CORS，前端統一直接打 NEXT_PUBLIC_API_BASE_URL（見 src/api/client.ts），
  // 不再依賴此處的代理轉發；此 rewrite 僅作為未設定該環境變數時的備援路徑。
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
