import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ===== Scholar's Tea 双轨配色系统 =====
        // 学术区 (顶刊风格)
        journal: {
          DEFAULT: 'var(--journal-primary)',
          primary: 'var(--journal-primary)',
          'primary-foreground': 'var(--journal-primary-foreground)',
          gold: 'var(--journal-gold)',
          'gold-foreground': 'var(--journal-gold-foreground)',
          border: 'var(--journal-border)',
          'border-hover': 'var(--journal-border-hover)',
        },
        // 交流区 (年轻活力)
        tea: {
          DEFAULT: 'var(--tea-primary)',
          primary: 'var(--tea-primary)',
          'primary-foreground': 'var(--tea-primary-foreground)',
          accent: 'var(--tea-accent)',
          'accent-foreground': 'var(--tea-accent-foreground)',
          bg: 'var(--tea-bg)',
          mint: 'var(--tea-mint)',
        },
        // 对话系统
        convo: {
          blue: 'var(--convo-blue)',
          'blue-foreground': 'var(--convo-blue-foreground)',
          blush: 'var(--convo-blush)',
          'blush-foreground': 'var(--convo-blush-foreground)',
        },
      },
      fontFamily: {
        // 学术标题字体 - Crimson Pro (serif)
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        // 正文字体 - Source Serif 4 (serif)
        'source-serif': ['"Source Serif 4"', 'Georgia', 'serif'],
        // 界面字体 - Inter (sans-serif)
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // 等宽字体 - JetBrains Mono
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'bounce-in': 'bounceIn 0.5s ease-out forwards',
        typing: 'typingBounce 1.2s infinite ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'like-bounce': 'likeBounce 0.4s ease-out forwards',
        'hermes-float': 'hermesFloat 3s ease-in-out infinite',
        'hermes-breathe': 'hermesBreathe 2.5s ease-in-out infinite',
        'hermes-bounce': 'hermesBounce 0.6s ease-out',
        'hermes-bounce-leaf': 'hermesBounceLeaf 0.6s ease-out',
        'hermes-wiggle': 'hermesWiggle 1s ease-in-out infinite',
        'hermes-pulse': 'hermesPulse 1.5s ease-in-out infinite',
        'hermes-twinkle': 'hermesTwinkle 1.2s ease-in-out infinite',
        'hermes-dance': 'hermesDance 1.8s ease-in-out',
        'hermes-wave-left': 'hermesWaveLeft 1.2s ease-in-out',
        'hermes-shake': 'hermesShake 0.4s ease-in-out infinite',
        'hermes-dizzy': 'hermesDizzy 1.5s ease-in-out infinite',
        'hermes-spin-slow': 'hermesSpinSlow 2s linear infinite',
        'hermes-float-heart': 'hermesFloatHeart 1.8s ease-in-out infinite',
        'hermes-dizzy-star': 'hermesDizzyStar 1s ease-in-out infinite',
        'hermes-blink': 'hermesBlink 0.15s ease-in-out',
        'hermes-peek': 'hermesPeek 2s ease-in-out infinite',
        'hermes-sway': 'hermesSway 2s ease-in-out infinite',
        'hermes-breathe-origin': 'hermesBreatheOrigin 2.5s ease-in-out infinite',
        'hermes-ear-wiggle': 'hermesEarWiggle 2s ease-in-out infinite',
        'hermes-pop': 'hermesPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'hermes-jump': 'hermesJump 0.5s ease-out',
        'hermes-ripple': 'hermesRipple 0.6s ease-out forwards',
        'hermes-particle': 'hermesParticle 1s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        typingBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        likeBounce: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3)' },
          '50%': { transform: 'scale(0.95)' },
          '75%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        hermesFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        hermesBounce: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(0.85) rotate(-5deg)' },
          '50%': { transform: 'scale(1.15) rotate(3deg)' },
          '75%': { transform: 'scale(0.95) rotate(-2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        hermesBounceLeaf: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-15deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '75%': { transform: 'rotate(-5deg)' },
        },
        hermesWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
        hermesPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        },
        hermesTwinkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
        hermesDance: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '10%': { transform: 'translateY(-8px) rotate(-10deg)' },
          '20%': { transform: 'translateY(0) rotate(10deg)' },
          '30%': { transform: 'translateY(-6px) rotate(-8deg)' },
          '40%': { transform: 'translateY(0) rotate(8deg)' },
          '50%': { transform: 'translateY(-10px) rotate(0deg) scale(1.1)' },
          '60%': { transform: 'translateY(0) rotate(-5deg)' },
          '70%': { transform: 'translateY(-4px) rotate(5deg)' },
          '80%': { transform: 'translateY(0) rotate(-3deg)' },
          '90%': { transform: 'translateY(-2px) rotate(3deg)' },
        },
        hermesWaveLeft: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-25deg)' },
          '30%': { transform: 'rotate(5deg)' },
          '45%': { transform: 'rotate(-20deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '75%': { transform: 'rotate(-15deg)' },
          '90%': { transform: 'rotate(0deg)' },
        },
        hermesBreathe: {
          '0%, 100%': { transform: 'scale(1) translateY(0)' },
          '50%': { transform: 'scale(1.02) translateY(-2px)' },
        },
        hermesShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        hermesDizzy: {
          '0%, 100%': { transform: 'rotate(0deg) translateX(0)' },
          '25%': { transform: 'rotate(-5deg) translateX(-3px)' },
          '50%': { transform: 'rotate(3deg) translateX(2px)' },
          '75%': { transform: 'rotate(-4deg) translateX(-2px)' },
        },
        hermesSpinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        hermesFloatHeart: {
          '0%, 100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.7', transform: 'translateY(-6px) scale(1.15)' },
        },
        hermesDizzyStar: {
          '0%, 100%': { opacity: '1', transform: 'rotate(0deg) scale(1)' },
          '50%': { opacity: '0.5', transform: 'rotate(180deg) scale(0.8)' },
        },
        hermesBlink: {
          '0%': { transform: 'scaleY(0)' },
          '50%': { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(0)' },
        },
        hermesPeek: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-3px) rotate(3deg)' },
        },
        hermesSway: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        hermesBreatheOrigin: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        hermesEarWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        hermesPop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        hermesJump: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '30%': { transform: 'translateY(-12px) scale(0.95, 1.05)' },
          '60%': { transform: 'translateY(4px) scale(1.05, 0.95)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        hermesRipple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        hermesParticle: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: '0' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};

export default config;
