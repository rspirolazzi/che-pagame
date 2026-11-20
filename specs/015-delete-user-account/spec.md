# Feature Specification: Eliminar mi cuenta de usuario

**Feature Branch**: `015-delete-user-account`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Que el usuario pueda borrar su cuenta, desde la App y con un link
web, porque Google Play lo exige para publicar (y la constitución 4.9.0, Principio VI, ahora lo
pide)."

## Clarifications

### Session 2026-11-18

- Q: ¿Qué pasa con su participante en las Cuentas compartidas con otros? → A: Queda, sin vínculo
  con el usuario y con el nombre "Usuario eliminado". Gastos, reembolsos y saldos no cambian para
  los demás. Si era Owner, el rol pasa a otro miembro registrado.
- Q: ¿Qué pasa con las Cuentas donde es el único miembro registrado? → A: Se eliminan (baja
  lógica, Principio IV) junto con sus gastos y reembolsos.
- Q: ¿Cómo confirma? → A: Con un código de un solo uso que recibe por email; sirve igual para
  usuarios con contraseña y con Google.
- Q: ¿Inmediato o con plazo? → A: Inmediato al confirmar. Antes se le ofrece exportar sus datos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Borrar mi cuenta desde el Perfil (Priority: P1)

Como usuario, quiero eliminar mi cuenta de ChePagame desde el Perfil, en la Web o en la App,
para que dejen de guardar mis datos personales y nadie pueda volver a entrar con ellos.

**Why this priority**: es el requisito que bloquea la publicación en Google Play y un derecho del
usuario (Ley 25.326).

**Independent Test**: con un usuario de prueba, ir a Perfil → "Eliminar mi cuenta", pedir el
código, ingresarlo y comprobar que la sesión se cierra, que no se puede volver a entrar con ese
email (ni con contraseña ni con Google) sin registrarse de nuevo y que el Perfil ya no existe.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión iniciada, **When** entra a Perfil → "Eliminar mi cuenta",
   **Then** ve qué se borra y qué se conserva, un acceso a "Exportar mis datos" y el botón para
   recibir un código por email.
2. **Given** que pidió el código, **When** ingresa el código correcto y confirma, **Then** la
   cuenta se elimina, se cierran todas sus sesiones (en todos los dispositivos) y vuelve a la
   pantalla de inicio con el mensaje "Tu cuenta fue eliminada".
3. **Given** que ingresa un código incorrecto o vencido, **When** confirma, **Then** ve un error
   claro, la cuenta no se toca y puede pedir otro código.
4. **Given** que el usuario cancela en cualquier paso, **Then** no cambia nada.
5. **Given** un usuario eliminado, **When** alguien intenta iniciar sesión con ese email (con
   contraseña, con código o con Google), **Then** se comporta como un email sin cuenta: puede
   registrarse de nuevo y empieza sin Cuentas.
6. **Given** otro dispositivo con la sesión de ese usuario abierta, **When** hace cualquier
   acción, **Then** la sesión deja de valer y vuelve a la pantalla de inicio.

---

### User Story 2 - Que mis Cuentas compartidas sigan funcionando para los demás (Priority: P1)

Como miembro de una Cuenta con alguien que borró su usuario, quiero que los gastos y los saldos
sigan igual, para no perder lo que cargamos entre todos.

**Why this priority**: sin esto, borrar un usuario rompería las cuentas de sus amigos.

**Independent Test**: Ana y Beto comparten una Cuenta con gastos de los dos; Beto borra su
usuario. Ana sigue viendo todos los gastos y los mismos saldos, con "Usuario eliminado" donde
estaba Beto.

**Acceptance Scenarios**:

1. **Given** una Cuenta con otros miembros registrados, **When** un miembro borra su usuario,
   **Then** su participante queda en la Cuenta con el nombre "Usuario eliminado", sin vínculo con
   ningún usuario, y los gastos, reembolsos y saldos no cambian.
2. **Given** que el usuario eliminado era el Owner, **Then** el rol de Owner pasa al miembro
   registrado que se unió primero a la Cuenta.
3. **Given** el participante "Usuario eliminado", **Then** los demás miembros pueden usarlo como
   cualquier participante sin usuario: elegirlo como pagador, registrar reembolsos, renombrarlo o
   quitarlo.
4. **Given** una Cuenta donde el usuario era el único miembro registrado, **When** borra su
   usuario, **Then** la Cuenta, sus gastos y sus reembolsos se eliminan y nadie más la ve.
5. **Given** un link de invitación de una Cuenta eliminada, **When** alguien lo abre, **Then** ve
   que la invitación no es válida.

---

### User Story 3 - Saber cómo borrar mi cuenta sin instalar la App (Priority: P1)

Como persona que ya desinstaló la App (o que revisa la ficha de Google Play), quiero una página
web pública que explique cómo eliminar mi cuenta y qué datos se borran, para poder hacerlo sin
reinstalar nada.

**Why this priority**: Google Play pide esta URL en el formulario de Seguridad de los datos; sin
ella no se puede publicar.

**Independent Test**: sin sesión, abrir la página pública de eliminación en la Web desde una
computadora y desde un teléfono: explica los pasos, qué se borra y qué se conserva, y lleva al
login y luego directo a "Eliminar mi cuenta". La página de Privacidad la enlaza.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión, **When** abre la página pública de eliminación, **Then** ve
   los pasos, qué datos se borran, qué se conserva (gastos en Cuentas compartidas, sin su nombre)
   y un botón "Eliminar mi cuenta".
2. **Given** que toca el botón sin sesión, **When** inicia sesión, **Then** llega directo a la
   pantalla de eliminación del Perfil.
3. **Given** la página de Privacidad, **Then** tiene una sección "Eliminar tus datos" que explica
   cómo hacerlo y enlaza la página pública.
4. **Given** la página pública, **Then** está en español y en inglés, como el resto de la Web, y
   se lee bien en un teléfono.

---

### Edge Cases

- **Usuario solo con Google**: el código igual va al email de su cuenta de Google; no necesita
  contraseña.
- **No le llega el email**: puede pedir otro código, con el mismo límite de reenvíos que el login
  con código.
- **Demasiados intentos**: se aplica el mismo límite de intentos que al verificar códigos de
  login; al superarlo debe esperar.
- **Exportar antes de borrar**: la pantalla ofrece "Exportar mis datos"; si no lo hace, el borrado
  igual procede (no es obligatorio exportar).
- **Cuenta donde todos los demás participantes son de texto libre** (sin usuario): cuenta como
  "único miembro registrado" y se elimina.
- **Dos miembros borran su usuario a la vez en la misma Cuenta**: el resultado es el mismo que si
  lo hicieran uno después del otro; si no queda ningún miembro registrado, la Cuenta se elimina.
- **Registro pendiente o códigos sin usar** del mismo email: se descartan.
- **Volver a registrarse con el mismo email**: es un usuario nuevo; no recupera nada ni vuelve a
  quedar vinculado a sus participantes anteriores.
- **Falla a mitad del borrado**: no puede quedar a medias (por ejemplo, el usuario borrado pero
  todavía Owner de una Cuenta); si algo falla, no se borra nada y ve un error para reintentar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Web y App MUST ofrecer "Eliminar mi cuenta" en el Perfil, en una zona separada y
  marcada como acción destructiva.
- **FR-002**: Antes de confirmar, la pantalla MUST explicar qué se borra y qué se conserva y MUST
  ofrecer un acceso a "Exportar mis datos".
- **FR-003**: La eliminación MUST confirmarse con un código de un solo uso enviado al email del
  usuario, con el mismo vencimiento, límite de intentos y límite de reenvíos que el código de
  login.
- **FR-004**: Al confirmar, el sistema MUST borrar o anonimizar de forma irreversible los datos
  personales del usuario: email, nombre y apellido, contraseña, preferencias, vínculo con Google,
  sesiones y tokens de actualización, códigos pendientes y registros pendientes de su email.
- **FR-005**: El sistema MUST revocar todas las sesiones del usuario en todos los dispositivos;
  cualquier pedido posterior con esas credenciales MUST rechazarse como no autenticado.
- **FR-006**: En cada Cuenta con otro miembro registrado, el participante del usuario MUST quedar
  desvinculado y renombrado a "Usuario eliminado" (traducido según el idioma de quien mira), sin
  cambiar gastos, reembolsos ni saldos.
- **FR-007**: Si el usuario era Owner de una Cuenta que conserva otros miembros registrados, el rol
  MUST pasar al miembro registrado que se unió primero.
- **FR-008**: Las Cuentas sin otro miembro registrado MUST eliminarse con baja lógica, junto con
  sus gastos y reembolsos, e invalidar sus invitaciones.
- **FR-009**: Todos los cambios del borrado MUST aplicarse de forma atómica: o se completan todos
  o no se aplica ninguno.
- **FR-010**: El borrado MUST quedar registrado en la auditoría con el identificador interno del
  usuario y sin datos personales (ni email ni nombre). Las entradas de auditoría existentes se
  conservan (Principio IV); si alguna guarda datos personales del usuario (como su email o su
  nombre de perfil), esos valores MUST reemplazarse por el texto anonimizado, y es el único cambio
  permitido sobre ellas.
- **FR-011**: Después del borrado, el email MUST quedar libre para un registro nuevo, que empieza
  sin Cuentas ni vínculos con participantes anteriores.
- **FR-012**: La Web MUST tener una página pública (sin sesión) en español e inglés que explique
  cómo eliminar la cuenta, qué se borra y qué se conserva, con un botón que, tras iniciar sesión,
  lleva directo a la pantalla de eliminación.
- **FR-013**: La página de Privacidad MUST incluir una sección "Eliminar tus datos" que enlace la
  página pública; la fecha de última actualización de los textos legales MUST actualizarse.
- **FR-014**: Los logs de aplicación MUST NOT registrar el email ni el nombre del usuario durante
  el borrado (Principio VI).
- **FR-015**: Todos los textos nuevos MUST estar en español e inglés en Web y App (Principio II).

### Key Entities

- **Usuario**: deja de existir como persona identificable; sus datos personales se borran o
  anonimizan. Su identificador interno puede seguir apareciendo en la auditoría.
- **Participante**: el que estaba vinculado al usuario pasa a ser un participante sin usuario
  llamado "Usuario eliminado".
- **Cuenta**: cambia de Owner o se elimina con baja lógica, según si quedan miembros registrados.
- **Código de eliminación**: código de un solo uso, de vida corta, enviado al email del usuario
  para confirmar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede eliminar su cuenta desde el Perfil en menos de 2 minutos, contando
  la espera del email.
- **SC-002**: Después del borrado, una búsqueda del email o del nombre de perfil del usuario en
  todos los datos guardados no devuelve ningún resultado.
- **SC-003**: En el 100 % de las Cuentas compartidas los saldos de los demás miembros son iguales
  antes y después del borrado.
- **SC-004**: Ninguna sesión del usuario eliminado funciona después del borrado, en ningún
  dispositivo.
- **SC-005**: La URL de la página pública de eliminación se puede cargar en el formulario de
  Seguridad de los datos de Google Play y abre sin sesión.

## Assumptions

- Los datos se borran en la base de producción al confirmar; las copias de seguridad, si existen,
  se renuevan con su ciclo normal y no se editan.
- "Miembro registrado" es un participante vinculado a un usuario; los participantes de texto libre
  no cuentan.
- El código se envía con el mismo servicio de email del login con código.
- Web y App usan el mismo endpoint de la API (Principio I). No hay un formulario para pedir la baja
  por email: la página pública guía a hacerlo desde el Perfil.
- La exportación de datos ya existe (Perfil → "Exportar mis datos") y no cambia.
- Fuera de alcance: plazo de arrepentimiento, borrado de Cuentas compartidas por decisión de un
  solo miembro y borrado por pedido de un administrador.
