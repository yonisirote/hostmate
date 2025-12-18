# AGENTS.md - Guidelines for Coding Agents

## Build/Lint/Test Commands

### Root Level
- `npm run build` - Build both backend and frontend
- `npm run start` - Start production server

### Backend (cd backend/)
- `npm run dev` - Development server with TypeScript compilation
- `npm run build` - TypeScript compilation only
- `npm run lint` - ESLint check
- `npm run test` - Run Jest tests (use `npm run test -- path/to/test.test.ts` for single test)
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Frontend (cd frontend/)
- `npm run dev` - Vite development server
- `npm run build` - TypeScript + Vite build
- `npm run lint` - ESLint check
- `npm run preview` - Preview built app

## Code Style Guidelines

### Import Organization
- **Backend**: Type imports → Third-party → Local, use explicit `.js` extensions
- **Frontend**: React → Third-party → Local, no file extensions
- Use `import type` for type-only imports

### Naming Conventions
- **Components**: PascalCase (DishCard, MealList, EditDishModal)
- **Functions**: camelCase with descriptive suffixes (getDishesHandler, fetchDishes)
- **Files**: kebab-case for features, PascalCase for components
- **Custom hooks**: `use` prefix (useAuth, useGuestRank)

### Type Safety
- Strict TypeScript enabled with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Use `type` over `interface` for most cases
- Schema-driven types from Drizzle ORM
- Optional properties with `?` operator

### Error Handling
- **Backend**: Custom HttpError class, centralized error middleware
- **Frontend**: Toast notifications, type guards for error objects
- Always include specific error messages and status codes

### File Structure
- Feature-based organization: `api/`, `components/`, `types.ts`
- CRUD patterns: get/add/edit/delete functions
- Consistent response formats across API endpoints
- Authentication middleware for protected routes

### React Patterns
- Controlled components with explicit state
- Portals for modals
- Memoization with useMemo/useEffect when appropriate
- Descriptive prop interfaces

### Database
- Drizzle ORM with TypeScript
- Migration-based schema changes
- Resource ownership verification in CRUD operations
