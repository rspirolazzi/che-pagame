# Feature Specification: Importe por participante al cargar un gasto

**Feature Branch**: `013-split-amount-preview`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Cuando un usuario carga un gasto y coloca el importe, en la sección
'Lo comparten' quiero que aparezca al lado de cada nombre el importe que debe pagar cada uno. A
medida que se van agregando o quitando participantes, el importe debe dividirse entre esas
personas seleccionadas."

## Clarifications

### Session 2026-11-18

- Q: Cuando el importe no se divide exacto (ej. $100 entre 3), ¿cómo se muestra? → A: Exacto,
  como lo calcula el saldo: $33,34 / $33,33 / $33,33. El centavo sobrante va según el orden de la
  Cuenta, igual que en el backend, y la suma siempre da el total.
- Q: ¿La división puede editarse por persona? → A: No. Siempre en partes iguales; solo se muestra
  el importe y se recalcula al tildar o destildar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver cuánto pone cada uno mientras cargo el gasto (Priority: P1)

Como miembro que carga un gasto, quiero ver al lado de cada persona que lo comparte cuánto le
toca, y que se recalcule al cambiar el importe o las personas, para confirmar que la división es
la que espero antes de guardar.

**Why this priority**: es el pedido completo; evita errores de carga y dudas del tipo "¿cuánto me
toca?".

**Independent Test**: en el formulario de un gasto nuevo, cargar $100 con tres personas tildadas,
ver 33,34 / 33,33 / 33,33; destildar una y ver 50 / 50; cambiar el importe y ver los nuevos
valores; guardar y comprobar que el detalle muestra las mismas partes.

**Acceptance Scenarios**:

1. **Given** el formulario con un importe válido y varias personas tildadas, **When** se mira "Lo
   comparten", **Then** al lado de cada persona tildada aparece su parte en la moneda de la
   Cuenta.
2. **Given** las partes visibles, **When** se tilda o destilda a alguien, **Then** las partes se
   recalculan al instante entre las personas tildadas.
3. **Given** las partes visibles, **When** se cambia el importe, **Then** se recalculan al
   instante.
4. **Given** un importe que no se divide exacto, **When** se muestran las partes, **Then** suman
   exactamente el total y el centavo sobrante se asigna con la misma regla que usa el saldo.
5. **Given** un gasto guardado, **When** se abre su detalle, **Then** cada parte coincide con la
   que se mostró en el formulario.

---

### User Story 2 - Entender qué pasa con quien no comparte (Priority: P2)

Como miembro, quiero que las personas destildadas se vean claramente sin parte, para no pensar que
pagan algo.

**Why this priority**: completa la claridad del formulario; es un detalle visual.

**Independent Test**: destildar a una persona y comprobar que no muestra importe (o muestra un
texto que indica que no participa).

**Acceptance Scenarios**:

1. **Given** una persona destildada, **When** se mira la lista, **Then** no muestra importe y su
   estado se entiende sin depender del color.
2. **Given** un importe vacío o inválido, **When** se mira "Lo comparten", **Then** no se muestran
   partes (ni ceros engañosos) hasta que el importe sea válido.

---

### Edge Cases

- **Nadie tildado**: no se muestran partes; el error de "al menos una persona" sigue igual.
- **Una sola persona**: su parte es el total.
- **Monedas sin decimales o con tres** (ej. CLP, KWD): las partes respetan los decimales de la
  moneda de la Cuenta.
- **Importe con más decimales de los permitidos o mayor al máximo**: se muestra el error actual y
  no se muestran partes.
- **Edición de un gasto**: al abrir el formulario se muestran las partes actuales y se recalculan
  con cada cambio.
- **Participantes quitados de la Cuenta**: no aparecen en el formulario (comportamiento actual),
  así que no reciben parte.
- **Orden del centavo sobrante**: depende del orden de los participantes en la Cuenta, no del
  orden en que se tildan.
- **Texto largo o pantallas angostas**: el nombre y el importe no se superponen; el importe queda
  alineado y legible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Con un importe válido, el formulario de gasto (alta y edición) MUST mostrar al lado
  de cada persona tildada en "Lo comparten" su parte del gasto, en Web y en la App.
- **FR-002**: Las partes MUST recalcularse al cambiar el importe o las personas tildadas, sin
  guardar y sin consultar al servidor.
- **FR-003**: Las partes MUST calcularse con la misma regla que el servidor (Principio III): partes
  iguales en unidades mínimas de la moneda y el sobrante, de a una unidad, a los primeros
  participantes según el orden de la Cuenta. La suma MUST ser exactamente el importe.
- **FR-004**: Las partes mostradas MUST coincidir exactamente con las que devuelve el servidor
  para el gasto guardado.
- **FR-005**: Con un importe vacío o inválido, o sin personas tildadas, MUST NOT mostrarse partes.
- **FR-006**: Las personas destildadas MUST NOT mostrar importe, y su estado MUST entenderse sin
  depender del color.
- **FR-007**: Los importes MUST formatearse según el idioma de la persona y con los decimales de la
  moneda de la Cuenta.
- **FR-008**: El nombre accesible de cada persona MUST incluir su parte (lector de pantalla), y los
  cambios no deben mover el foco.
- **FR-009**: La división MUST seguir siendo en partes iguales; MUST NOT poder editarse por
  persona.
- **FR-010**: La feature MUST NOT cambiar el backend ni el formato de los datos.

### Key Entities

- **Parte de un gasto**: participante e importe en unidades mínimas; se calcula en el formulario
  con la misma regla que el servidor. No se guarda nada nuevo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los casos de prueba (importes y cantidades de personas variadas,
  monedas con 0, 2 y 3 decimales), las partes del formulario coinciden con las del servidor.
- **SC-002**: La suma de las partes mostradas es igual al importe en el 100 % de los casos.
- **SC-003**: Las partes se actualizan en menos de 100 ms después de cada cambio.
- **SC-004**: Las pruebas existentes del formulario de gastos siguen pasando.

## Assumptions

- La regla de división del servidor (feature 003) no cambia; el cálculo del formulario la replica
  y se prueba contra los mismos casos.
- El orden de los participantes de la Cuenta ya está disponible en el formulario.
- Las divisiones desiguales (montos o porcentajes por persona) quedan fuera de alcance.
