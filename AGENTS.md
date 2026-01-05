# AGENTS.md - Guidelines for Coding Agents

## Build/Lint/Test Commands

### Root Level
- `npm run build` - Build both backend and frontend
- `npm run start` - Start production server

### Backend (cd backend/)
- `npm run dev` - Development server with TypeScript compilation
- `npm run build` - TypeScript compilation only
- `npm run lint` - ESLint check
- `npm run test` - Run all Jest tests
- `npm run test -- path/to/test.test.ts` - Run single backend test
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Frontend (cd frontend/)
- `npm run dev` - Vite development server
- `npm run build` - TypeScript + Vite build
- `npm run lint` - ESLint check
- `npm run preview` - Preview built app
- `npm run test:run` - Run all Vitest tests
- `npm run test -- path/to/test.test.tsx` - Run single frontend test
- `npm run test:ui` - Run Vitest with interactive UI

## Code Style Guidelines

### Import Organization
- **Backend**: Type imports → Third-party → Local, use explicit `.js` extensions (ESM modules)
- **Frontend**: React → TanStack Query → Third-party → Local, no file extensions
- Use `import type` for type-only imports
- React: `import { useState, useEffect } from 'react'`
- TanStack Query: `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'`
- Icons: `import { Plus, Pencil, Trash2 } from 'lucide-react'`
- Utilities: `import { toast } from 'react-hot-toast'`; `import { clsx } from 'clsx'`

### Naming Conventions
- **Components**: PascalCase (DishCard, MealList, EditDishModal)
- **Functions**: camelCase with descriptive suffixes (getDishesHandler, addGuestMutation, fetchDishes)
- **Files**: kebab-case for features (guests-handler.ts, auth-context.ts), PascalCase for components
- **Custom hooks**: `use` prefix (useAuth, useGuestRank)
- **Constants**: UPPER_SNAKE_CASE (ALLERGIES, DISH_CATEGORIES)

### Type Safety
- **Backend**: Strict TypeScript with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, ES2022 target
- **Frontend**: Use `type` over `interface` for most cases; `interface` for React props only
- Schema-driven types from Drizzle ORM in backend
- Optional properties with `?` operator
- Type imports from schema for constants (e.g., `type DishCategory = 'main' | 'side' | 'dessert' | 'other'`)

### Error Handling
- **Backend**: Custom HttpError class (`new HttpError(400, "message")`), centralized error middleware, type guards (`isHttpError`)
- **Frontend**: Toast notifications (`toast.success/error/warning`), type guards for error objects
- Always include specific error messages and HTTP status codes
- Protected routes: call `authenticateUserId(req)` at handler start; throw 401 for missing token, 403 for forbidden

### File Structure
- **Backend**: `src/api/routes/`, `src/api/handlers/`, `src/api/handlers/__tests__/`, `src/db/queries/`, `src/api/middleware/`
- **Frontend**: `src/pages/`, `src/components/`, `src/context/`, `src/lib/`, `tests/`
- CRUD patterns: `add*/edit*/delete*` handler and query functions
- Consistent API responses: `res.status(200).json(data)` for success, `res.status(204).send()` for delete
- Authentication: Protected handlers must authenticate and verify resource ownership

### React Patterns
- Controlled components with explicit state (`useState`, `useReducer`)
- TanStack Query for data fetching: `useQuery` for read, `useMutation` for write
- After mutations: `queryClient.invalidateQueries({ queryKey: ['resource'] })` to refresh
- Portals for modals, toast for user feedback
- Memoization with `useMemo`/`useCallback` sparingly (not required by default)
- Descriptive prop interfaces; event handlers named `handle*` or `on*`

### Database & Backend
- Drizzle ORM with TypeScript; migration-based schema changes via `npm run db:generate/migrate`
- Resource ownership verification: extract `userId` from token, verify it owns the resource
- Use constants from schema for enum validation (e.g., `DISH_CATEGORIES.includes(category)`)
- Router patterns: group routes by resource (`guestsRouter`, `dishesRouter`, `authRouter`)

### Testing
- **Backend (Jest)**: Use `jest.unstable_mockModule` for ES module mocking, reset mocks in `beforeEach`
- **Frontend (Vitest)**: `npm run test:run`, environment `jsdom`, setup files defined in `vitest.config.ts`
- **Browser APIs**: Shim `localStorage`, `matchMedia`, `navigator.clipboard` in `tests/setup.ts`
- **MSW**: Centralized handlers in `tests/msw/handlers.ts`, reset after each test
- **Auth Tests**: Set `localStorage.setItem('user', JSON.stringify(user))` to simulate authenticated state

### CSS/Tailwind
- Warm color palette: `bg-warm-50` (lightest) through `text-warm-950` (darkest)
- Utility function: `cn()` merges clsx and tailwind-merge (`import { cn } from '../lib/api'`)
- Responsive: use Tailwind prefixes (`md:`, `lg:`)
- Interactive states: hover/focus/active (`hover:bg-warm-700`, `focus:ring`, `active:scale-95`)

### API & Authentication
- **Dual-token system**: Access token in memory (15 min), refresh token as httpOnly cookie (12 hours)
- **Interceptors**: Axios request adds `Authorization: Bearer <token>`; response handles 401 and auto-refreshes
- **Cookies**: Set `withCredentials: true` in axios; backend uses `res.cookie("refreshToken", ...)` with httpOnly, sameSite
- **Public endpoints**: `/guests/token/:rankToken` and POST `/guests/token/:rankToken/dishes/:dishId` (no auth)
