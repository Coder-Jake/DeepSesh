import type { Config } from "tailwindcss";
import plugin from 'tailwindcss/plugin';

// Define raw HSL values for light and dark modes
const rawHslColors = {
  light: {
    background: { h: 0, s: 0, l: 100 },
    foreground: { h: 222.2, s: 84, l: 4.9 },
    muted: { h: 210, s: 40, l: 96.1 },
    'muted-foreground': { h: 215.4, s: 16.3, l: 46.9 },
    popover: { h: 0, s: 0, l: 100 },
    'popover-foreground': { h: 222.2, s: 84, l: 4.9 },
    border: { h: 214.3, s: 31.8, l: 91.4 },
    input: { h: 214.3, s: 31.8, l: 91.4 },
    card: { h: 0, s: 0, l: 100 },
    'card-foreground': { h: 222.2, s: 84, l: 4.9 },
    primary: { h: 222.2, s: 47.4, l: 11.2 },
    'primary-foreground': { h: 210, s: 40, l: 98 },
    secondary: { h: 210, s: 40, l: 96.1 },
    'secondary-foreground': { h: 222.2, s: 47.4, l: 11.2 },
    accent: { h: 210, s: 40, l: 96.1 },
    'accent-foreground': { h: 222.2, s: 47.4, l: 11.2 },
    destructive: { h: 0, s: 84.2, l: 60.2 },
    'destructive-foreground': { h: 210, s: 40, l: 98 },
    ring: { h: 215, s: 20.2, l: 65.1 },
    cancel: { h: 0, s: 100, l: 95 },
    'cancel-foreground': { h: 0, s: 80, l: 30 },
    'public-bg': { h: 200, s: 90, l: 82.5 },
    'public-foreground-solid': { h: 222.2, s: 84, l: 4.9 },
    'private-bg': { h: 270, s: 100, l: 87.5 },
    'private-foreground-solid': { h: 222.2, s: 84, l: 4.9 },
    'organisation-bg': { h: 80, s: 60, l: 82.5 },
    'organisation-foreground-solid': { h: 222.2, s: 84, l: 4.9 },
    success: { h: 120, s: 60, l: 90 },
    'success-fg': { h: 120, s: 60, l: 30 },
    'success-border': { h: 120, s: 60, l: 80 },
    error: { h: 0, s: 80, l: 90 },
    'error-fg': { h: 0, s: 80, l: 40 },
    'error-border': { h: 0, s: 80, l: 80 },
    'public-text': { h: 200, s: 90, l: 30 },
    'private-text': { h: 270, s: 100, l: 30 },
    'organisation-text': { h: 80, s: 60, l: 20 },
    olive: { h: 80, s: 60, l: 40 },
    'olive-foreground': { h: 80, s: 40, l: 10 },
    'focus-background-solid-light': { h: 270, s: 100, l: 92.5 },
    'break-background-solid-light': { h: 200, s: 90, l: 87.5 },
    'neutral-background': { h: 210, s: 20, l: 95 },
  },
  dark: {
    background: { h: 222.2, s: 84, l: 10 },
    foreground: { h: 210, s: 40, l: 98 },
    muted: { h: 217.2, s: 32.6, l: 17.5 },
    'muted-foreground': { h: 215, s: 40.2, l: 65.1 },
    popover: { h: 222.2, s: 84, l: 4.9 },
    'popover-foreground': { h: 210, s: 40, l: 98 },
    border: { h: 217.2, s: 32.6, l: 17.5 },
    input: { h: 217.2, s: 32.6, l: 17.5 },
    card: { h: 222.2, s: 84, l: 4.9 },
    'card-foreground': { h: 210, s: 40, l: 98 },
    primary: { h: 210, s: 40, l: 98 },
    'primary-foreground': { h: 222.2, s: 47.4, l: 11.2 },
    secondary: { h: 250, s: 30, l: 17.5 },
    'secondary-foreground': { h: 210, s: 40, l: 98 },
    accent: { h: 217.2, s: 32.6, l: 17.5 },
    'accent-foreground': { h: 210, s: 40, l: 98 },
    destructive: { h: 0, s: 62.8, l: 30.6 },
    'destructive-foreground': { h: 210, s: 40, l: 98 },
    ring: { h: 217.2, s: 32.6, l: 17.5 },
    cancel: { h: 0, s: 60, l: 20 },
    'cancel-foreground': { h: 0, s: 80, l: 80 },
    'public-bg': { h: 220, s: 50, l: 42.5 },
    'public-foreground-solid': { h: 210, s: 40, l: 98 },
    'private-bg': { h: 270, s: 30, l: 42.5 },
    'private-foreground-solid': { h: 210, s: 40, l: 98 },
    'organisation-bg': { h: 80, s: 40, l: 42.5 },
    'organisation-foreground-solid': { h: 210, s: 40, l: 98 },
    success: { h: 120, s: 40, l: 40 },
    'success-fg': { h: 120, s: 40, l: 80 },
    'success-border': { h: 120, s: 40, l: 30 },
    error: { h: 0, s: 60, l: 20 },
    'error-fg': { h: 0, s: 60, l: 80 },
    'error-border': { h: 0, s: 60, l: 30 },
    'public-text': { h: 200, s: 90, l: 70 },
    'private-text': { h: 270, s: 100, l: 70 },
    'organisation-text': { h: 80, s: 60, l: 80 },
    olive: { h: 80, s: 40, l: 50 },
    'olive-foreground': { h: 80, s: 40, l: 90 },
    'focus-background-solid-dark': { h: 270, s: 30, l: 47.5 },
    'break-background-solid-dark': { h: 220, s: 50, l: 47.5 },
    'neutral-background': { h: 210, s: 20, l: 15 },
  }
};

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Dynamically generate color definitions from rawHslColors
        ...Object.fromEntries(
          Object.keys(rawHslColors.light).map(colorName => {
            const colorDefinition: any = {
              DEFAULT: `hsl(var(--${colorName}-h) var(--${colorName}-s)% var(--${colorName}-l)%)`,
            };
            // Add foreground for colors that have it defined in the original config
            if (colorName.endsWith('-foreground') || colorName.endsWith('-fg') || colorName.endsWith('-text') || colorName.endsWith('-solid')) {
              // These are foreground/text colors, not backgrounds that need hover lightness adjustment
              // Their DEFAULT is already defined above.
            } else {
              // For background colors, also define a hover state using the calculated lightness
              colorDefinition.hover = `hsl(var(--${colorName}-h) var(--${colorName}-s)% var(--${colorName}-l-hover)%)`;
            }
            return [colorName, colorDefinition];
          })
        ),
        // Explicitly define foregrounds for main colors if they are not covered by the loop
        primary: {
          DEFAULT: 'hsl(var(--primary-h) var(--primary-s)% var(--primary-l)%)',
          foreground: 'hsl(var(--primary-foreground-h) var(--primary-foreground-s)% var(--primary-foreground-l)%)',
          hover: 'hsl(var(--primary-h) var(--primary-s)% var(--primary-l-hover)%)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary-h) var(--secondary-s)% var(--secondary-l)%)',
          foreground: 'hsl(var(--secondary-foreground-h) var(--secondary-foreground-s)% var(--secondary-foreground-l)%)',
          hover: 'hsl(var(--secondary-h) var(--secondary-s)% var(--secondary-l-hover)%)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive-h) var(--destructive-s)% var(--destructive-l)%)',
          foreground: 'hsl(var(--destructive-foreground-h) var(--destructive-foreground-s)% var(--destructive-foreground-l)%)',
          hover: 'hsl(var(--destructive-h) var(--destructive-s)% var(--destructive-l-hover)%)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted-h) var(--muted-s)% var(--muted-l)%)',
          foreground: 'hsl(var(--muted-foreground-h) var(--muted-foreground-s)% var(--muted-foreground-l)%)',
          hover: 'hsl(var(--muted-h) var(--muted-s)% var(--muted-l-hover)%)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent-h) var(--accent-s)% var(--accent-l)%)',
          foreground: 'hsl(var(--accent-foreground-h) var(--accent-foreground-s)% var(--accent-foreground-l)%)',
          hover: 'hsl(var(--accent-h) var(--accent-s)% var(--accent-l-hover)%)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover-h) var(--popover-s)% var(--popover-l)%)',
          foreground: 'hsl(var(--popover-foreground-h) var(--popover-foreground-s)% var(--popover-foreground-l)%)',
          hover: 'hsl(var(--popover-h) var(--popover-s)% var(--popover-l-hover)%)',
        },
        card: {
          DEFAULT: 'hsl(var(--card-h) var(--card-s)% var(--card-l)%)',
          foreground: 'hsl(var(--card-foreground-h) var(--card-foreground-s)% var(--card-foreground-l)%)',
          hover: 'hsl(var(--card-h) var(--card-s)% var(--card-l-hover)%)',
        },
        cancel: {
          DEFAULT: 'hsl(var(--cancel-h) var(--cancel-s)% var(--cancel-l)%)',
          foreground: 'hsl(var(--cancel-foreground-h) var(--cancel-foreground-s)% var(--cancel-foreground-l)%)',
          hover: 'hsl(var(--cancel-h) var(--cancel-s)% var(--cancel-l-hover)%)',
        },
        'public-bg': {
          DEFAULT: 'hsl(var(--public-bg-h) var(--public-bg-s)% var(--public-bg-l)%)',
          foreground: 'hsl(var(--public-foreground-solid-h) var(--public-foreground-solid-s)% var(--public-foreground-solid-l)%)',
          hover: 'hsl(var(--public-bg-h) var(--public-bg-s)% var(--public-bg-l-hover)%)',
        },
        'private-bg': {
          DEFAULT: 'hsl(var(--private-bg-h) var(--private-bg-s)% var(--private-bg-l)%)',
          foreground: 'hsl(var(--private-foreground-solid-h) var(--private-foreground-solid-s)% var(--private-foreground-solid-l)%)',
          hover: 'hsl(var(--private-bg-h) var(--private-bg-s)% var(--private-bg-l-hover)%)',
        },
        'organisation-bg': {
          DEFAULT: 'hsl(var(--organisation-bg-h) var(--organisation-bg-s)% var(--organisation-bg-l)%)',
          foreground: 'hsl(var(--organisation-foreground-solid-h) var(--organisation-foreground-solid-s)% var(--organisation-foreground-solid-l)%)',
          hover: 'hsl(var(--organisation-bg-h) var(--organisation-bg-s)% var(--organisation-bg-l-hover)%)',
        },
        success: {
          DEFAULT: 'hsl(var(--success-h) var(--success-s)% var(--success-l)%)',
          foreground: 'hsl(var(--success-fg-h) var(--success-fg-s)% var(--success-fg-l)%)',
          border: 'hsl(var(--success-border-h) var(--success-border-s)% var(--success-border-l)%)',
          hover: 'hsl(var(--success-h) var(--success-s)% var(--success-l-hover)%)',
        },
        error: {
          DEFAULT: 'hsl(var(--error-h) var(--error-s)% var(--error-l)%)',
          foreground: 'hsl(var(--error-fg-h) var(--error-fg-s)% var(--error-fg-l)%)',
          border: 'hsl(var(--error-border-h) var(--error-border-s)% var(--error-border-l)%)',
          hover: 'hsl(var(--error-h) var(--error-s)% var(--error-l-hover)%)',
        },
        olive: {
          DEFAULT: 'hsl(var(--olive-h) var(--olive-s)% var(--olive-l)%)',
          foreground: 'hsl(var(--olive-foreground-h) var(--olive-foreground-s)% var(--olive-foreground-l)%)',
          hover: 'hsl(var(--olive-h) var(--olive-s)% var(--olive-l-hover)%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(function({ addBase }) {
      const rootCssVars: Record<string, string | number> = {};
      const darkCssVars: Record<string, string | number> = {};

      // Helper to generate HSL variables for a given mode and color set
      const generateHslVars = (colorSet: typeof rawHslColors.light, targetVars: Record<string, string | number>) => {
        for (const colorName in colorSet) {
          const { h, s, l } = colorSet[colorName as keyof typeof colorSet];
          targetVars[`--${colorName}-h`] = h;
          targetVars[`--${colorName}-s`] = `${s}%`;
          targetVars[`--${colorName}-l`] = `${l}%`;
          targetVars[`--${colorName}`] = `var(--${colorName}-h) var(--${colorName}-s) var(--${colorName}-l)`;

          // Calculate hover lightness
          const hoverL = l < 50 ? Math.min(100, l + 10) : Math.max(0, l - 10);
          targetVars[`--${colorName}-l-hover`] = `${hoverL}%`;
        }
      };

      generateHslVars(rawHslColors.light, rootCssVars);
      generateHslVars(rawHslColors.dark, darkCssVars);

      addBase({
        ':root': rootCssVars,
        '.dark': darkCssVars,
      });
    }),
  ],
};

export default config;