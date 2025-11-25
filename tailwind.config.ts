import type { Config } from "tailwindcss";

export default {
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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					hover: 'hsl(var(--background-hover))', // NEW
				},
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))', // NEW
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))', // NEW
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					hover: 'hsl(var(--destructive-hover))', // NEW
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
					hover: 'hsl(var(--muted-hover))', // NEW
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))', // NEW
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
					hover: 'hsl(var(--popover-hover))', // NEW
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					hover: 'hsl(var(--card-hover))', // NEW
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				olive: {
					DEFAULT: 'hsl(var(--olive))',
					foreground: 'hsl(var(--olive-foreground))',
					hover: 'hsl(var(--olive-hover))', // NEW
				},
				cancel: { // NEW: Added cancel color
					DEFAULT: 'hsl(var(--cancel))',
					foreground: 'hsl(var(--cancel-foreground))',
					hover: 'hsl(var(--cancel-hover))', // NEW
				},
				'public-bg': { // NEW: Public background color
					DEFAULT: 'hsl(var(--public-background-solid))',
					foreground: 'hsl(var(--public-foreground-solid))',
					hover: 'hsl(var(--public-background-solid-hover))', // NEW
				},
				'private-bg': { // NEW: Private background color
					DEFAULT: 'hsl(var(--private-background-solid))',
					foreground: 'hsl(var(--private-foreground-solid))',
					hover: 'hsl(var(--private-background-solid-hover))', // NEW
				},
				'organisation-bg': { // NEW: Organisation background color
					DEFAULT: 'hsl(var(--organisation-background-solid))',
					foreground: 'hsl(var(--organisation-foreground-solid))',
					hover: 'hsl(var(--organisation-background-solid-hover))', // NEW
				},
				success: { // NEW: Success color for granted states
					DEFAULT: 'hsl(var(--success-bg))',
					foreground: 'hsl(var(--success-fg))',
					border: 'hsl(var(--success-border))',
					hover: 'hsl(var(--success-bg-hover))', // NEW
				},
				error: { // NEW: Error color for denied states
					DEFAULT: 'hsl(var(--error-bg))',
					foreground: 'hsl(var(--error-fg))',
					border: 'hsl(var(--error-border))',
					hover: 'hsl(var(--error-bg-hover))', // NEW
				},
				'public-text': { // NEW: Public text color
					DEFAULT: 'hsl(var(--public-text))',
				},
				'private-text': { // NEW: Private text color
					DEFAULT: 'hsl(var(--private-text))',
				},
				'organisation-text': { // NEW: Organisation text color
					DEFAULT: 'hsl(var(--organisation-text))',
				},
				'slider-gradient-start': { // NEW: Slider gradient start color
					DEFAULT: 'hsl(var(--slider-gradient-start-light))',
					dark: 'hsl(var(--slider-gradient-start-dark))',
				},
				'slider-gradient-end': { // NEW: Slider gradient end color
					DEFAULT: 'hsl(var(--slider-gradient-end-light))',
					dark: 'hsl(var(--slider-gradient-end-dark))',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;