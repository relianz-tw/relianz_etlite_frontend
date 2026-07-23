const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/features/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- 舊 token（過渡別名，勿刪除）----
        'brand-primary': '#005FA2',
        'brand-primary-light': '#1C7EBA',
        'brand-secondary': '#BE9F86',
        'brand-secondary-light': '#CCB4A3',
        'ui-text-primary': '#333333',
        'ui-text-secondary': '#797C80',
        'ui-text-tertiary': '#B3ABBC',
        'ui-text-success': '#1C7EBA',
        'ui-text-error': '#DD6B5F',
        'ui-text-white': '#ffffff',
        'ui-text-link': '#B87069',
        'ui-element-primary': '#F9F8F8',
        'ui-element-secondary': '#005FA2',
        'ui-element-tertiary': '#BE9F86',
        'ui-element-success': '#1C7EBA',
        'ui-element-error': '#DD6B5F',
        'ui-element-up': '#31C63B',
        'ui-element-down': '#FF6B6B',
        'ui-element-neutral': '#F0EBE5',
        'ui-element-overlay': 'rgba(0, 95, 162, 0.8)',
        'ui-element-inactive': 'rgba(231, 226, 220, 0.5)',
        'nav-bg': '#F5F3F2',
        'ui-order-bg': 'rgba(28, 126, 186, 0.80)',
        // ---- 新語意 token（DESIGN.md 對齊）----
        brand: {
          blue: '#005FA2',
          'blue-dark': '#004A82',
          'blue-light': '#3380B8',
          tan: '#BE9F86',
          'tan-dark': '#A88B74',
        },
        semantic: {
          success: '#377456',
          'success-dark': '#2d6347',
          'success-muted': '#CAD6BC',
          info: '#5CA8A3',
          'info-muted': '#7A7C81',
          error: '#DD6B5F',
          'warm-dark': '#84724D',
        },
        neutral: {
          dark: '#3A3830',
          mid: '#797C80',
          'blue-gray': '#9AA7B9',
        },
        surface: {
          warm: '#F0EBE5',
          'off-white': '#F5F3F2',
          cream: '#EAE5E3',
        },
      },
      flex: {
        2: '2 2 0%',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
      },
      boxShadow: {
        // 唯一允許的陰影 — 僅用於浮動選單（popover、dropdown、date-picker）
        level1: '0 1px 4px rgba(58,56,48,0.08)',
      },
      screens: {
        nav: '1000px',
      },
      spacing: {
        30: '120px',
      },
      fontFamily: {
        kai: [
          '"標楷體"',
          '"DFKai-SB"',
          '"BiauKai"',
          '"Noto Serif TC"',
          'serif',
        ],
        notoSans: ['var(--font-noto-sans-tc)'],
        notoSerif: ['var(--font-noto-serif-tc)'],
        'display-en': [
          'Baskerville',
          'Baskerville Old Face',
          'Big Caslon',
          'Georgia',
          'serif',
        ],
        'display-zh': ['Noto Serif TC', '思源宋體', 'Songti TC', 'serif'],
        'body-en': ['Baskerville', 'Georgia', 'serif'],
        'body-zh': [
          'Noto Sans TC',
          '思源黑體',
          'PingFang TC',
          'Heiti TC',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
