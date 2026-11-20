# Feature Specification: Formulario de contacto y protección anti-bots

**Feature Branch**: `017-contact-form-turnstile`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "realizar el formulario de contacto. utilizar callmebot para enviar WS a
mi numero (CALLMEBOT_URL, CALLMEBOT_PHONE, CALLMEBOT_APIKEY). Usar cloudflare antes de enviar un
formulario de contacto o que se registre una persona (NEXT_PUBLIC_TURNSTILE_SITE_KEY,
CLOUDFLARE_TURNSTILE_SECRET_KEY). Solo activar estas funcionalidades si en environment es
PRODUCTION"

## Clarifications

### Session 2026-11-20

- Q: ¿La verificación anti-bots protege también el registro desde la App? → A: Sí, en Web y App;
  el servidor exige la verificación a todos los clientes, así no se puede esquivar desde la App.
- Q: ¿El formulario de contacto va solo en la Web o también en la App? → A: En las dos, con la
  misma verificación y el mismo envío.
- Ajuste en el plan (2026-11-20): el límite "por origen" se reemplaza por un tope total, porque la
  Web llama a la API desde su servidor y la API no ve la dirección real; y se agrega el
  consentimiento explícito para enviar datos a CallMeBot (FR-013, Principio VI).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escribirle al proyecto desde Contacto (Priority: P1)

Como visitante o usuario, quiero completar un formulario en Contacto (nombre, email y mensaje) en
la Web o en la App, para escribirle al responsable del proyecto sin abrir mi correo. El
responsable recibe el mensaje en su WhatsApp.

**Why this priority**: es el pedido principal y hoy Contacto solo muestra un email.

**Independent Test**: en producción, completar el formulario en la Web y en la App, pasar la
verificación y comprobar que llega un WhatsApp al número del responsable con el nombre, el email
y el mensaje.

**Acceptance Scenarios**:

1. **Given** el formulario completo y la verificación superada, **When** lo envío, **Then** veo
   "Mensaje enviado" y el responsable recibe un WhatsApp con mi nombre, mi email, el mensaje, el
   idioma y si vino de la Web o de la App.
2. **Given** un email inválido o un campo vacío, **When** intento enviar, **Then** veo qué campo
   corregir y no se envía nada.
3. **Given** un mensaje más largo que el máximo, **When** escribo, **Then** veo cuántos caracteres
   quedan y no puedo superar el máximo.
4. **Given** que el envío por WhatsApp falla, **When** envío, **Then** veo un error que me ofrece
   el email de contacto y lo que escribí no se pierde.
5. **Given** que tengo sesión iniciada, **When** abro el formulario, **Then** nombre y email vienen
   completados con los de mi perfil y los puedo cambiar.

---

### User Story 2 - Registro protegido contra bots (Priority: P1)

Como responsable del proyecto, quiero que crear una cuenta con email requiera pasar una
verificación anti-bots de Cloudflare en la Web y en la App, para evitar registros automáticos y
el envío masivo de emails de código.

**Why this priority**: cada registro manda un email; un bot puede gastar la cuota de envío y
llenar la base con cuentas falsas.

**Independent Test**: en producción, registrarse en la Web y en la App pasando la verificación
(funciona); intentar registrarse llamando al servidor sin verificación o con una verificación
inválida o reusada (se rechaza y no se manda email).

**Acceptance Scenarios**:

1. **Given** el formulario de registro, **When** paso la verificación y envío, **Then** el
   registro sigue como hoy (llega el código por email).
2. **Given** un pedido de registro sin verificación, con una inválida, vencida o ya usada,
   **When** llega al servidor, **Then** se rechaza con un mensaje traducido y no se envía email.
3. **Given** que la verificación no carga (por ejemplo, sin conexión con Cloudflare), **When**
   intento registrarme, **Then** veo un mensaje que me pide reintentar y el botón no envía.
4. **Given** el inicio de sesión con Google, **When** lo uso, **Then** no se pide la verificación
   (Google ya valida a la persona).

---

### User Story 3 - Todo esto solo en producción (Priority: P1)

Como desarrollador, quiero que la verificación anti-bots y el envío por WhatsApp funcionen solo
cuando el entorno es producción, para desarrollar y correr tests sin credenciales ni mensajes
reales.

**Why this priority**: sin esto los tests y el entorno local necesitarían credenciales reales y
mandarían WhatsApps de prueba.

**Independent Test**: con el entorno en desarrollo, registrarse y enviar el formulario de
contacto sin ver ninguna verificación y sin que llegue ningún WhatsApp; el mensaje queda en el
registro del servidor sin datos personales.

**Acceptance Scenarios**:

1. **Given** un entorno distinto de producción, **When** abro el registro o Contacto, **Then** no
   se muestra la verificación y el servidor no la exige.
2. **Given** un entorno distinto de producción, **When** envío el formulario de contacto, **Then**
   veo "Mensaje enviado", no se envía ningún WhatsApp y el servidor registra que se recibió un
   mensaje (solo largo e idioma, sin nombre, email ni texto).
3. **Given** producción sin alguna de las credenciales configuradas, **When** arranca el sistema,
   **Then** falla al iniciar indicando qué configuración falta (sin mostrar valores).

---

### Edge Cases

- Envíos repetidos: el formulario de contacto tiene un límite de envíos por email (5 por hora) y
  un tope total (30 por hora); al superarlo se ve un mensaje traducido.
- Doble toque en "Enviar": se envía un solo mensaje.
- Textos con enlaces, emojis o caracteres especiales llegan legibles al WhatsApp; el texto se
  envía como texto plano.
- El mensaje de WhatsApp tiene un largo máximo; el formulario limita el mensaje a 2.000
  caracteres.
- La verificación vence si se tarda mucho en enviar: se renueva sola o pide repetirla.
- Modo oscuro e idioma: la verificación respeta el tema y el idioma elegidos.
- Usuarios con lector de pantalla: la verificación y el formulario son accesibles (Principio
  VII); Cloudflare normalmente no pide interacción.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Contacto MUST tener, en Web y App, un formulario con nombre (obligatorio, hasta 100
  caracteres), email (obligatorio, válido) y mensaje (obligatorio, 10 a 2.000 caracteres).
- **FR-002**: El servidor MUST enviar cada mensaje válido al WhatsApp del responsable con nombre,
  email, mensaje, idioma, cliente (Web o App) y fecha.
- **FR-003**: El sistema MUST NOT guardar los mensajes de contacto ni sus datos personales; solo se
  reenvían. Los registros del servidor MUST NOT incluir nombre, email ni texto del mensaje.
- **FR-004**: En producción, el envío del formulario de contacto y el inicio de un registro con
  email MUST exigir una verificación anti-bots de Cloudflare válida, verificada por el servidor,
  de un solo uso, en Web y App.
- **FR-005**: El inicio de sesión (con contraseña, con código o con Google) MUST NOT pedir la
  verificación.
- **FR-006**: Fuera de producción, la verificación MUST NOT mostrarse ni exigirse y el WhatsApp
  MUST NOT enviarse; el formulario responde como si se hubiera enviado.
- **FR-007**: En producción, si falta alguna credencial de Cloudflare o de CallMeBot, el sistema
  MUST NOT arrancar y MUST indicar el nombre de la configuración faltante, nunca su valor.
- **FR-008**: El formulario de contacto MUST limitar los envíos por email (5 por hora) y en total
  (30 por hora, para proteger el número del responsable) y mostrar un mensaje traducido al superar
  el límite.
- **FR-009**: Si el envío por WhatsApp falla, el usuario MUST ver un error traducido con el email
  de contacto como alternativa y conservar lo escrito.
- **FR-010**: Con sesión iniciada, nombre y email MUST venir completados con los del perfil.
- **FR-011**: Todos los textos, errores y la verificación MUST estar en español e inglés según el
  idioma elegido (Principio II) y respetar el tema claro u oscuro.
- **FR-012**: La política de privacidad MUST mencionar que el formulario de contacto envía los
  datos por WhatsApp mediante CallMeBot y que el registro y Contacto usan Cloudflare Turnstile.
- **FR-013**: Antes de enviar, la persona MUST aceptar de forma explícita (casilla sin marcar por
  defecto) que su nombre, email y mensaje se envíen por WhatsApp mediante CallMeBot; sin aceptar,
  no se puede enviar (Principio VI: datos a terceros solo con consentimiento).
- **FR-014**: Las credenciales MUST leerse solo de variables de entorno, nunca del código ni del
  repositorio. La clave pública del sitio puede incluirse en la Web y en la App; las claves
  secretas MUST quedar solo en el servidor.

### Key Entities

- **Mensaje de contacto**: nombre, email, mensaje, idioma, cliente y fecha. Vive solo mientras se
  reenvía; no se guarda.
- **Verificación anti-bots**: comprobante de un solo uso que emite Cloudflare en el cliente y el
  servidor valida antes de aceptar el registro o el mensaje.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: en producción, un mensaje enviado desde la Web o la App llega al WhatsApp del
  responsable en menos de 1 minuto en el 95 % de los casos.
- **SC-002**: el 100 % de los pedidos de registro con email o de contacto sin verificación válida
  se rechaza en producción, sin enviar emails ni WhatsApps.
- **SC-003**: una persona completa y envía el formulario de contacto en menos de 2 minutos.
- **SC-004**: fuera de producción, la suite de tests corre sin credenciales de Cloudflare ni de
  CallMeBot y sin enviar mensajes reales.
- **SC-005**: ningún registro del servidor ni ningún archivo del repositorio contiene las
  credenciales ni los datos de los mensajes de contacto.

## Assumptions

- "Producción" es el entorno que el sistema ya reconoce como production (la variable
  `ENVIRONMENT`), sin distinguir mayúsculas.
- Configuración, en el `.env` del servidor (gitignored):
  - CallMeBot: `CALLMEBOT_URL`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` (solo servidor).
  - Cloudflare Turnstile: `CLOUDFLARE_TURNSTILE_SECRET_KEY` (solo servidor) y
    `CLOUDFLARE_TURNSTILE_SITE_KEY` (pública, para la Web; renombrada desde
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY` porque se lee en el servidor, no en el navegador). La App recibe la misma clave pública
    en su configuración de build, igual que las otras variables públicas.
- El envío lo hace el servidor (la API), no el navegador ni la App, así las claves de CallMeBot no
  salen del servidor.
- El email de contacto existente sigue visible como alternativa.
- El responsable ya activó CallMeBot en su número; CallMeBot es un servicio gratuito sin garantía
  de entrega, por eso existe la alternativa por email.

## Out of Scope

- Responder mensajes desde la plataforma o guardar un historial de mensajes.
- Verificación anti-bots en el inicio de sesión, cambio de email o recuperación de contraseña.
- Notificaciones por WhatsApp de otros eventos.
