# Contract: botón y sección "Apoyá ChePagame"

**Feature**: `008-donation-link`

Sin endpoints nuevos. Contratos internos de la Web y la App.

## Web

| Componente | Props | Garantías |
| --- | --- | --- |
| `parseDonationUrl` (`src/lib/donation.ts`) | `value?: string` | `https` válida o `null` (data-model) |
| `DonateLink` | `url: string` | `<a target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">` con ícono y "Apoyá ChePagame"; nombre accesible con "(se abre en una pestaña nueva)" |
| `DonateSection` | `url: string \| null` | Si `url` es `null` no renderiza nada; si no, título, frase y `DonateLink` |

Lugares: `SiteFooter` (link compacto), `(public)/about/page.tsx` y `(private)/profile/page.tsx`
(`DonateSection`), todos con `parseDonationUrl(process.env.DONATION_URL)`.

## App

| Componente | Props | Garantías |
| --- | --- | --- |
| `parseDonationUrl` (`src/utils/donation.ts`) | `value?: string` | Igual que en la Web |
| `DonateSection` | `url: string \| null` | Si `url` es `null` no renderiza nada; si no, título, frase y `AppButton` que llama `Linking.openURL(url)`; si falla, `StatusNotice kind="error"` |

Lugar: `ProfileScreen`, con `parseDonationUrl(process.env.EXPO_PUBLIC_DONATION_URL)`.

## Tests

| Test | Verifica |
| --- | --- |
| Web `lib/donation.test.ts`, App `utils/donation.test.ts` | La tabla del data-model |
| Web `components/DonateSection.test.tsx` | Atributos del link, nombre accesible, nada sin `url`, inglés |
| Web `components/LegalPage.test.tsx` (footer) | El footer muestra el link solo con `url` |
| App `components/donateSection.test.tsx` | Abre con `Linking.openURL`; error visible si falla; nada sin `url` |
