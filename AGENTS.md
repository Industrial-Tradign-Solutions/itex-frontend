# AGENTS.md

## Project Overview
Angular 18 enterprise application (NgModule pattern, not standalone). Uses PrimeNG UI framework with lazy-loaded routing. Backend API expected at `http://localhost:8080/itex/api/`.

## Developer Commands
```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build to dist/itex
npm test           # Karma unit tests
```

## Architecture
- **Entry point**: `src/main.ts` bootstraps `AppModule`
- **Root routing**: `src/app/app-routing.module.ts` with lazy-loaded `LoginModule` (`/login`) and `PrincipalModule` (`/p`)
- **App component**: `src/app/app.component.ts` - root shell only
- **Layout**: `LayoutPrimeModule` (`src/app/layout/layout.module.ts`) provides sidebar, topbar, breadcrumb
- **Auth guard**: `authenticatedGuard` redirects to `/login` if unauthenticated
- **HTTP**: `AuthInterceptor` (`src/app/config/interceptors/auth.interceptor.ts`) handles token errors

## Path Aliases (tsconfig.json)
```
@services/*   -> src/app/services/*
@components/* -> src/app/components/*
@modals/*     -> src/app/modals/*
@guards/*     -> src/app/guards/*
@interfaces/* -> src/app/models/*
@pages/*      -> src/app/pages/*
@layout/*     -> src/app/layout/*
@pipes/*      -> src/app/pipes/*
@config/*     -> src/app/config/*
```

## Key Conventions
- Components are **NOT standalone** - all use NgModule pattern
- Default component style is SCSS (`angular.json` schematics)
- Global styles in `src/styles.scss` (PrimeNG, Handsontable, Quill, animate.css imported)
- Environment files: `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod, swapped during build)
- Username normalized to lowercase on login (`auth.service.ts:135`)

## Testing
- **No spec files currently exist** in the repo
- Karma test runner configured via `angular.json`
- Spec files should follow `*.spec.ts` naming
- `tsconfig.spec.json` includes jasmine types

## UI Stack
- PrimeNG 17 + PrimeFlex + PrimeIcons
- Handsontable 16 for spreadsheet components
- Quill 2 for rich text
- CryptoJS for localStorage encryption

## Skills
Repo has pre-configured skills in `.agents/skills/`. The `angular-developer` skill is most relevant for Angular work.