# Feature Specification: SEO y páginas públicas

**Feature Branch**: `011-seo-public-pages`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Generar tareas de SEO en el frontend: agregar palabras clave,
aplicar las mejores prácticas para un mejor ranking, agregar preguntas frecuentes y definir las
secciones Quiénes somos, Contacto y Cómo funciona, y cómo se ven en Web y Mobile." Google
Analytics queda pospuesto por decisión del usuario.

## Clarifications

### Session 2026-11-18

- Q: ¿Qué búsquedas se quieren ganar? → A: Tres grupos: "dividir gastos" (entre amigos, de
  viaje, app, calculadora de gastos compartidos); jerga argentina ("hacer la vaca", "pagar a
  medias", "quién le debe a quién", "gastos del asado", "cuentas claras"); y casos de uso
  (departamento compartido, pareja, viaje en grupo).
- Q: ¿Para qué mercado e idioma? → A: Argentina, español rioplatense. El inglés sigue disponible
  para las personas, pero no se indexa aparte y no cambian las direcciones.
- Q: ¿Dónde viven las preguntas frecuentes? → A: En una página pública nueva de la Web, marcada
  para que Google la muestre como preguntas frecuentes, y la misma lista en la App (Perfil).
- Q: ¿Qué cambia en Quiénes somos, Contacto y Cómo funciona? → A: Se reescribe su contenido con
  foco en búsquedas en la Web, y la App las muestra en Perfil → "Acerca de" junto con las
  preguntas frecuentes.
- Q: ¿Google Analytics? → A: Fuera de alcance por ahora (requiere consentimiento, Principio VI).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar ChePagame al buscar cómo dividir gastos (Priority: P1)

Como persona en Argentina que busca en Google "app para dividir gastos" o "cómo hacer la vaca",
quiero encontrar ChePagame con un título y una descripción que me digan qué hace, para entrar y
probarla.

**Why this priority**: es el objetivo de la feature: que lleguen personas nuevas desde los
buscadores.

**Independent Test**: revisar el código fuente servido de cada página pública (título,
descripción, dirección canónica, datos para redes y datos estructurados) y validarlo con las
herramientas de Google (Rich Results Test y Search Console).

**Acceptance Scenarios**:

1. **Given** cualquier página pública, **When** un buscador la lee, **Then** tiene un título y una
   descripción propios, en español, que incluyen palabras clave de su tema.
2. **Given** un link de ChePagame compartido en WhatsApp o redes, **When** se genera la vista
   previa, **Then** se ve el título, la descripción y una imagen de la marca.
3. **Given** un buscador que recorre el sitio, **When** consulta el índice de páginas y las reglas
   de rastreo, **Then** encuentra todas las páginas públicas y se le indica no indexar las
   privadas (cuentas, perfil, panel, invitaciones).
4. **Given** el validador de resultados enriquecidos de Google, **When** analiza el inicio y la
   página de preguntas frecuentes, **Then** reconoce la aplicación y las preguntas sin errores.

---

### User Story 2 - Resolver dudas en Preguntas frecuentes (Priority: P1)

Como persona que evalúa usar ChePagame, quiero leer respuestas cortas a las dudas comunes
(¿es gratis?, ¿cómo divido un gasto?, ¿cómo invito al grupo?), para decidir sin escribirle a
nadie.

**Why this priority**: las preguntas frecuentes responden búsquedas reales y aparecen como
resultado enriquecido en Google; además reducen consultas.

**Independent Test**: abrir la página de preguntas frecuentes sin sesión, leer y expandir
preguntas, y validarla con el Rich Results Test.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión, **When** entra a Preguntas frecuentes, **Then** ve las
   preguntas agrupadas por tema y puede abrir cada respuesta.
2. **Given** la lista de preguntas, **When** se revisa, **Then** cubre al menos: qué es y si es
   gratis, cómo crear una cuenta compartida, cómo invitar, cómo se divide un gasto y los
   centavos, qué es un pago entre miembros, cómo se calcula quién le debe a quién, monedas,
   privacidad y exportación de datos, borrar la cuenta, y si hay App.
3. **Given** el inicio, Cómo funciona y el footer, **When** se navega, **Then** hay un link a
   Preguntas frecuentes.

---

### User Story 3 - Conocer el proyecto y contactarlo (Priority: P2)

Como persona interesada, quiero entender cómo funciona ChePagame, quién lo hace y cómo
contactarlo, con textos claros y pensados para buscadores.

**Why this priority**: refuerza la confianza y el posicionamiento; las páginas ya existen, solo
cambia su contenido.

**Independent Test**: leer las tres páginas sin sesión y revisar que cada una tenga un título
principal, subtítulos, palabras clave de su tema y links internos a las otras.

**Acceptance Scenarios**:

1. **Given** Cómo funciona, **When** se lee, **Then** explica en pasos crear una cuenta compartida,
   invitar, cargar gastos, ver saldos y saldar deudas, con ejemplos de casos de uso (viaje, asado,
   departamento, pareja).
2. **Given** Quiénes somos, **When** se lee, **Then** cuenta qué es ChePagame, por qué existe y su
   compromiso con la privacidad.
3. **Given** Contacto, **When** se lee, **Then** muestra cómo escribir al proyecto y remite a
   Preguntas frecuentes para dudas comunes.

---

### User Story 4 - Ver la misma información en la App (Priority: P2)

Como persona que usa la App, quiero encontrar Cómo funciona, Quiénes somos, Contacto y Preguntas
frecuentes dentro de la App, sin salir al navegador.

**Why this priority**: mantiene la paridad Web y Mobile (Principio I), pero el SEO solo aplica a la
Web.

**Independent Test**: en la App, ir a Perfil → "Acerca de" y abrir las cuatro secciones.

**Acceptance Scenarios**:

1. **Given** la App con sesión, **When** se abre Perfil → "Acerca de", **Then** aparecen Cómo
   funciona, Quiénes somos, Contacto y Preguntas frecuentes.
2. **Given** cada sección en la App, **When** se abre, **Then** muestra el mismo contenido que la
   Web, en el idioma de la persona, con la identidad visual de la App.

---

### Edge Cases

- Una persona con el navegador en inglés ve las páginas en inglés; los buscadores (que no envían
  idioma) MUST recibir la versión en español.
- Una persona con sesión que entra a una página pública la ve igual (con su encabezado de sesión).
- Páginas inexistentes MUST responder con "no encontrado" real, no con una página vacía indexable.
- Las páginas privadas que un buscador encuentre por un link MUST indicar que no se indexen.
- Las páginas de login, registro y recuperación de contraseña no aportan al SEO y MUST NOT
  figurar en el índice de páginas.

## Requirements *(mandatory)*

### Functional Requirements

**Metadatos por página**

- **FR-001**: Cada página pública (inicio, Cómo funciona, Quiénes somos, Contacto, Preguntas
  frecuentes, Privacidad, Términos) MUST tener título y descripción propios en español
  rioplatense, con palabras clave de su tema y largo adecuado para buscadores (título ≤ 60
  caracteres, descripción ≤ 160).
- **FR-002**: Cada página pública MUST declarar su dirección canónica sobre el dominio de
  producción.
- **FR-003**: Cada página pública MUST incluir datos para vista previa en redes (título,
  descripción, imagen de la marca de 1200×630 e idioma `es_AR`).
- **FR-004**: Las páginas privadas y las de autenticación MUST indicar a los buscadores que no las
  indexen.

**Rastreo e índice**

- **FR-005**: El sitio MUST publicar reglas de rastreo que permitan las páginas públicas, bloqueen
  las privadas y la API, y apunten al índice de páginas.
- **FR-006**: El sitio MUST publicar un índice de páginas (sitemap) con todas las páginas públicas
  indexables y su fecha de última modificación.
- **FR-007**: El sitio MUST servir un favicon en la dirección estándar.

**Datos estructurados**

- **FR-008**: El inicio MUST describir la organización y la aplicación web (nombre, descripción,
  categoría finanzas, gratuita, idioma, logo) con datos estructurados.
- **FR-009**: Preguntas frecuentes MUST marcar sus preguntas y respuestas como datos estructurados
  de tipo preguntas frecuentes, con el mismo texto visible en la página.

**Contenido**

- **FR-010**: Las palabras clave de las Clarifications MUST aparecer de forma natural en los
  títulos, subtítulos y textos de las páginas públicas, sin repetirlas en exceso.
- **FR-011**: Cada página pública MUST tener un único título principal y subtítulos jerárquicos.
- **FR-012**: Las páginas públicas MUST enlazarse entre sí (footer y links en el contenido).
- **FR-013**: Se MUST crear la página pública Preguntas frecuentes (User Story 2), con respuestas
  desplegables accesibles por teclado y lector de pantalla.
- **FR-014**: Se MUST reescribir Cómo funciona, Quiénes somos y Contacto según la User Story 3.
- **FR-015**: Todo texto nuevo MUST existir en español y en inglés (Principio II); el español es
  la versión indexada.

**Mobile**

- **FR-016**: La App MUST agregar en Perfil una sección "Acerca de" con Cómo funciona, Quiénes
  somos, Contacto y Preguntas frecuentes, con el mismo contenido que la Web.

**Calidad**

- **FR-017**: Las páginas públicas MUST cargar rápido y estables en teléfonos (buenas métricas de
  Core Web Vitals) y MUST NOT cargar scripts de terceros, salvo la verificación anti-bots de la
  feature 017 en Registro y Contacto (constitución 4.10.0, Principio VI).

### Key Entities

- **Página pública**: dirección, título, descripción, imagen para redes, si se indexa y fecha de
  última modificación.
- **Pregunta frecuente**: tema, pregunta y respuesta, en español y en inglés; compartida por la
  Web y la App.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las páginas públicas tiene título, descripción, canónica e imagen para
  redes propios.
- **SC-002**: El Rich Results Test de Google reconoce sin errores la aplicación (inicio) y las
  preguntas frecuentes.
- **SC-003**: Lighthouse da 95 o más en SEO y 90 o más en accesibilidad para cada página pública,
  en móvil.
- **SC-004**: El índice de páginas lista el 100 % de las públicas indexables y ninguna privada o de
  autenticación.
- **SC-005**: Preguntas frecuentes tiene al menos 12 preguntas que cubren los temas de la User
  Story 2.
- **SC-006**: Una vista previa de link en WhatsApp muestra título, descripción e imagen correctos.
- **SC-007**: Las cuatro secciones de "Acerca de" se abren en la App con el mismo contenido que en
  la Web.

## Assumptions

- El dominio de producción es `https://chepagame.com.ar`.
- El registro del sitio en Google Search Console y el envío del sitemap los hace el usuario; la
  feature deja todo listo para hacerlo.
- Contacto sigue usando el canal que ya existe (sin formulario nuevo ni backend nuevo).
- Google Analytics, un banner de cookies y la indexación del inglés con direcciones propias quedan
  fuera de alcance.
- Los links a tiendas de apps no se agregan hasta que la App esté publicada.
