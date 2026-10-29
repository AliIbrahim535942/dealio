# Dealio Frontend

A contract-driven React foundation for the Dealio marketplace. This project intentionally contains no product, order, seller, customer, cart, payment, or checkout domain models until backend contracts are available.

## Stack

React, TypeScript, Vite, React Router, Tailwind CSS, Radix UI primitives, TanStack Query, Zustand, Axios, React Hook Form, Zod, Lucide React, and ESLint.

## Commands

- `npm run dev` starts the Vite development server.
- `npm run build` runs strict TypeScript checking and creates a production build.
- `npm run lint` runs ESLint.
- `npm run preview` serves the production build locally.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`. Only non-secret public configuration belongs in Vite environment variables. Never put tokens, passwords, private keys, or other secrets in frontend environment variables: Vite bundles `VITE_*` values into browser-delivered code.

## Architecture

- `src/app`: application providers and route composition.
- `src/components`: reusable UI and shared composition primitives.
- `src/features`: feature-specific modules added only after an API contract exists.
- `src/lib`: framework-neutral utilities and the Axios client.
- `src/layouts`: storefront, authentication, and administration shells.
- `src/shared`: future cross-feature types, constants, and schemas.
- `src/stores`: small client-only state such as the authentication placeholder.

Start the first marketplace feature by adding its contract-backed feature folder under `src/features`, its API calls under `src/services`, and composing its page route under `src/app/router`. Keep domain-specific types and validation schemas close to that feature.
