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
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))' // NEW: Primary hover color
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))' // NEW: Secondary hover color
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					hover: 'hsl(var(--destructive-hover))' // NEW: Destructive hover color
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
					DEFAULT: 'hsl(80 60% 40%)', // A shade of olive green
					foreground: 'hsl(0 0% 100%)', // White text for contrast
				},
				cancel: { // NEW: Added cancel color
					DEFAULT: 'hsl(var(--cancel))',
					foreground: 'hsl(var(--cancel-foreground))'
				},
				'public-bg': { // NEW: Public background color
					DEFAULT: 'hsl(var(--public-background-solid))',
					foreground: 'hsl(var(--public-foreground-solid))',
					hover: 'hsl(var(--public-bg-hover-light))', // NEW: Public background hover color (light mode)
					'hover-dark': 'hsl(var(--public-bg-hover-dark))', // NEW: Public background hover color (dark mode)
				},
				'private-bg': { // NEW: Private background color
					DEFAULT: 'hsl(var(--private-background-solid))',
					foreground: 'hsl(var(--private-foreground-solid))',
					hover: 'hsl(var(--private-bg-hover-light))', // NEW: Private background hover color (light mode)
					'hover-dark': 'hsl(var(--private-bg-hover-dark))', // NEW: Private background hover color (dark mode)
				},
				'organisation-bg': { // NEW: Organisation background color
					DEFAULT: 'hsl(var(--organisation-background-solid))',
					foreground: 'hsl(var(--organisation-foreground-solid))',
					hover: 'hsl(var(--organisation-bg-hover-light))', // NEW: Organisation background hover color (light mode)
					'hover-dark': 'hsl(var(--organisation-bg-hover-dark))', // NEW: Organisation background hover color (dark mode)
				},
				success: { // NEW: Success color for granted states
					DEFAULT: 'hsl(var(--success-bg))',
					foreground: 'hsl(var(--success-fg))',
					border: 'hsl(var(--success-border))',
					hover: 'hsl(var(--success-hover))',
				},
				error: { // NEW: Error color for denied states
					DEFAULT: 'hsl(var(--error-bg))',
					foreground: 'hsl(var(--error-fg))',
					border: 'hsl(var(--error-border))',
					hover: 'hsl(var(--error-hover))',
				},
				'public-text': { // NEW: Public text color
					DEFAULT: 'hsl(var(--public-text))',
				},
				'private-text': { // NEW: Private text color
					DEFAULT: 'hsl(var(--private-text))',
				},
				'organisation-text': { // NEW: Organisation text color
					DEFAULT: 'hsl(var(--organisation-text))',
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