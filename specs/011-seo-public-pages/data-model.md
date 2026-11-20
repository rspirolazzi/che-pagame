# Data Model: SEO y páginas públicas

Sin cambios en la base de datos. Las entidades son contenido estático.

## Página pública (`PUBLIC_PAGES` en `web/src/lib/seo.ts`)

| Campo | Tipo | Regla |
|---|---|---|
| `key` | string | clave de mensajes `seo.<key>` |
| `path` | string | ruta absoluta (`/faq`) |
| `lastModified` | fecha ISO | se actualiza al cambiar el contenido |
| `index` | boolean | `true` para todas las de la lista |

Mensajes por página: `seo.<key>.title` (≤ 60 caracteres con el sufijo) y
`seo.<key>.description` (≤ 160). Un test valida los largos en es.

## Pregunta frecuente

| Campo | Tipo | Regla |
|---|---|---|
| grupo | id (`basics`, `accounts`, `expenses`, `balances`, `privacy`, `app`) | orden fijo |
| id | string | único en el grupo |
| `q` / `a` | texto es/en | `a` en texto plano (se usa en JSON-LD) |

Mínimo 12 preguntas que cubren los temas de la User Story 2.
