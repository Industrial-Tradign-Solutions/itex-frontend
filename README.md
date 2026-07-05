# ITEX Frontend

Aplicación administrativa empresarial para **Industrial Trading Solutions (ITEX)**, desarrollada en Angular 18.2.13. El proyecto implementa un sistema completo de gestión comercial incluyendo cotizaciones, productos, clientes, proveedores y administración de usuarios.

## Descripción del Proyecto

ITEX Frontend es una aplicación de gestión comercial diseñada para optimizar los procesos de trading industrial. La plataforma permite gestionar cotizaciones de productos, mantener un catálogo de productos industriales, administrar clientes y proveedores, y controlar el acceso mediante un sistema de roles y permisos.

La aplicación sigue el patrón **NgModule** (no standalone) para una arquitectura modular y escalable, con rutas cargadas de forma diferida (lazy-loading) para optimizar el rendimiento inicial.

## Características Principales

- Sistema de autenticación con JWT y encriptación de datos locales
- Gestión completa de cotizaciones y solicitudes de cotización
- Catálogo de productos industriales
- Administración de clientes y proveedores
- Sistema de maestros (marcas, ubicaciones, industrias, departamentos)
- Panel de administración de usuarios y roles
- Hojas de cálculo con Handsontable para edición de datos
- Editor de texto enriquecido con Quill
- Diseño responsivo con PrimeNG y PrimeFlex

## Tecnologías y Dependencias

### Framework Principal
- **Angular** 18.2.13 - Framework de desarrollo
- **TypeScript** 5.5.2 - Lenguaje de programación

### UI Framework
- **PrimeNG** 17.18.15 - Componentes de interfaz de usuario
- **PrimeFlex** 3.3.1 - Utilidades de CSS
- **PrimeIcons** 7.0.0 - Iconos

### Bibliotecas Especializadas
- **Handsontable** 16.1.1 - Hojas de cálculo
- **Quill** 2.0.3 - Editor de texto enriquecido
- **CryptoJS** 4.2.0 - Encriptación
- **animate.css** 4.1.1 - Animaciones CSS
- **@auth0/angular-jwt** 5.2.0 - Manejo de JWT

### Angular CDK
- **@angular/cdk** 18.2.14 - Kit de componentes

## Instalación

### Requisitos Previos
- Node.js 18+ 
- npm 9+

### Pasos de Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

El servidor de desarrollo estará disponible en `http://localhost:4200/`. La aplicación se recargará automáticamente cuando se modifiquen archivos fuente.

## Comandos de Desarrollo

| Comando | Descripción |
|---------|------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción en `dist/itex` |
| `npm run watch` | Compila en modo desarrollo con vigilancia de cambios |
| `npm test` | Ejecuta pruebas unitarias con Karma |

## Configuración de Entornos

### Desarrollo
Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  api_url: 'http://localhost:8080/itex/api/',
  webSocket_url: 'ws://localhost:8080/itex/api/websocket',
  encrypt_data_key: 'clave para encriptar los datos del local storage',
  web_url: 'http://localhost:4200/p/',
  timeout: 1000,
  max_open_tabs: 5
};
```

### Producción
En `src/environments/environment.prod.ts`, Angular substitute automáticamente las configuraciones durante el build.

## Estructura del Proyecto

```
src/
├── app/
│   ├── config/                 # Configuración global
│   │   ├── interceptors/       # Interceptores HTTP
│   │   │   └── auth.interceptor.ts
│   │   └── services/           # Servicios globales
│   ├── guards/                # Guardias de ruta
│   │   └── authenticated.guard.ts
│   ├── layout/                 # Layout principal
│   │   └── layout.module.ts    # Sidebar, topbar, breadcrumb
│   ├── models/                 # Interfaces y tipos
│   ├── pages/                  # Módulos de páginas
│   │   ├── login/             # Página de login
│   │   └── principal/          # Módulo principal
│   │       ├── dashboard/      # Panel principal
│   │       ├── ip/           # Industrial Products
│   │       │   ├── products/
│   │       │   ├── quote-request/
│   │       │   └── quotations/
│   │       ├── partners/
│   │       │   ├── clients/
│   │       │   └── suppliers/
│   │       ├── masters/
│   │       │   ├── brands/
│   │       │   ├── locations/
│   │       │   ├── industries/
│   │       │   └── departments/
│   │       └── administration/
│   │           ├── users/
│   │           └── roles/
│   ├── components/             # Componentes reutilizables
│   ├── modals/                 # Componentes modales
│   ├── pipes/                  # Pipes personalizados
│   └── services/               # Servicios de la aplicación
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── styles.scss                 # Estilos globales
└── main.ts                    # Punto de entrada
```

## Sistema de Rutas

### Arquitectura de Rutas

El proyecto utiliza carga diferida (lazy-loading) para optimizar el rendimiento:

```
/login          -> LoginModule (carga diferenciada)
/p              -> PrincipalModule (protegido por authenticatedGuard)
  /p/dashboard   -> Dashboard
  /p/ip          -> Industrial Products
    /p/ip/products
    /p/ip/quote-request
    /p/ip/quotations
  /p/partners    -> Socios comerciales
    /p/partners/clients
    /p/partners/suppliers
  /p/masters    -> Datos maestros
    /p/masters/brands
    /p/masters/locations
    /p/masters/industries
    /p/masters/departments
  /p/administration -> Administración
    /p/administration/users
    /p/administration/roles
```

### Guardia de Autenticación

El `authenticatedGuard` redirige automáticamente a `/login` cuando el usuario no está autenticado:

```typescript
// En app-routing.module.ts
{
  path: 'p',
  canActivate: [authenticatedGuard],
  loadChildren: () => import('./pages/principal/principal.module').then(m => m.PrincipalModule)
}
```

### Interceptor de Autenticación

El `AuthInterceptor` maneja automáticamente los errores de token y añade el token JWT a todas las peticiones HTTP.

## Convenciones de Código

### Alias de Rutas

El proyecto utiliza alias de rutas en TypeScript para imports más limpios:

```typescript
// tsconfig.json
{
  "paths": {
    "@services/*": ["./src/app/services/*"],
    "@components/*": ["./src/app/components/*"],
    "@modals/*": ["./src/app/modals/*"],
    "@guards/*": ["./src/app/guards/*"],
    "@interfaces/*": ["./src/app/models/*"],
    "@pages/*": ["./src/app/pages/*"],
    "@layout/*": ["./src/app/layout/*"],
    "@pipes/*": ["./src/app/pipes/*"],
    "@config/*": ["./src/app/config/*"]
  }
}
```

Uso en componentes:

```typescript
import { AuthService } from '@services/auth.service';
import { ModalComponent } from '@modals/modal.component';
```

### Módulos No Standalone

Todos los componentes siguen el patrón NgModule (no standalone) para mantener compatibilidad con la arquitectura corporativa:

```typescript
@NgModule({
  declarations: [MyComponent],
  imports: [CommonModule, FormsModule],
  exports: [MyComponent]
})
export class MyComponentModule {}
```

### Estilos de Componentes

Por defecto, los componentes utilizan SCSS según la configuración en `angular.json`:

```json
{
  "schematics": {
    "@schematics/angular:component": {
      "style": "scss",
      "standalone": false
    }
  }
}
```

### Normalización de Usuarios

El nombre de usuario se normaliza a minúsculas durante el login para mantener consistencia:

```typescript
// auth.service.ts
this.username = this.username?.toLowerCase();
```

## SEO y Metadatos

### Meta Tags

La aplicación incluye meta tags optimizados para búsqueda:

```html
<meta name="description" content="ITEX - Sistema de gestión comercial para Industrial Trading Solutions">
<meta name="robots" content="index, follow">
```

### URLs Amigables

Las rutas utilizan URLs descriptivas y significativas:

```
/p/ip/products              -> Catálogo de productos
/p/partners/clients        -> Gestión de clientes
/p/administration/users   -> Administración de usuarios
```

### Renderizado

La aplicación utiliza renderizado del lado del cliente (CSR). Para SEO avanzado, considerar Angular SSR con hydration.

## Accesibilidad (WCAG 2.2)

### Principios Implementados

| Principio | Descripción | Estado |
|----------|------------|--------|
| Perceptible | Contenido visible para todos | ✓ |
| Operable | Interfaz usable por teclado | ✓ |
| Comprensible | Contenido y UI entendibles | ✓ |
| Robusto | Compatible con tecnologías asistivas | ✓ |

### Características de Accesibilidad

- **Texto alternativo**: Imágenes con atributos `alt` descriptivos
- **Navegación por teclado**: Todos los elementos interactivos accesibles con Tab, Enter, Space
- **Contraste de color**: Cumple relación mínima 4.5:1 (AA)
- **Etiquetas de formularios**: Labels asociados programáticamente
- **Regiones ARIA**: Uso correcto de landmark roles
- **Estados de foco**: Indicadores visibles en `:focus-visible`

### Preferencias de Movimiento

La aplicación respeta las preferencias de movimiento reducido del sistema operativo:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Tamaño de Objetivos

Los elementos interactivos cumplen el tamaño mínimo de 24×24 píxeles (recomendado 44×44).

## Diseño de Interfaz

### Enfoque Visual

La interfaz sigue un diseño profesional y corporativo adaptado a aplicaciones empresariales:

- **Tipografía**: Sistema de fuentes escalable
- **Paleta de colores**: Colores corporativos de ITEX
- **Layout**: Estructura con sidebar, topbar y breadcrumb
- **Componentes PrimeNG**: Estándar visual consistente
- **Iconos**: PrimeIcons para consistencia

### Diseño Responsivo

La aplicación utiliza breakpoints de PrimeFlex para diferentes tamaños de pantalla:

```scss
// Ejemplo de clases responsivas
.hidden-mobile { @include lg { display: none; } }
.show-mobile { @include lg { display: block; } }
```

## Pruebas

### Configuración

El proyecto está configurado para pruebas unitarias con Karma y Jasmine:

```bash
# Ejecutar pruebas
npm test
```

### Archivos de Spec

Los archivos de pruebas siguen el patrón `*.spec.ts`. Actualmente no existen spec files en el repositorio.

## Build y Producción

### Configuración de Budgets

```json
{
  "budgets": [
    { "type": "initial", "maximumWarning": "3mb", "maximumError": "6mb" },
    { "type": "anyComponentStyle", "maximumWarning": "2mb", "maximumError": "4mb" }
  ]
}
```

### Build de Producción

```bash
npm run build
```

Los artefactos se almacenan en `dist/itex`. El directorio incluye:
- `index.html`
- Archivos JavaScript optimizados
- Hojas de estilo.css
- Recursos estáticos

## Autores

- **Julian Bayer**
- **Camilo Gutierrez**

## Versión

1.0.1

## Licencia

Privado - Todos los derechos reservados