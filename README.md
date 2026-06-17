# FitMind Web Dashboard

FitMind Web Dashboard is the React web dashboard for the FitMind gym management and fitness platform. It is used mainly by admins and coaches to manage gym operations, members, subscriptions, coaches, content, nutrition, news, injuries, AI-assisted training plan requests, AI nutrition plan requests, coach sessions, feedback, and dashboard statistics.

This repository contains the frontend single-page application. It communicates with the FitMind Laravel REST API and sends AI-related workflows through backend endpoints that integrate with the FitMind AI service.

## Main Features

### Authentication

- Login form connected to the backend `/login` endpoint.
- Forgot password flow with OTP verification.
- Reset password flow using a reset token stored in `sessionStorage`.
- Auth token, role, email, user ID, and optional user name stored in `localStorage`.
- Axios request interceptor that attaches `Authorization: Bearer <token>` for authenticated API calls.
- Logout action in both admin and coach layouts, calling `/logout` and clearing stored auth data.

### Role-Based Dashboard Layouts

- Admin layout with sidebar navigation for dashboard, members, coaches, subscriptions, coach sessions, content, nutrition, injury prevention, feedback, and news.
- Coach layout with sidebar navigation for dashboard, members, AI training requests, AI nutrition requests, coach sessions, content, nutrition, injury prevention, and news.
- Sticky top bar with current route context, language switcher, and system status indicator.
- English/Arabic translation provider with LTR/RTL direction handling.

### Dashboard Analytics

- Admin dashboard cards for total members, active subscriptions, equipment issues, and monthly revenue.
- Daily and weekly subscription charts using Recharts.
- Recent equipment issues and member activity summaries.
- Smart sync and full sync actions through `/sync-all` endpoints.
- Coach dashboard summary cards for members, news, nutrition categories, and exercise categories.
- Coach-specific subscription summary based on subscriptions created by the current coach.

### Members and Subscriptions

- Members management table with search, status filtering, sorting, and member creation for admin/manager roles.
- Member details page with overview, subscription, and nutrition tabs.
- Member profile details including gender, age, height, weight, goal, target weight, and subscription status.
- Subscription renew, freeze, and resume actions.
- Admin-only plan management inside member details: create, update, and delete plans.
- Admin subscription management page with search, status filter, creator-role filter, pagination, status badges, and details drawer.

### Coaches and Sessions

- Admin coach management page with coach listing, coach creation, search, and status summaries.
- Coach session management for coaches, including create, update, cancel, delete, schedule view, recurring sessions, capacity, bookings, and details dialogs.
- Admin coach sessions page with all coach sessions, filters by coach/status/date, booking counts, cancel and restore actions, and session details.

### Content and Exercise Management

- Exercise category/content management with create, update, delete, search, and category cards.
- Exercise list per category with search, difficulty filter, create, update, delete, video URL, instructions, common mistakes, and difficulty levels.
- General exercise services and hooks are separated from individual exercise CRUD services.

### Nutrition Library

- Nutrition category library with create, update, delete, search, icons, descriptions, and food counts.
- Food management by nutrition category.
- Food CRUD with calories, protein, carbs, fat, serving size, image URL, and category association.
- Food search and calorie range filtering in category pages.

### News Management

- News creation as published or draft.
- News listing with search, sort order, backend pagination for the default listing, and local filtered pagination for status views.
- Status filters for all, published, drafts, expired, and trash/deleted.
- Publish draft, restore deleted item, edit news, delete/trash news, view details, and expiry date handling.
- News stats for published count, draft count, and total views where returned by the backend.

### Injury Prevention

- Injury dashboard with paginated injury records.
- Create, update, and delete injury records.
- Filters for injury status and severity.
- Injury details include member, injury type, severity, notes, status, and AI-related modification context when provided by the backend.

### AI Training and Nutrition Requests

- Coach-facing AI training plan request queue from `/modification-requests/training`.
- Coach-facing AI nutrition modification request queue from `/modification-requests/nutrition`.
- Review generated or modified plans, inspect user request details, edit plan contents, save changes, delete requests, and approve final plans.
- Exercise search through `/search-exercises`.
- Food search through `/search-foods`.
- Training request utilities normalize safety context such as injury warnings, restrictions, alternatives, RAG summaries, sources, generation mode, fallback reason, and debug context when provided by the backend.
- Nutrition request utilities calculate meal and plan macro totals.

### Feedback

- Admin feedback dashboard for equipment issues, trainer ratings, and suggestions.
- Equipment issue status updates.
- Suggestion status updates.
- Feedback deletion with confirmation dialogs.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4, custom theme CSS |
| Routing | React Router DOM 7 |
| Server state | TanStack React Query 5 |
| HTTP client | Axios |
| UI primitives | Radix UI primitives and shadcn-style components in `src/components/ui` |
| Icons | Lucide React, Radix Icons |
| Charts | Recharts |
| Forms and UI helpers | React Hook Form, class-variance-authority, clsx, tailwind-merge |
| Notifications | Sonner dependency and local toast state in several pages |
| Tooling | ESLint 9, TypeScript 5 |

## Project Structure

```text
.
|-- public/                  # Static public assets
|-- src/
|   |-- components/          # Shared components and shadcn-style UI primitives
|   |-- hooks/               # React Query hooks grouped by feature
|   |-- i18n/                # English/Arabic dictionaries and translation provider
|   |-- layouts/             # AdminLayout and CoachLayout
|   |-- pages/               # Route-level pages for auth, admin, coach, and shared dashboard areas
|   |-- routes/              # React Router route definitions
|   |-- services/            # Backend API clients and feature service functions
|   |-- styles/              # Tailwind import, theme variables, fonts, RTL/LTR CSS
|   |-- utils/               # Feature-specific mapping, formatting, filtering, and payload helpers
|   |-- App.tsx              # App shell with translation provider and router provider
|   `-- main.tsx             # React root and QueryClientProvider
|-- Dockerfile               # Development container image for Vite
|-- eslint.config.js         # ESLint flat config
|-- package.json             # Dependencies and npm scripts
|-- tsconfig*.json           # TypeScript configuration
`-- vite.config.ts           # Vite React and Tailwind plugin setup
```

Notes:

- There is no `src/lib` directory in the current tree. Shared helpers live mainly in `src/utils`, and UI helper code lives in `src/components/ui/utils.ts`.
- There is no `src/assets` directory in the current tree. Static public assets currently live under `public/`.

## API Integration

The dashboard communicates with the FitMind Laravel backend REST API.

The shared Axios client is defined in `src/services/api.ts`:

- Base URL: `http://127.0.0.1:8000/api`
- Default JSON headers
- Request interceptor that reads `token` from `localStorage`
- Automatic `Authorization: Bearer <token>` header when a token exists

Feature API calls are organized in `src/services`, including:

| Service file | Purpose |
| --- | --- |
| `auth.ts` | Login, logout, forgot password, OTP verification, reset password, auth storage helpers |
| `dashboard.ts` | Admin dashboard statistics |
| `aiSync.ts` | Smart sync and full sync endpoints |
| `members.ts` | Member list, details, overview, nutrition, plans, renew/freeze/resume subscription |
| `plans.ts` | Plan CRUD |
| `coaches.ts` | Coach list and coach creation |
| `coachSessions.ts` | Admin and coach session APIs |
| `subscriptions.ts` / `subscriptionAdmin.ts` | Admin subscription listing |
| `generalExercises.ts` | Exercise category CRUD |
| `exercises.ts` | Exercise CRUD by general exercise category |
| `generalNutrition.ts` | Nutrition category CRUD |
| `foods.ts` | Food CRUD |
| `news.ts` | News list, stats, create, update, delete |
| `injuries.ts` | Injury dashboard and injury CRUD |
| `feedback.ts` | Feedback dashboard, update, delete |
| `aiPlanRequests.ts` | Training modification requests, approval, exercise search |
| `aiNutritionRequests.ts` | Nutrition modification requests, approval, food search |

AI-related actions are sent through the Laravel API. The React app does not call the FastAPI AI service directly. Endpoints such as `/sync-all`, `/search-exercises`, `/search-foods`, and `/modification-requests/*` are backend-facing integration points for AI workflows.

One implementation detail to be aware of: `src/services/exercises.ts` creates its own Axios client with the same local API base URL instead of importing the shared `api` instance.

## Installation and Setup

### Prerequisites

- Node.js 20 or newer is recommended.
- npm.
- Running FitMind Laravel backend API available at the configured API base URL.

### Local Development

Install dependencies:

```bash
npm install
```

Configure the backend API URL:

- No `.env.example` file is currently included.
- The API URL is currently hardcoded as `http://127.0.0.1:8000/api` in `src/services/api.ts`.
- `src/services/exercises.ts` also has its own hardcoded `API_BASE_URL`.
- If your Laravel backend runs on another host or port, update both places before running the dashboard.

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

### Docker

The included Dockerfile installs dependencies and runs the Vite development server on port `5173`.

```bash
docker build -t fitmind-web-dashboard .
docker run --rm -p 5173:5173 fitmind-web-dashboard
```

## Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `vite` | Start the Vite development server. |
| `npm run build` | `tsc -b && vite build` | Type-check with TypeScript project references and build the app. |
| `npm run lint` | `eslint .` | Run ESLint across the repository. |
| `npm run preview` | `vite preview` | Preview the production build locally. |

There is no standalone `typecheck` or `test` script defined in `package.json`.

## Pages and Routes Overview

Routes are defined in `src/routes/AppRoutes.tsx`.

### Public Routes

| Route | Page |
| --- | --- |
| `/` | Login |
| `/forgot-password` | Forgot password and OTP verification |
| `/reset-password` | Reset password |
| `*` | Redirects to `/` |

### Admin Routes

All admin routes are nested under `AdminLayout`.

| Route | Page |
| --- | --- |
| `/dashboard/admin` | Admin dashboard |
| `/dashboard/admin/members` | Members management |
| `/dashboard/admin/members/:memberId` | Member details |
| `/dashboard/admin/coaches` | Coaches management |
| `/dashboard/admin/content` | Exercise category/content management |
| `/dashboard/admin/nutrition` | Nutrition library |
| `/dashboard/admin/nutrition/:categoryId` | Foods by nutrition category |
| `/dashboard/admin/exercises/:categoryId` | Exercises by category |
| `/dashboard/admin/injury-prevention` | Injury prevention |
| `/dashboard/admin/feedback` | Feedback management |
| `/dashboard/admin/news` | News management |
| `/dashboard/admin/subscriptions` | Subscriptions management |
| `/dashboard/admin/coach-sessions` | Admin coach sessions |

### Coach Routes

All coach routes are nested under `CoachLayout`.

| Route | Page |
| --- | --- |
| `/dashboard/coach` | Coach dashboard |
| `/dashboard/coach/members` | Members management |
| `/dashboard/coach/members/:memberId` | Member details |
| `/dashboard/coach/content` | Exercise category/content management |
| `/dashboard/coach/nutrition` | Nutrition library |
| `/dashboard/coach/nutrition/:categoryId` | Foods by nutrition category |
| `/dashboard/coach/exercises/:categoryId` | Exercises by category |
| `/dashboard/coach/injury-prevention` | Injury prevention |
| `/dashboard/coach/news` | News management |
| `/dashboard/coach/ai-plan-requests` | AI training plan requests |
| `/dashboard/coach/ai-nutrition-requests` | AI nutrition plan requests |
| `/dashboard/coach/coach-sessions` | Coach session management |

## UI and UX Notes

- The dashboard uses a light main workspace with a dark teal sidebar.
- Admin and coach layouts share the same high-level navigation pattern but expose role-specific navigation items.
- Most management pages use responsive grids, searchable lists, tables with horizontal overflow handling, and dialogs with constrained mobile-friendly widths.
- Reusable UI primitives live under `src/components/ui`.
- Icons are provided mainly through `lucide-react`.
- The app includes a language switcher and CSS rules for Arabic RTL support.
- The app uses Tailwind CSS utilities plus `src/styles/theme.css` for theme variables and base styles.

## Integration With the FitMind System

FitMind is composed of multiple cooperating parts:

- Laravel backend: primary REST API, authentication, authorization, database-backed management features, and backend endpoints for AI workflows.
- FastAPI AI service: used through backend integration for AI search, sync, and plan modification flows. This web dashboard does not call it directly.
- Mobile app: member-facing application for gym members.
- Web dashboard: this repository, used mainly by admins and coaches for operational management.

## Known Notes and Current Limitations

- The backend API base URL is hardcoded in `src/services/api.ts` and `src/services/exercises.ts`; there is no `.env.example` in the current repository.
- `AppRoutes.tsx` does not define a frontend protected-route wrapper. Backend authorization still applies to API requests, and layouts are role-aware, but route access is not guarded at the router level.
- Routes are implemented for admin and coach dashboards. The login page contains redirect branches for `manager` and `user`, but manager/user dashboard routes are not defined in `AppRoutes.tsx`.
- Food badge values appear in the food UI state and display helpers, but the current `FoodPayload` sent by `src/services/foods.ts` includes category, name, calories, macros, serving size, and image only.
- No automated test script is defined in `package.json`; current verification scripts are `build` and `lint`.

## Graduation Project Note

This dashboard is part of the FitMind graduation project. It represents the staff-facing operational dashboard for the broader FitMind AI-powered gym management and fitness platform.

## Authors

FitMind graduation project team.

## License

No license file is currently included. Add a license before distributing or publishing this project publicly.
