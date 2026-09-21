/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        kid: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Heiti SC"',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        // 幼儿 UI：正文 >= 20px，按钮文字 >= 24px，色名 >= 48px
        body: ['20px', '1.6'],
        btn: ['24px', '1.3'],
        cname: ['48px', '1.15'],
      },
      minWidth: {
        btn: '80px',
      },
      minHeight: {
        btn: '80px',
      },
      boxShadow: {
        kid: '0 8px 0 rgba(0,0,0,0.14)',
        pop: '0 10px 28px rgba(0,0,0,0.18)',
        soft: '0 6px 18px rgba(60,40,120,0.12)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '60%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%,100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '40%': { transform: 'scale(1.2) rotate(90deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(180deg)', opacity: '1' },
        },
      },
      animation: {
        pop: 'pop 0.35s ease-out',
        wiggle: 'wiggle 0.5s ease-in-out',
        floaty: 'floaty 3s ease-in-out infinite',
        sparkle: 'sparkle 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
