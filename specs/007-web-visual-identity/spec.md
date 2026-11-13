# Feature Specification: Identidad visual y diseño de la Web

**Feature Branch**: `007-web-visual-identity`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Feature 07: Identidad visual y diseño de la Web": la Web de
ChePagame adopta la identidad "Celeste y sol" de la feature 006 desde la misma fuente común, con
la tipografía de la marca (Sora) incluida en el sitio para títulos, importes y logo, temas claro,
oscuro y según el dispositivo, el logotipo aprobado en el header y el ícono "Che". Rediseño
completo de todas las páginas públicas y privadas sin cambiar su comportamiento, mismo lenguaje
visual que la App (saldos y estados que no dependen solo del color), responsive, accesible
(contraste AA verificado, foco visible, teclado, texto al 200%), sin colores escritos a mano, y
maquetas de las páginas clave aprobadas antes de implementar. Textos en es/en.

**Ajustes respecto del input** (para cumplir la constitución v4.5.0 y las features 001 a 006):

- La fuente común, la paleta, el borde de controles, la tipografía, el logotipo "A. Tilde final" y
  los criterios de contraste ya están definidos y aprobados en la feature 006: esta feature los
  reutiliza tal cual, no los reabre. La salida para la Web ya existe y hoy no se usa.
- La preferencia de tema del Perfil ya se aplica en la Web (feature 001). Esta feature hace que
  claro, oscuro y según el dispositivo se vean con la identidad nueva.
- Sin sesión, la Web sigue la constitución ("Estructura de Navegación y UI Base"): el header con
  Inicio, Cómo funciona, Quiénes somos, Contacto y Login / Registro, y el footer con los links
  legales. Con sesión, la navegación pasa a una barra lateral con Inicio, Cuentas y Perfil (ver
  Clarifications), lo que cambia el "Header (logueado)" de la constitución: requiere una enmienda
  menor antes del plan. Los destinos no cambian.
- La App y la Web comparten lenguaje visual, no la misma disposición: la Web aprovecha el ancho
  de la pantalla en escritorio y se comporta como la App en un celular.

## Clarifications

### Session 2026-11-13

- Q: En escritorio, ¿cómo se navega por el área privada? → A: Con sesión, una barra lateral fija
  con Inicio, Cuentas y Perfil (y Salir); el header público queda para las páginas sin sesión. En
  celular, la barra lateral pasa a un menú compacto.
- Q: ¿Las páginas informativas solo se rediseñan o también se les escribe el contenido? → A:
  Rediseño y contenido: Cómo funciona en 3 o 4 pasos ilustrados, Quiénes somos con un párrafo y
  Contacto con un email de contacto visible, sin formulario.
- Q: En escritorio, ¿la Cuenta muestra pestañas Gastos y Saldos o las dos vistas lado a lado? →
  A: Pestañas como hoy (mismas direcciones); en escritorio, cada pestaña usa dos columnas
  internas: en Gastos, la lista y al costado el total y los pendientes; en Saldos, los saldos y al
  costado las sugerencias.
- Q: ¿Qué tan completa es la página de Inicio para quien no tiene cuenta? → A: Portada con
  secciones: logotipo, slogan y "Empezar"; 3 beneficios cortos (dividir sin vueltas, saldos
  claros, tus datos son tuyos); un vistazo de la pantalla de saldos; y un link a "Cómo funciona".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La Web se ve como ChePagame (Priority: P1)

Una persona entra a la Web desde la computadora o el celular y la reconoce como ChePagame: el mismo
celeste, el amarillo sol, la tipografía de la marca y el logotipo que en la App, en todas las
páginas, en modo claro y oscuro.

**Why this priority**: es el corazón de la feature: sin la identidad aplicada a las páginas no hay
cambio visible.

**Independent Test**: recorrer todas las páginas en escritorio y en celular, en claro y en oscuro,
y comprobar que usan solo los colores, la tipografía, los espaciados y los radios de la identidad
y que todo funciona igual que antes.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión, **When** recorre Inicio, Cómo funciona, Quiénes somos,
   Contacto, Privacidad, Términos, login, registro y los ingresos con código, **Then** todas las
   páginas usan la identidad, con el logotipo en el header y el footer rediseñado.
2. **Given** una persona con sesión, **When** recorre el Dashboard, Mis Cuentas, crear y editar
   Cuenta, invitación y unirse, la Cuenta con Gastos y Saldos, el detalle, el formulario y el
   historial de un gasto, los reembolsos y el Perfil, **Then** todas usan la identidad.
3. **Given** el tema Claro, Oscuro o Según el dispositivo en el Perfil, **When** la persona navega,
   **Then** la Web usa la paleta correspondiente; con Según el dispositivo, sigue el modo del
   sistema y cambia si el sistema cambia.
4. **Given** cualquier página rediseñada, **When** la persona hace lo que hacía antes (cargar un
   gasto, registrar un reembolso, exportar, invitar, cambiar sus datos), **Then** el resultado es
   idéntico al de antes de esta feature, aunque la página esté reorganizada.
5. **Given** la página de Inicio, **When** una persona sin sesión entra, **Then** ve el logotipo, el
   slogan "Para que la guita no sea un problema", la acción para empezar, tres beneficios, un
   vistazo de la pantalla de saldos y el link a "Cómo funciona".

---

### User Story 2 - Entender los saldos de un vistazo (Priority: P1)

En el Dashboard y en la pestaña Saldos, una persona distingue enseguida cuánto le deben, cuánto
debe, quién está al día y qué gastos están pendientes de asignación, aunque no distinga colores.

**Why this priority**: los saldos son la información más importante; la Web tiene que leerse igual
de bien que la App.

**Independent Test**: mostrar el Dashboard y Saldos con todos los estados, en claro, oscuro y escala
de grises, y comprobar que cada uno se entiende sin depender del color.

**Acceptance Scenarios**:

1. **Given** saldos a favor, en contra y en cero, **When** la persona los mira, **Then** cada uno
   tiene su color y además el signo ("+", "−" o un tilde) y las palabras de siempre ("Te deben",
   "Debés", "Al día").
2. **Given** gastos pendientes de asignación, **When** la persona mira Gastos o Saldos, **Then** el
   aviso tiene color de aviso, un ícono y el texto "Pendiente de asignación".
3. **Given** un error o una Cuenta Cerrada, **When** aparece, **Then** se muestra con ícono y texto
   que explican qué pasa, no solo con color.

---

### User Story 3 - Usar la Web en el celular y con teclado (Priority: P2)

Una persona usa la Web desde el celular, con el texto agrandado o solo con el teclado, y puede
hacer todo lo que hace en la computadora.

**Why this priority**: la Web es la entrada para quien no instala la App; tiene que funcionar
cómoda en cualquier pantalla y para todos.

**Independent Test**: recorrer las páginas en un ancho de celular (360 px), de tablet y de
escritorio; con el texto del navegador al 200%; y solo con el teclado.

**Acceptance Scenarios**:

1. **Given** un ancho de celular, **When** la persona navega, **Then** ninguna página se desplaza
   hacia los costados, el header se compacta en un menú y los elementos tocables miden al menos
   44 × 44 px.
2. **Given** el texto del navegador al 200%, **When** la persona recorre las páginas, **Then** nada
   se corta ni se superpone.
3. **Given** solo el teclado, **When** la persona recorre una página, **Then** llega a todos los
   links, botones, menús y campos en orden lógico, siempre ve dónde está el foco y puede cerrar
   menús y diálogos con Escape.

---

### User Story 4 - Una sola fuente de identidad, también en la Web (Priority: P2)

Quien mantiene ChePagame cambia un color, una tipografía o un espaciado en la fuente común y el
cambio llega a la Web igual que a la App. La verificación automática de la Web rechaza colores
escritos a mano y contrastes insuficientes.

**Why this priority**: evita que App y Web se separen con el tiempo (constitución, "Identidad
visual").

**Independent Test**: cambiar el color principal en la fuente común, regenerar y ver el cambio en
la Web; escribir un color a mano en una página o en los estilos y comprobar que la verificación
falla.

**Acceptance Scenarios**:

1. **Given** la fuente común, **When** se cambia el color principal y se regenera, **Then** la Web
   lo toma en todas las páginas sin tocar ninguna.
2. **Given** un color escrito a mano en una página, un componente o los estilos de la Web, **When**
   se corre la verificación, **Then** falla e indica el archivo y la línea.
3. **Given** un par de contraste por debajo del mínimo, **When** se corre la verificación, **Then**
   falla (la misma regla que en la App).

---

### Edge Cases

- **Nombres e importes largos**: un nombre de Cuenta de 80 caracteres o un importe de 13 dígitos
  enteros no rompe tarjetas, tablas ni el header, en ningún ancho.
- **Cambio de tema del sistema con un formulario a medio cargar**: lo cargado se conserva.
- **Primer pintado**: la página no parpadea en el tema equivocado al cargar.
- **Tipografía no disponible**: si la tipografía de la marca no carga, se usa la del sistema y el
  texto se ve igual de legible, nunca invisible.
- **Sin JavaScript o mientras carga**: el contenido de las páginas públicas se lee con la
  identidad aplicada.
- **Cuenta Cerrada y estados vacíos**: el aviso de solo lectura es claro y no parece un error; los
  estados vacíos no parecen errores.
- **Zoom del navegador al 400%**: el contenido se reacomoda en una columna sin desplazamiento
  horizontal.

## Requirements *(mandatory)*

### Functional Requirements

**Fuente común e identidad**

- **FR-001**: La Web MUST tomar colores, tipografía, espaciados, radios y tamaño táctil solo de la
  salida generada de la fuente común de la feature 006; los colores escritos a mano de los estilos
  actuales MUST reemplazarse.
- **FR-002**: Una verificación automática de la Web MUST fallar si hay un color escrito a mano en
  páginas, componentes o estilos fuera de la salida generada, indicando archivo y línea, y si un
  par de contraste no llega al mínimo.
- **FR-003**: Los títulos, los importes y el logotipo MUST usar la tipografía de la marca, incluida
  en el sitio y servida por él mismo; el texto corrido MUST usar la fuente del sistema. Los
  importes MUST usar cifras de ancho fijo.
- **FR-004**: El acento MUST usarse solo como fondo de un destacado con el texto sobre acento
  encima, nunca como color de texto (igual que en la App).

**Temas**

- **FR-005**: La Web MUST mostrar la paleta clara, la oscura o la del sistema según la preferencia
  de tema del Perfil (o del sistema, sin sesión), sin parpadear en el tema equivocado al cargar.

**Navegación**

- **FR-005a**: Con sesión, las páginas privadas MUST mostrar una barra lateral fija con el
  logotipo y los destinos Inicio (Dashboard), Cuentas (Mis Cuentas) y Perfil, más Salir, con ícono
  y texto, marcando el destino activo sin depender solo del color. Las páginas informativas
  (Cómo funciona, Quiénes somos, Contacto, Privacidad, Términos) MUST seguir alcanzables con
  sesión, desde la barra lateral o el footer.
- **FR-005b**: En anchos de celular la barra lateral MUST compactarse en un menú que se abre con un
  botón y se cierra con Escape o al elegir un destino. Sin sesión, el header público MUST
  compactarse de la misma forma.

**Logo y marca**

- **FR-006**: El header público y la barra lateral MUST mostrar el logotipo aprobado (versión clara u oscura según el tema) con
  nombre accesible "ChePagame" y link a Inicio.
- **FR-007**: El sitio MUST tener favicon e ícono para agregar a la pantalla de inicio con "Che" y
  el tilde, generados desde la misma fuente que los de la App.
- **FR-008**: La página de Inicio MUST mostrar, en este orden: el logotipo, el slogan en el idioma
  de la persona y la acción para empezar (registro) o ir al Dashboard si ya tiene sesión; tres
  beneficios cortos (dividir sin vueltas, saldos claros, tus datos son tuyos), cada uno con ícono,
  título y una frase; un vistazo ilustrativo de la pantalla de saldos con datos de ejemplo
  marcados como tales; y un link a "Cómo funciona". MUST NOT prometer funciones que la App no
  tiene.

**Contenido de las páginas informativas**

- **FR-008a**: "Cómo funciona" MUST explicar el uso en 3 o 4 pasos ilustrados con la identidad
  (crear una Cuenta e invitar, cargar los gastos, ver los saldos, registrar los reembolsos), sin
  prometer funciones que la App no tiene.
- **FR-008b**: "Quiénes somos" MUST tener un párrafo que presente ChePagame y su propósito.
- **FR-008c**: "Contacto" MUST mostrar un email de contacto como texto seleccionable, con un botón
  para copiarlo y un link que abre el cliente de correo; MUST NOT haber formulario. La dirección
  MUST ser configurable sin cambiar el código; si no está configurada, la página MUST decirlo con
  un texto neutro en lugar de mostrar una dirección vacía.
- **FR-008d**: Todo el contenido nuevo MUST existir en español y en inglés.

**Saldos y estados**

- **FR-009**: Los saldos MUST mostrarse con color, signo o tilde con nombre accesible y las
  palabras existentes ("Te deben", "Debés", "Le deben", "Debe", "Al día", "Estás al día"); los
  totales del Dashboard, por moneda, sin sumar monedas distintas.
- **FR-010**: Los avisos de pendientes de asignación, los errores, la Cuenta Cerrada y los estados
  informativos MUST mostrarse con ícono, texto y color; los errores MUST anunciarse a los lectores
  de pantalla.

**Páginas rediseñadas**

- **FR-011**: MUST rediseñarse por completo (se puede reorganizar la disposición) el header, el
  footer y todas las páginas públicas (Inicio, Cómo funciona, Quiénes somos, Contacto,
  Privacidad, Términos, login, registro, verificación de email, ingreso con código y recuperación
  de contraseña, elección de moneda) y privadas (Dashboard, Mis Cuentas, crear Cuenta,
  configuración de la Cuenta, invitación y unirse, la Cuenta con Gastos y Saldos, detalle,
  formulario e historial de gasto, formulario y lista de reembolsos, Perfil con exportación).
- **FR-012**: El rediseño MUST NOT cambiar el comportamiento: mismos datos, acciones,
  validaciones, rutas y reglas de las features 001 a 006; no se quitan funciones ni se agregan
  datos. Los textos existentes se conservan; solo se suman los que pida el diseño, en es y en.
- **FR-013**: Antes de implementar el rediseño MUST existir maquetas, en escritorio y en celular y
  en claro y oscuro, de las páginas clave (Inicio, login, Dashboard, la Cuenta con Gastos y
  Saldos, formulario de gasto y Perfil), aprobadas por el usuario. Las demás páginas MUST seguir
  ese lenguaje visual.

**La Cuenta en escritorio**

- **FR-013a**: La Cuenta MUST mantener las pestañas Gastos y Saldos y sus direcciones actuales. En
  anchos de escritorio, Gastos MUST mostrar la lista de gastos y, en una columna al costado, el
  total, la cantidad de gastos y el aviso de pendientes; Saldos MUST mostrar los saldos y, al
  costado, las sugerencias y los reembolsos. En anchos menores, todo pasa a una sola columna.

**Responsive y accesibilidad**

- **FR-014**: Todas las páginas MUST funcionar sin desplazamiento horizontal desde 320 px de ancho
  hasta escritorio; en anchos de celular el header y la barra lateral MUST compactarse en un menú
  (FR-005b).
- **FR-015**: Todo par de texto y fondo MUST cumplir 4,5:1 y los controles, el foco y los íconos
  informativos 3:1, en ambos modos (mismos pares que la App).
- **FR-016**: Todo elemento interactivo MUST tener foco visible con el color principal y ser
  alcanzable y usable con teclado en orden lógico; menús y diálogos MUST cerrarse con Escape.
- **FR-017**: En anchos de celular, los elementos tocables MUST medir al menos 44 × 44 px (la
  identidad usa 48, el tamaño táctil de los tokens).
- **FR-018**: Con el texto del navegador al 200% nada MUST cortarse ni superponerse.
- **FR-019**: Las animaciones MUST respetar la preferencia de movimiento reducido del sistema.

**Idiomas**

- **FR-020**: Todo texto nuevo (nombres accesibles del logo, menú compacto, estados) MUST existir en
  español y en inglés.

### Key Entities *(include if feature involves data)*

- **Token de diseño y par de contraste**: los mismos de la feature 006, sin cambios; la Web consume
  su salida generada.
- **Logotipo e ícono**: los aprobados en la feature 006; se suman las salidas que necesita la Web
  (favicon e íconos para la pantalla de inicio).

No hay datos nuevos de usuario ni cambios en el backend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los pares de contraste cumple el mínimo en ambos modos, y la verificación
  automática de la Web lo comprueba en cada cambio.
- **SC-002**: Cero colores escritos a mano en páginas, componentes y estilos de la Web fuera de la
  salida generada.
- **SC-003**: El 100% de las páginas de FR-011 usa la identidad en claro y oscuro, en celular y en
  escritorio, comprobado en la validación manual.
- **SC-004**: Todas las pruebas de comportamiento existentes de la Web siguen pasando sin cambiar
  lo que verifican; solo pueden cambiar cómo encuentran un elemento en una página reorganizada.
  Única excepción: las verificaciones del menú de usuario del header con sesión pasan a las de la
  barra lateral (mismos destinos), porque ese menú se reemplaza por diseño (Clarifications).
- **SC-005**: Ninguna página se desplaza hacia los costados entre 320 px y 1440 px de ancho.
- **SC-006**: Con el texto al 200% y solo con el teclado, una persona completa cargar un gasto y
  registrar un reembolso sin ayuda.
- **SC-007**: En escala de grises, una persona identifica correctamente saldos a favor, en contra,
  al día y gastos pendientes.
- **SC-008**: Cambiar un color en la fuente común lo cambia en la App y en la Web modificando un
  solo lugar.

## Assumptions

- La paleta, el borde de controles, la tipografía Sora (pesos 600 y 700, licencia SIL OFL), el
  logotipo "A. Tilde final" y el ícono "Che" son los aprobados en la feature 006 el 2026-11-12;
  esta feature no los reabre.
- La tipografía se sirve desde el propio sitio: no se descarga de servicios de terceros
  (Principio VI).
- El texto corrido usa la fuente del sistema, igual que en la App.
- El menú compacto en celular (del header público y de la barra lateral) es un único botón que
  abre el menú con los mismos destinos; el detalle se decide en las maquetas.
- La constitución se enmienda (versión menor) para describir la barra lateral de la Web con sesión
  en lugar del "Header (logueado)" actual.
- Esta feature arranca sobre la rama de la feature 006 porque usa su fuente común, su tipografía
  y su logo; la 006 todavía espera su validación manual.
- Las maquetas se publican como página privada para que el usuario las apruebe, igual que en la
  006, y quedan guardadas en la carpeta de la feature.
- La verificación del contraste de la Web reutiliza los pares declarados en la fuente común.
- El email de contacto lo define el usuario (no es un secreto, pero no se inventa ni se usa el de
  su cuenta personal sin que lo indique); se pide antes de implementar la página de Contacto.
