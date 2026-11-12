# Feature Specification: Identidad visual y diseño de la App Mobile

**Feature Branch**: `006-mobile-visual-identity`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Feature 06: Identidad visual y diseño de la App Mobile": ChePagame
adopta la paleta "Celeste y sol" (celeste principal, amarillo sol de acento y colores fijos para
"te deben", "debés" y "pendiente de asignación", en claro y oscuro). Colores, tipografía,
espaciados y radios se definen una sola vez como tokens compartidos por la App y la Web; ningún
color escrito a mano en las pantallas; todo texto cumple contraste WCAG AA y se verifica
automáticamente. Se aplica a la App Mobile: temas claro, oscuro y según el dispositivo; logo e
ícono con el nombre ChePagame y el slogan; rediseño visual de las pantallas existentes sin cambiar
su comportamiento; los saldos se distinguen también sin depender del color. La Web adopta los
tokens en la feature 007. Textos en es/en.

**Ajustes respecto del input** (para cumplir la constitución v4.4.1 y las features 001 a 005):

- El Perfil ya permite elegir el tema Claro, Oscuro o Según el dispositivo (feature 001). Esta
  feature no agrega preferencias: hace que esa elección se vea con la identidad nueva.
- Además del contraste de los textos (4,5:1), los bordes de los campos, los indicadores de foco y
  los íconos que transmiten información necesitan 3:1 contra su fondo (WCAG AA para componentes).
  El borde decorativo de la paleta elegida no llega a 3:1, así que se suma un color de borde para
  controles; el resto de la paleta queda como la eligió el usuario.
- La paleta elegida es la fuente de verdad de los colores. Los valores exactos están en la sección
  "Paleta Celeste y sol".

## Clarifications

### Session 2026-11-12

- Q: ¿El rediseño de las pantallas se limita a aplicar la identidad sobre la disposición actual, o
  también puede reorganizar cómo están armadas? → A: Rediseño completo: se pueden reorganizar
  pantallas y componentes (por ejemplo, un Dashboard nuevo), manteniendo el mismo comportamiento.
- Q: Con un rediseño completo, ¿se aprueban los diseños antes de implementarlos? → A: Sí: el
  usuario aprueba antes las maquetas de las pantallas clave (login, Dashboard, la Cuenta con Gastos
  y Saldos, formulario de gasto y Perfil, en claro y oscuro) y el logo; el resto de las pantallas
  sigue ese lenguaje y se revisa en la validación manual final.
- Q: ¿La App usa tipografías propias de la marca o las del sistema? → A: Una tipografía propia
  para títulos, importes y logo; el texto corrido usa la del sistema. El usuario todavía no tiene
  una definida: se le presentan 2 o 3 candidatas aplicadas en las maquetas y elige una junto con el
  logo.
- Q: ¿El rediseño puede cambiar la navegación general de la App? → A: Sí: se suma una barra
  inferior con Inicio, Cuentas y Perfil; las pantallas y sus rutas siguen siendo las mismas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La App se ve como ChePagame (Priority: P1)

Una persona abre la App y la reconoce como ChePagame: el celeste y el amarillo sol aparecen en
botones, pestañas, destacados y encabezados de todas las pantallas, con la tipografía de la marca,
en modo claro y en modo oscuro.

**Why this priority**: es el corazón de la feature: sin la identidad aplicada a las pantallas no
hay cambio visible. Las demás historias la complementan.

**Independent Test**: recorrer todas las pantallas de la App en modo claro y en modo oscuro y
comprobar que usan solo los colores, la tipografía, los espaciados y los radios de la identidad,
y que todo funciona igual que antes.

**Acceptance Scenarios**:

1. **Given** una persona con el tema Claro en el Perfil, **When** recorre login, Dashboard, Mis
   Cuentas, una Cuenta (Gastos y Saldos), los formularios de gasto y reembolso, el historial y el
   Perfil, **Then** todas las pantallas usan la paleta clara de "Celeste y sol" y la tipografía de
   la marca.
2. **Given** una persona con el tema Oscuro, **When** recorre las mismas pantallas, **Then** todas
   usan la paleta oscura y ningún texto, ícono o campo queda sin contraste suficiente.
3. **Given** una persona con el tema Según el dispositivo, **When** cambia el modo del teléfono
   entre claro y oscuro, **Then** la App cambia de paleta sin reiniciarse y sin perder lo que estaba
   cargando.
4. **Given** una persona con la sesión iniciada, **When** toca Inicio, Cuentas o Perfil en la
   barra inferior, **Then** llega a esa pantalla y la barra marca el destino activo; en los
   formularios de gasto y reembolso la barra no aparece.
5. **Given** una persona que cambia el tema en el Perfil, **When** confirma la elección, **Then** la
   App entera cambia de paleta en el momento.
6. **Given** cualquier pantalla rediseñada, **When** la persona hace lo mismo que hacía antes
   (cargar un gasto, registrar un reembolso, exportar, invitar), **Then** el resultado es idéntico
   al de antes de esta feature, aunque la pantalla esté reorganizada.

---

### User Story 2 - Entender los saldos de un vistazo (Priority: P1)

En el Dashboard y en la pestaña Saldos, una persona distingue enseguida cuánto le deben, cuánto
debe y qué gastos están pendientes de asignación, aunque no distinga colores o use la App a pleno
sol.

**Why this priority**: los saldos son la información más importante de ChePagame; si el diseño los
hace ambiguos, la identidad empeora la App.

**Independent Test**: mostrar el Dashboard y la pestaña Saldos con saldos a favor, en contra, en
cero y gastos pendientes, en claro, en oscuro y en escala de grises, y comprobar que cada estado se
entiende sin depender del color.

**Acceptance Scenarios**:

1. **Given** una persona a la que le deben, **When** mira el resumen de saldos, **Then** el importe
   aparece en el color "te deben" y además con el texto "Te deben" y el signo "+".
2. **Given** una persona que debe, **When** mira su saldo, **Then** aparece en el color "debés" y
   además con el texto "Debés" y el signo "−".
3. **Given** una Cuenta con gastos pendientes de asignación, **When** la persona mira Gastos o
   Saldos, **Then** el aviso aparece en el color de aviso y además con un ícono y el texto
   "Pendiente de asignación".
4. **Given** la pantalla en escala de grises, **When** la persona mira los saldos, **Then** puede
   decir cuáles son a favor, cuáles en contra y cuáles están al día.

---

### User Story 3 - Logo, ícono y pantalla de inicio (Priority: P2)

Una persona instala la App y la encuentra en su teléfono por el ícono de ChePagame. Al abrirla ve
la pantalla de inicio con el logo, y en el login el logo, el nombre y el slogan "Para que la guita
no sea un problema".

**Why this priority**: identifica a la App fuera de ella (en el teléfono y al abrirla), pero no
cambia el uso diario de las pantallas.

**Independent Test**: instalar la App en Android, buscar el ícono entre las apps, abrirla y llegar
al login, en modo claro y en modo oscuro.

**Acceptance Scenarios**:

1. **Given** la App instalada, **When** la persona busca entre sus apps, **Then** ve el ícono de
   ChePagame con el nombre "ChePagame", también cuando el teléfono usa íconos temáticos (un solo
   color).
2. **Given** la App cerrada, **When** la persona la abre, **Then** la pantalla de inicio muestra el
   logo sobre el fondo de la marca, en el modo claro u oscuro del teléfono.
3. **Given** una persona sin sesión, **When** llega al login, **Then** ve el logo, el nombre y el
   slogan en su idioma.

---

### User Story 4 - Una sola fuente de identidad para App y Web (Priority: P2)

Quien mantiene ChePagame cambia un color, una tipografía o un espaciado en un único lugar y el
cambio llega a todas las pantallas de la App, y queda listo para que la Web lo adopte en la feature
007. Si un cambio deja un texto sin contraste suficiente, o si una pantalla usa un color escrito a
mano, la verificación automática lo rechaza.

**Why this priority**: es lo que permite que la Web adopte la misma identidad sin copiar valores y
que la identidad no se degrade con el tiempo. Para la persona que usa la App no es visible.

**Independent Test**: cambiar el color principal en la fuente común y comprobar que cambia en toda
la App; poner un color sin contraste y comprobar que la verificación falla; escribir un color a
mano en una pantalla y comprobar que la verificación falla.

**Acceptance Scenarios**:

1. **Given** la fuente común de la identidad, **When** se cambia el color principal, **Then** cambia
   en todas las pantallas de la App sin tocar ninguna pantalla.
2. **Given** un cambio que deja un par de texto y fondo por debajo de 4,5:1 (o un control por debajo
   de 3:1), **When** se corre la verificación, **Then** falla e indica qué par y qué modo.
3. **Given** una pantalla con un color escrito a mano, **When** se corre la verificación, **Then**
   falla e indica el archivo.
4. **Given** la fuente común, **When** se genera la salida para la Web, **Then** contiene los mismos
   valores que usa la App, aunque la Web todavía no la use.

---

### Edge Cases

- **Texto grande del sistema**: con el tamaño de texto del teléfono al 150%, ningún importe, nombre
  o botón se corta ni se superpone; los textos largos pasan a otra línea.
- **Nombres e importes largos**: un nombre de Cuenta de 80 caracteres o un importe de 13 dígitos
  enteros no rompe tarjetas, listas ni encabezados.
- **Cambio de modo con un formulario abierto**: si el teléfono pasa a modo oscuro mientras se carga
  un gasto, lo cargado se conserva.
- **Saldo en cero**: "Al día" se muestra con su propio texto y un estilo neutro, sin el color de
  "te deben" ni el de "debés".
- **Cuenta Cerrada**: la indicación de solo lectura sigue siendo clara con la identidad nueva y no
  se confunde con un error.
- **Errores y estados vacíos**: los mensajes de error usan el color "debés" con un texto que
  explica qué pasó; los estados vacíos usan el texto secundario y no parecen errores.
- **Íconos temáticos de Android**: el ícono monocromo se reconoce como ChePagame.
- **Tipografía no disponible**: si la tipografía de la marca no carga, la App usa la del sistema y
  sigue siendo legible; nunca muestra texto invisible.
- **Pantallas futuras**: una pantalla nueva que use un color fuera de la identidad no pasa la
  verificación.

## Requirements *(mandatory)*

### Functional Requirements

**Fuente común de la identidad**

- **FR-001**: La identidad visual MUST definirse en un único lugar del proyecto con: colores por
  rol para modo claro y oscuro, tipografía (la familia de la marca y la del sistema, y tamaños,
  pesos e interlineado por nivel),
  escala de espaciados y radios.
- **FR-002**: Los colores MUST ser los de la paleta "Celeste y sol" de esta spec, más un color de
  borde para controles que llegue a 3:1 contra la superficie en cada modo.
- **FR-003**: De la fuente común MUST salir el tema de la App y una salida equivalente para la Web
  con los mismos valores; la Web no la usa hasta la feature 007.
- **FR-004**: Las pantallas y componentes de la App MUST tomar colores, tipografía, espaciados y
  radios solo de la identidad; no MUST haber colores escritos a mano fuera de la fuente común.
- **FR-005**: Una verificación automática MUST fallar si un par de texto y fondo de la identidad
  queda por debajo de 4,5:1, si un color de control, foco o ícono informativo queda por debajo de
  3:1, o si una pantalla usa un color escrito a mano. El mensaje MUST indicar el par y el modo, o
  el archivo.

**Temas**

- **FR-006**: La App MUST mostrar la paleta clara, la oscura o la del dispositivo según la
  preferencia de tema del Perfil, y aplicar un cambio de preferencia o de modo del teléfono sin
  reiniciarse y sin perder lo que la persona estaba cargando.
- **FR-007**: Las barras del sistema (estado y navegación) MUST verse con colores coherentes con
  el modo activo.

**Saldos y estados**

- **FR-008**: Los saldos a favor MUST mostrarse con el color "te deben", el texto "Te deben" (o "Le
  deben" para otro participante) y el signo "+"; los saldos en contra con el color "debés", el texto
  "Debés" (o "Debe") y el signo "−"; los saldos en cero con "Al día" en estilo neutro.
- **FR-009**: El aviso de gastos pendientes de asignación MUST mostrarse con el color de aviso, un
  ícono y el texto "Pendiente de asignación".
- **FR-010**: Los errores MUST mostrarse con el color "debés", un ícono y un texto que explique el
  problema; ningún estado MUST comunicarse solo con color.
- **FR-011**: Los importes MUST usar cifras de ancho fijo para que queden alineados en listas y
  tarjetas, con el formato de moneda que ya usa la App.

**Logo, ícono y pantalla de inicio**

- **FR-012**: ChePagame MUST tener un logo (símbolo y nombre) en versiones para fondo claro y
  oscuro, y un ícono de App para Android con sus variantes adaptativa y monocroma, e iOS.
- **FR-013**: La pantalla de inicio de la App MUST mostrar el logo sobre el fondo de la marca, en la
  versión clara u oscura según el modo del teléfono.
- **FR-014**: El login MUST mostrar el logo, el nombre ChePagame y el slogan en el idioma de la
  persona ("Para que la guita no sea un problema" / "So money is never a problem").

**Pantallas rediseñadas**

- **FR-014a**: Antes de implementar el rediseño MUST existir maquetas de las pantallas clave
  (login, Dashboard, la Cuenta con sus pestañas Gastos y Saldos, formulario de gasto y Perfil), en
  modo claro y oscuro, y del logo, aprobadas por el usuario. Las maquetas MUST mostrar 2 o 3
  tipografías candidatas para que el usuario elija la de la marca. Las demás pantallas de FR-015
  MUST seguir el lenguaje visual de las maquetas aprobadas.
- **FR-014b**: Con la sesión iniciada, la App MUST mostrar una barra de navegación inferior con
  tres destinos: Inicio (Dashboard), Cuentas (Mis Cuentas) y Perfil, con ícono y texto, marcando el
  destino activo sin depender solo del color. La barra MUST verse en esas tres pantallas y en las
  que se abren desde ellas (por ejemplo, una Cuenta), y MUST NOT verse en el login y el registro, la
  elección de moneda, ni en los formularios de gasto y reembolso, que ocupan toda la pantalla. Tocar
  el destino activo vuelve a su pantalla principal. Las rutas y los enlaces de invitación siguen
  funcionando igual.
- **FR-014c**: Los títulos, los importes y el logo MUST usar la tipografía de la marca, incluida en
  la App; el texto corrido MUST usar la tipografía del sistema. La tipografía de la marca MUST ser de
  licencia libre, tener cifras de ancho fijo y los caracteres del español (tildes, ñ, ¿, ¡).

- **FR-015**: MUST rediseñarse por completo con la identidad (se puede reorganizar la disposición
  de cada pantalla y sus componentes, por ejemplo un Dashboard nuevo): login, registro y verificación de email, ingreso
  con código, recuperación de contraseña, elección de moneda, Dashboard, Mis Cuentas, crear y editar
  Cuenta, unirse a una Cuenta e invitación, la Cuenta con sus pestañas Gastos y Saldos, el detalle,
  el formulario y el historial de un gasto, el formulario y la lista de reembolsos, y el Perfil (con
  la sección de exportación).
- **FR-016**: El rediseño MUST NOT cambiar el comportamiento: los mismos datos, acciones,
  validaciones y reglas de las features 001 a 005, y cada pantalla sigue permitiendo todo lo que
  permitía. Puede cambiar dónde está cada elemento, cómo se agrupa y cómo se llega a él dentro de
  la pantalla, y se suma la barra inferior de FR-014b; no se quitan funciones ni se agregan datos
  nuevos. Los textos existentes se
  conservan; solo se suman los que pida el nuevo diseño, en es y en.
- **FR-017**: Cada pantalla MUST respetar una jerarquía clara: un título por pantalla, una acción
  principal destacada con el color principal y las acciones secundarias en un estilo menos
  llamativo. El acento MUST usarse solo como fondo de un destacado (por ejemplo, el chip
  "Sugerido") con el texto sobre acento encima, y MUST NOT usarse como color de texto en ningún
  modo.

**Accesibilidad**

- **FR-018**: Todo elemento tocable MUST medir al menos 48 × 48 dp.
- **FR-019**: La App MUST seguir el tamaño de texto del sistema hasta 150% sin cortar ni superponer
  información.
- **FR-020**: Los elementos tocables y los estados MUST tener nombre accesible para lectores de
  pantalla, como hoy; el rediseño MUST NOT quitar ninguno.

**Idiomas**

- **FR-021**: Todo texto nuevo (slogan, nombres accesibles del logo, textos de estados) MUST existir
  en español y en inglés.

### Paleta Celeste y sol

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Principal | `#0B6FA8` | `#6CC4F2` |
| Texto sobre principal | `#FFFFFF` | `#062233` |
| Acento (amarillo sol) | `#F2B31B` | `#F6C343` |
| Texto sobre acento | `#2A1E00` | `#2A1E00` |
| Te deben | `#1C7A4A` | `#5FD39A` |
| Debés | `#B3361F` | `#FF8A73` |
| Pendiente de asignación | `#8A5A00` | `#F2C35B` |
| Fondo | `#F3F7FA` | `#0D1720` |
| Superficie | `#FFFFFF` | `#16232F` |
| Texto | `#13283A` | `#E6EEF4` |
| Texto secundario | `#4F6475` | `#9CB0C0` |
| Borde decorativo | `#D3E0EA` | `#2A3B4A` |
| Borde de controles | `#748899` | `#647A8C` |

Con estos valores, todos los pares de texto de la paleta superan 4,5:1 sobre el fondo y sobre la
superficie (el más justo: principal sobre fondo claro, 5,06:1), y el borde de controles supera 3:1
(el más justo: 3,41:1 sobre fondo claro). El borde de controles lo definió el plan (research R2).

### Key Entities *(include if feature involves data)*

- **Token de diseño**: un valor con nombre de la identidad (un color por rol y modo, un nivel de
  tipografía, un espaciado o un radio). Es la única forma en que las pantallas usan valores
  visuales.
- **Par de contraste**: un color de primer plano y uno de fondo que aparecen juntos (texto sobre
  superficie, texto sobre principal, borde de control sobre superficie), con el contraste mínimo
  que debe cumplir en cada modo (4,5:1 para texto, 3:1 para controles e íconos).
- **Logo**: símbolo y nombre de ChePagame, en versión para fondo claro y oscuro, con sus derivados
  (ícono de App, ícono adaptativo y monocromo, pantalla de inicio).

No hay datos nuevos de usuario ni cambios en el backend: la preferencia de tema ya existe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los pares de contraste de la identidad cumple el mínimo (4,5:1 texto,
  3:1 controles e íconos) en ambos modos, y la verificación automática lo comprueba en cada cambio.
- **SC-002**: Cero colores escritos a mano en las pantallas y componentes de la App fuera de la
  fuente común.
- **SC-003**: El 100% de las pantallas listadas en FR-015 usa la identidad en modo claro y oscuro,
  comprobado en la validación manual.
- **SC-004**: Todas las pruebas de comportamiento existentes de la App siguen pasando sin cambiar
  lo que verifican (las acciones y los resultados son los mismos); solo pueden cambiar cómo
  encuentran un elemento en una pantalla reorganizada.
- **SC-005**: Al cambiar el tema en el Perfil o el modo del teléfono, la App entera cambia de
  paleta en menos de 1 segundo, sin reiniciar y sin perder datos cargados.
- **SC-006**: En escala de grises, una persona identifica correctamente saldos a favor, en contra,
  al día y gastos pendientes en las pantallas de saldos.
- **SC-007**: Con el texto del sistema al 150%, ninguna pantalla de FR-015 corta ni superpone
  información.
- **SC-008**: Cambiar un color en la fuente común lo cambia en toda la App modificando un solo
  lugar.

## Assumptions

- La paleta "Celeste y sol" fue elegida por el usuario el 2026-11-12 entre tres propuestas, con el
  contraste ya verificado; esta feature no reabre esa elección.
- La tipografía de la marca va incluida en la App: no se descarga de servicios de terceros al
  usarla (Principio VI). La familia la elige el usuario en las maquetas (FR-014a).
- El logo lo diseña el equipo dentro de esta feature (símbolo simple y nombre) y el usuario lo
  aprueba junto con las maquetas, antes de generar los íconos (FR-014a). Si el usuario aporta un
  logo propio, se usa ese.
- La escala de espaciados es de múltiplos de 4 dp y hay cuatro radios fijos: pequeño (campos y
  chips), mediano (tarjetas), grande (hojas y diálogos) y completo (píldoras y botones). Los valores
  exactos están en el plan (data-model).
- Los íconos de la interfaz siguen siendo los de la biblioteca que ya usa la App.
- La Web no cambia su aspecto en esta feature: adopta la identidad en la feature 007. Esta feature
  deja lista la salida para la Web.
- La constitución suma una sección corta de identidad visual (usar siempre los tokens y cumplir el
  contraste) como enmienda menor, antes del plan o junto con él.
- Cambiar el ícono y la pantalla de inicio requiere recompilar el development build de la App para
  validarla.
