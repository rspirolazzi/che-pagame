# Feature Specification: Apoyá ChePagame (donaciones)

**Feature Branch**: `008-donation-link`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Feature 08: Apoyá ChePagame (donaciones)": un botón "Apoyá
ChePagame" que lleva a la página de donaciones del proyecto en Cafecito. ChePagame no procesa
pagos ni guarda datos de pago: es solo un link que se abre en el navegador, sin widgets ni
scripts de terceros. El link es configurable sin tocar el código; sin link, el botón no aparece.
En la Web: footer, "Quiénes somos" y Perfil. En la App: Perfil. Los builds para las tiendas se
generan sin el link; una propina con compras dentro de la App queda fuera de alcance. Textos en
es/en, con la identidad de las features 006 y 007.

**Ajustes respecto del input** (para cumplir la constitución v4.6.0 y las features 001 a 007):

- La plataforma (Cafecito) la eligió el usuario el 2026-11-13. La spec no depende de ella: el
  link es configurable, así que cambiar de plataforma o sumar otra no requiere cambiar la App ni
  la Web.
- Las políticas de pago de Google Play y del App Store pueden rechazar un link externo de
  donación al desarrollador (precedentes públicos en ambas tiendas). Por eso la App muestra el
  botón solo en los builds que tengan el link configurado, y los que se publiquen en las tiendas
  se generan sin él.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apoyar el proyecto desde la Web (Priority: P1)

Una persona a la que le sirve ChePagame quiere aportar algo. En la Web encuentra "Apoyá
ChePagame" en el footer, en "Quiénes somos" o en su Perfil, lo toca y llega a la página de
donaciones en una pestaña nueva, sin dejar la que estaba usando.

**Why this priority**: es el camino principal: la Web no tiene las restricciones de las tiendas y
la ven tanto quienes tienen sesión como quienes no.

**Independent Test**: con el link configurado, abrir la Web sin sesión y con sesión, tocar el
botón en cada lugar y comprobar que abre la página de donaciones en una pestaña nueva; sin el
link, comprobar que el botón no aparece en ningún lado.

**Acceptance Scenarios**:

1. **Given** el link de donaciones configurado, **When** una persona sin sesión mira el footer o
   "Quiénes somos", **Then** ve "Apoyá ChePagame" con un ícono, y al tocarlo se abre la página de
   donaciones en una pestaña nueva.
2. **Given** el link configurado y una persona con sesión, **When** mira su Perfil, **Then** ve una
   sección que explica en una frase que ChePagame es gratuito y cómo apoyarlo, con el botón.
3. **Given** el link sin configurar, **When** cualquier persona recorre la Web, **Then** no aparece
   el botón ni la sección en ningún lugar, y nada queda vacío o roto.
4. **Given** la Web en inglés, **When** se muestra el botón, **Then** dice "Support ChePagame".

---

### User Story 2 - Apoyar el proyecto desde la App (Priority: P2)

Una persona que usa la App encuentra "Apoyá ChePagame" en su Perfil y, al tocarlo, se abre la
página de donaciones en el navegador del teléfono.

**Why this priority**: suma el mismo camino en la App, pero solo en los builds que lo tengan
configurado, por las reglas de las tiendas.

**Independent Test**: con el link configurado en el build, abrir el Perfil, tocar el botón y
comprobar que abre el navegador en la página de donaciones; con un build sin link, comprobar que
el botón no aparece.

**Acceptance Scenarios**:

1. **Given** un build de la App con el link configurado, **When** la persona abre su Perfil,
   **Then** ve la sección "Apoyá ChePagame" con el botón, y al tocarlo se abre el navegador del
   teléfono en la página de donaciones.
2. **Given** un build sin el link (por ejemplo, el que se publica en las tiendas), **When** la
   persona abre su Perfil, **Then** no aparece la sección ni el botón.
3. **Given** un teléfono que no puede abrir el link, **When** la persona toca el botón, **Then** ve
   un mensaje claro de que no se pudo abrir, sin que la App se cierre.

---

### Edge Cases

- **Link mal configurado**: si el valor configurado no es una dirección `https` válida, se trata
  como si no estuviera: el botón no aparece (nunca se ofrece un link roto o inseguro).
- **Sin sesión en la App**: el Perfil solo existe con sesión, así que sin sesión no hay botón en la
  App (la Web lo ofrece en el footer y en "Quiénes somos").
- **Bloqueador de ventanas emergentes**: el botón es un link común, así que el navegador lo abre
  aunque bloquee ventanas emergentes.
- **Tema oscuro y texto al 200%**: el botón se ve y se lee bien en ambos modos y con el texto
  agrandado, como el resto de la identidad.

## Requirements *(mandatory)*

### Functional Requirements

**Link y privacidad**

- **FR-001**: El link de donaciones MUST ser configurable sin cambiar el código, por separado para
  la Web y para la App.
- **FR-002**: Si el link no está configurado o no es una dirección `https` válida, el botón y su
  sección MUST NOT mostrarse en ningún lugar.
- **FR-003**: El botón MUST ser un link común que abre la página de donaciones fuera de ChePagame
  (pestaña nueva en la Web, navegador del sistema en la App), sin enviar a la plataforma datos de
  la persona ni de su sesión (sin parámetros, sin referer en la Web).
- **FR-004**: ChePagame MUST NOT cargar widgets, scripts, imágenes ni fuentes de la plataforma de
  donaciones (Principio VI); el botón usa solo la identidad propia.
- **FR-005**: ChePagame MUST NOT procesar pagos ni guardar ningún dato de donaciones.

**Dónde aparece**

- **FR-006**: En la Web, con el link configurado, el botón MUST aparecer en el footer (en todas
  las páginas, con y sin sesión), en "Quiénes somos" y en el Perfil (en una sección propia con una
  frase que explique que ChePagame es gratuito y cómo apoyarlo).
- **FR-007**: En la App, con el link configurado en el build, el botón MUST aparecer en una sección
  propia del Perfil, con la misma frase.
- **FR-008**: Los builds de la App que se publiquen en Google Play o en el App Store MUST
  generarse sin el link, y el procedimiento MUST quedar documentado para quien publique.

**Diseño, accesibilidad e idiomas**

- **FR-009**: El botón MUST usar la identidad de las features 006 y 007 (sin colores escritos a
  mano), con un ícono y el texto "Apoyá ChePagame" / "Support ChePagame"; su nombre accesible MUST
  indicar que abre una página externa.
- **FR-010**: Todos los textos nuevos MUST existir en español y en inglés.
- **FR-011**: Si la App no puede abrir el link, MUST mostrar un mensaje de error con ícono y texto
  (como el resto de los estados) y seguir funcionando.

### Key Entities *(include if feature involves data)*

- **Link de donaciones**: una dirección `https` configurada por quien despliega ChePagame, una para
  la Web y otra para cada build de la App. No es un secreto ni un dato de usuario. No hay datos
  nuevos de usuario ni cambios en el backend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con el link configurado, una persona llega a la página de donaciones desde cualquiera
  de los lugares de FR-006 y FR-007 en un solo toque.
- **SC-002**: Sin el link (o con uno inválido), el botón aparece en 0 lugares de la Web y de la App.
- **SC-003**: Cero pedidos a la plataforma de donaciones al cargar cualquier página o pantalla de
  ChePagame: solo se contacta cuando la persona toca el botón.
- **SC-004**: El botón cumple el contraste y el tamaño táctil de la identidad en ambos modos,
  verificado por las comprobaciones automáticas existentes.
- **SC-005**: Las pruebas existentes de la Web y de la App siguen pasando sin cambios.

## Assumptions

- El usuario crea la cuenta en Cafecito y configura el link en su `.env`; nadie más (tampoco el
  asistente) crea la cuenta ni carga datos de cobro.
- El link no es un secreto, pero vive en la configuración como el resto (`.env`, con la variable
  vacía en `.env.example`).
- La App todavía no está publicada en las tiendas; mientras tanto, los builds de prueba pueden
  tener el link.
- Una "propina" con compras dentro de la App (Google Play Billing y StoreKit) queda fuera de
  alcance para una feature futura, si se quiere recibir apoyo desde la App publicada.
- Las comisiones de la plataforma son responsabilidad de quien recibe las donaciones y no se
  muestran en ChePagame.
