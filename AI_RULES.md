# AI Development Rules for FlowSesh

This document outlines the core technologies used in the FlowSesh application and provides guidelines for library usage to ensure consistency, maintainability, and adherence to best practices.

## Tech Stack Overview

*   **Vite**: A fast build tool that provides a quick development server and optimized builds.
*   **TypeScript**: The primary programming language, offering type safety and improved code quality.
*   **React**: The JavaScript library used for building the user interface.
*   **shadcn/ui**: A collection of reusable UI components built on Radix UI and styled with Tailwind CSS.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly styling components.
*   **React Router**: Used for declarative routing within the single-page application.
*   **Lucide React**: A library providing a set of beautiful and customizable SVG icons.
*   **TanStack Query**: For efficient data fetching, caching, and synchronization with the server.
*   **Sonner**: A modern toast notification library for displaying ephemeral messages.
*   **Supabase**: A backend-as-a-service platform used for database and authentication functionalities.
*   **React Hook Form & Zod**: For robust form management and schema-based validation.

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please adhere to the following rules when developing new features or modifying existing ones:

*   **UI Components**: Always prioritize `shadcn/ui` components for building the user interface. If a specific component is not available or requires significant customization, create a new component file in `src/components/` and style it using Tailwind CSS. **Do not modify existing `shadcn/ui` component files.**
*   **Styling**: All styling must be done using **Tailwind CSS** classes. Avoid creating custom CSS files (`.css`) unless absolutely necessary for global styles (e.g., `src/index.css`).
*   **Routing**: Use `react-router-dom` for all client-side navigation. All main application routes should be defined in `src/App.tsx`.
*   **Icons**: Use icons from the `lucide-react` library.
*   **State Management**:
    *   For global application state (e.g., timer context), use React's Context API.
    *   For local component state, use React's `useState` and `useReducer` hooks.
    *   For data fetching, caching, and synchronization with backend data, use **TanStack Query**.
*   **Forms**: Implement forms using `react-hook-form` for form state management and validation. Use `zod` for defining form schemas and validation rules.
*   **Notifications**: For displaying temporary, non-intrusive messages to the user (e.g., success, error, info), use the `sonner` toast library.
*   **Backend Interactions**: All interactions with the backend, including authentication, database queries, and real-time subscriptions, should be handled using the `@supabase/supabase-js` client.