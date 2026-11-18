# Feature Specification: Idioma y tema desde cualquier pantalla

**Feature Branch**: `014-header-language-theme`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Posibilidad de cambiar el idioma y el modo (oscuro, claro) desde
cualquier lado, no solo cuando estás logueado. ¿Algo en el header?" Hoy el idioma y el tema solo
se cambian en el Perfil, con sesión. Sin sesión, el idioma sale del navegador y el tema del
dispositivo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cambiar idioma y tema sin sesión en la Web (Priority: P1)

Como visitante sin cuenta, quiero cambiar el idioma (español o inglés) y el tema (claro, oscuro o
el del sistema) desde el encabezado, para leer el sitio como me resulta cómodo antes de
registrarme.

**Why this priority**: es el pedido; quien llega por primera vez no puede cambiar nada hasta
crear una cuenta.

**Independent Test**: sin sesión, cambiar idioma y tema desde el encabezado en el inicio, recargar
y navegar a otras páginas públicas; la elección se mantiene.

**Acceptance Scenarios**:

1. **Given** una página pública sin sesión, **When** se mira el encabezado, **Then** hay un control
   de idioma y uno de tema, en escritorio y en teléfono.
2. **Given** el control de idioma, **When** se elige inglés, **Then** la página cambia a inglés sin
   perder la página actual.
3. **Given** el control de tema, **When** se elige oscuro, claro o sistema, **Then** se aplica al
   instante, sin parpadeo al recargar.
4. **Given** una elección hecha, **When** se recarga o se vuelve otro día en el mismo navegador,
   **Then** se mantiene.

---

### User Story 2 - Cambiar idioma y tema con sesión desde el encabezado (Priority: P1)

Como persona con sesión, quiero los mismos controles en el encabezado de la App web, y que lo que
elija se guarde en mi perfil, para verlo igual en todos mis dispositivos.

**Why this priority**: "desde cualquier lado" incluye con sesión; hoy hay que ir al Perfil.

**Independent Test**: con sesión, cambiar el tema desde el encabezado, abrir el Perfil y ver la
misma preferencia; entrar desde otro navegador y ver el tema aplicado.

**Acceptance Scenarios**:

1. **Given** una página con sesión, **When** se cambia idioma o tema desde el encabezado, **Then**
   se aplica al instante y se guarda en el perfil.
2. **Given** el Perfil, **When** se abre después del cambio, **Then** muestra la misma preferencia.
3. **Given** que falla el guardado en el perfil (sin conexión), **When** se cambia la preferencia,
   **Then** se aplica en ese dispositivo y se avisa que no se pudo guardar en el perfil.

---

### User Story 3 - Lo que elijo antes de entrar se respeta (Priority: P2)

Como visitante que eligió idioma y tema, quiero que al registrarme quede guardado en mi perfil, y
que al iniciar sesión en una cuenta existente se use lo de mi perfil.

**Why this priority**: evita que la App "olvide" o pise la elección al entrar.

**Independent Test**: sin sesión elegir inglés y oscuro, registrarse y verificar el perfil; con
otra cuenta que tiene español y claro, iniciar sesión desde ese navegador y ver español y claro.

**Acceptance Scenarios**:

1. **Given** idioma y tema elegidos sin sesión, **When** la persona se registra, **Then** su perfil
   nuevo guarda esa elección.
2. **Given** una cuenta existente con preferencias, **When** inicia sesión, **Then** se aplican las
   del perfil y reemplazan las del dispositivo.
3. **Given** que cierra sesión, **When** vuelve a las páginas públicas, **Then** se mantienen las
   últimas preferencias usadas en ese dispositivo.

---

### User Story 4 - Cambiar idioma y tema en la App sin sesión (Priority: P2)

Como persona que abre la App por primera vez, quiero cambiar idioma y tema desde las pantallas de
inicio de sesión y registro.

**Why this priority**: paridad Web y Mobile (Principio I); con sesión, la App ya los ofrece en el
Perfil.

**Independent Test**: en la App sin sesión, cambiar idioma y tema desde la pantalla de login,
cerrar y abrir la App, y comprobar que se mantienen; registrarse y verlos en el Perfil.

**Acceptance Scenarios**:

1. **Given** las pantallas sin sesión de la App, **When** se miran, **Then** hay un acceso visible
   a idioma y tema.
2. **Given** una elección, **When** se cierra y abre la App, **Then** se mantiene.
3. **Given** una elección sin sesión, **When** la persona se registra, **Then** se guarda en su
   perfil (como en la User Story 3).

---

### Edge Cases

- **Buscadores**: no eligen idioma; MUST seguir recibiendo español (feature 011).
- **Navegador sin almacenamiento** (modo privado estricto): el cambio se aplica en la página
  actual y se pierde al cerrar, sin errores.
- **Varias pestañas abiertas**: un cambio en una se ve en las otras al recargar.
- **Encabezado en teléfono**: los controles MUST entrar sin tapar el logo ni los botones de
  ingreso, con tamaño táctil adecuado (por ejemplo, dentro del menú).
- **Idioma no soportado en el navegador**: sin elección previa, se usa español.

## Requirements *(mandatory)*

### Functional Requirements

**Controles**

- **FR-001**: El encabezado de la Web MUST mostrar un control de idioma (español, inglés) y uno de
  tema (claro, oscuro, sistema) en todas las páginas, con y sin sesión.
- **FR-002**: Las pantallas sin sesión de la App MUST ofrecer los mismos controles.
- **FR-003**: Los controles MUST ser accesibles por teclado y lector de pantalla, indicar la
  opción actual sin depender del color y usar la identidad de las features 006 y 007.
- **FR-004**: El cambio MUST aplicarse al instante y mantener la página o pantalla actual.

**Persistencia**

- **FR-005**: Sin sesión, la elección MUST guardarse en el dispositivo y usarse en las próximas
  visitas, antes que el idioma del navegador o el tema del sistema.
- **FR-006**: El tema MUST aplicarse antes de mostrar la página, sin parpadeo.
- **FR-007**: Con sesión, el cambio MUST guardarse además en el perfil (la misma preferencia que se
  edita en el Perfil); si falla, MUST aplicarse en el dispositivo y avisar.
- **FR-008**: Al registrarse, el perfil nuevo MUST tomar el idioma y el tema elegidos en el
  dispositivo.
- **FR-009**: Al iniciar sesión, MUST aplicarse las preferencias del perfil y actualizar las del
  dispositivo.

**General**

- **FR-010**: El Perfil MUST seguir permitiendo cambiar idioma y tema (Principio II).
- **FR-011**: La elección del dispositivo MUST NOT afectar lo que reciben los buscadores.
- **FR-012**: Todos los textos nuevos MUST estar en español y en inglés.

### Key Entities

- **Preferencia del dispositivo**: idioma y tema elegidos sin sesión; vive solo en ese navegador o
  esa App. No es un dato personal ni se envía a terceros.
- **Preferencias del perfil**: idioma y tema que ya guarda el perfil (feature 001); no cambian.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquier página o pantalla, la persona cambia idioma o tema en 2 toques o
  menos.
- **SC-002**: El 100 % de las elecciones hechas sin sesión se mantiene al recargar y al volver.
- **SC-003**: 0 parpadeos de tema al cargar una página con tema oscuro elegido.
- **SC-004**: El 100 % de los registros hechos después de elegir idioma y tema guarda esa elección
  en el perfil.
- **SC-005**: Las pruebas existentes de Perfil y preferencias siguen pasando.

## Assumptions

- Los idiomas siguen siendo español e inglés; el tema, claro, oscuro y sistema (constitución).
- La preferencia del dispositivo se guarda con mecanismos propios del navegador o de la App, sin
  servicios de terceros; no requiere aviso de cookies porque es estrictamente funcional.
- Las direcciones de las páginas no cambian por idioma (feature 011).
