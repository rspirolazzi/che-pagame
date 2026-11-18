# Feature Specification: Ingresos en la lista de gastos

**Feature Branch**: `012-account-income-entries`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Agregar a las cuentas la posibilidad de agregar un 'gasto' que sea
del tipo 'Ingreso', donde un usuario pueda cargar que recibió dinero de X participante."

## Clarifications

### Session 2026-11-18

- Q: ¿Qué es un "Ingreso"? → A: Un pago entre miembros ("X le pagó a Y"), que baja la deuda.
  Es el reembolso que ya existe en Saldos (feature 004); no es plata nueva que entra al grupo.
- Q: ¿Cómo se carga y dónde se ve? → A: El botón "+" de la lista de gastos ofrece "Gasto" o
  "Ingreso". El ingreso aparece en la lista mezclado con los gastos por fecha, con un ícono y un
  color distintos. La matemática de saldos no cambia.
- Q: ¿Quién puede registrarlo? → A: Cualquier miembro de la Cuenta, como los reembolsos de hoy;
  queda auditado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar que recibí plata de alguien (Priority: P1)

Como miembro de una Cuenta, cuando alguien me devuelve plata (o le devuelvo a alguien), quiero
cargarlo desde la lista de gastos, igual de rápido que un gasto, para que los saldos queden al
día sin ir a la pestaña Saldos.

**Why this priority**: es el pedido; hoy el pago entre miembros existe pero queda escondido en
Saldos y las personas lo buscan donde cargan todo lo demás.

**Independent Test**: en una Cuenta con deudas, tocar "+" → "Ingreso", cargar "Ana le pagó $5.000
a Beto" y comprobar que aparece en la lista y que los saldos de Ana y Beto cambian en $5.000.

**Acceptance Scenarios**:

1. **Given** la lista de gastos de una Cuenta abierta, **When** el miembro toca "+", **Then** puede
   elegir "Gasto" (el formulario de siempre) o "Ingreso".
2. **Given** el formulario de Ingreso, **When** se abre, **Then** pide quién pagó, quién recibió
   (por defecto, el participante del usuario), importe en la moneda de la Cuenta y fecha (por
   defecto, hoy).
3. **Given** datos válidos, **When** se guarda, **Then** se registra un reembolso igual al de la
   feature 004 (mismas reglas, auditado) y los saldos se actualizan.
4. **Given** el mismo participante como quien paga y quien recibe, o un importe vacío o ≤ 0,
   **When** se intenta guardar, **Then** el formulario muestra el error y no guarda.

---

### User Story 2 - Ver ingresos y gastos juntos (Priority: P1)

Como miembro, quiero ver en la lista de la Cuenta los gastos y los ingresos en orden de fecha,
distinguiendo unos de otros a simple vista, para entender la historia completa de la Cuenta.

**Why this priority**: sin verlo en la lista, cargarlo desde ahí confunde ("¿se guardó?").

**Independent Test**: con gastos e ingresos cargados en distintas fechas, abrir la lista y
comprobar el orden y que cada ingreso se ve como tal, en Web y en la App.

**Acceptance Scenarios**:

1. **Given** gastos e ingresos en la Cuenta, **When** se abre la lista, **Then** aparecen juntos,
   agrupados por fecha como hoy, del más reciente al más antiguo.
2. **Given** un ingreso en la lista, **When** se mira, **Then** muestra un ícono y un color propios
   (no solo color), el texto "Ana le pagó a Beto" y el importe, y no se confunde con un gasto.
3. **Given** un ingreso registrado desde Saldos ("Marcar como pagado"), **When** se abre la lista
   de gastos, **Then** también aparece ahí: es el mismo movimiento.
4. **Given** los totales que hoy muestra la lista (si los hay), **When** hay ingresos, **Then** los
   ingresos no se suman como gasto del grupo.

---

### User Story 3 - Ver el detalle y eliminar un ingreso (Priority: P2)

Como miembro, quiero abrir un ingreso para ver sus datos y eliminarlo si se cargó mal.

**Why this priority**: completa el ciclo; los reembolsos no se editan (feature 004), un error se
corrige eliminando y cargando de nuevo.

**Independent Test**: abrir un ingreso, eliminarlo tras confirmar y comprobar que desaparece de la
lista y de Saldos, y que los saldos vuelven a su valor anterior.

**Acceptance Scenarios**:

1. **Given** un ingreso en la lista, **When** se toca, **Then** se ve quién pagó, quién recibió,
   importe, fecha, quién lo registró y cuándo.
2. **Given** el detalle, **When** se elimina y se confirma, **Then** se da de baja (lógica,
   auditada) y desaparece de la lista de gastos y de Saldos.
3. **Given** el detalle, **When** se busca editar, **Then** no hay opción de editar, con una ayuda
   que explica eliminar y volver a cargar.

---

### Edge Cases

- **Cuenta Cerrada**: no se ofrece "Ingreso" en el botón "+" ni eliminar ingresos (feature 004,
  FR-019).
- **Participante quitado**: no puede elegirse como quien paga ni quien recibe; sus ingresos
  anteriores siguen visibles en la lista como hoy se muestran en Saldos.
- **Ingreso mayor a la deuda**: se permite (feature 004, FR-014); el saldo puede invertirse.
- **Doble toque o reintento**: no crea el ingreso dos veces (feature 004, FR-018).
- **Ingreso eliminado por otro miembro mientras se mira el detalle**: se informa que ya no existe,
  como con los gastos.
- **Filtros o búsqueda de la lista** (si existen): los ingresos se buscan por los nombres de los
  participantes.

## Requirements *(mandatory)*

### Functional Requirements

**Alta**

- **FR-001**: El botón "+" de la lista de gastos MUST ofrecer "Gasto" e "Ingreso", en Web y en la
  App.
- **FR-002**: El formulario de Ingreso MUST pedir quién pagó, quién recibió, importe y fecha, con
  los valores por defecto de la User Story 1, y MUST validar con las mismas reglas del reembolso
  manual de la feature 004 (FR-013, FR-014, FR-022).
- **FR-003**: Guardar un Ingreso MUST registrar un reembolso de la feature 004, sin un tipo de
  dato nuevo ni cambios en el cálculo de saldos (Principio VIII).
- **FR-004**: Cualquier miembro de la Cuenta MUST poder registrar un Ingreso entre cualesquiera
  dos participantes activos.

**Lista**

- **FR-005**: La lista de la Cuenta MUST mostrar gastos e ingresos activos juntos, por fecha
  descendente y con la agrupación por fecha existente.
- **FR-006**: Cada ingreso MUST distinguirse de un gasto con ícono, color y texto ("X le pagó a
  Y"); MUST NOT depender solo del color (accesibilidad).
- **FR-007**: Los ingresos MUST NOT contarse como gasto en ningún total o resumen de gastos.
- **FR-008**: Los ingresos registrados desde Saldos y desde la lista MUST ser los mismos
  movimientos y verse en ambos lugares.

**Detalle y baja**

- **FR-009**: El detalle de un ingreso MUST mostrar sus datos y quién lo registró y cuándo.
- **FR-010**: Eliminar un ingreso MUST pedir confirmación y aplicar la baja lógica auditada de la
  feature 004 (FR-016, FR-021); los ingresos MUST NOT editarse (FR-017).

**General**

- **FR-011**: Las reglas de Cuenta Cerrada, participantes quitados y reintentos de la feature 004
  MUST aplicarse igual.
- **FR-012**: Los permisos MUST validarse en el servidor, como en la feature 004 (FR-020).
- **FR-013**: Todos los textos nuevos MUST estar en español y en inglés; los importes MUST
  formatearse según el idioma, en la moneda de la Cuenta.

### Key Entities

- **Ingreso**: nombre en la interfaz para un reembolso de la feature 004 (quién paga, quién
  recibe, importe, fecha, origen, auditoría). No hay entidad nueva.
- **Movimiento de la lista**: un gasto o un ingreso, ordenados juntos por fecha.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un miembro registra un ingreso desde la lista en menos de 20 segundos y 4 toques o
  menos después de abrir el formulario.
- **SC-002**: El 100 % de los ingresos, se carguen desde la lista o desde Saldos, aparece en ambos
  lugares.
- **SC-003**: Después de registrar o eliminar ingresos, la suma de los saldos de la Cuenta sigue
  siendo exactamente cero.
- **SC-004**: En una prueba con personas, el 90 % distingue sin ayuda cuál ítem de la lista es un
  gasto y cuál un ingreso.
- **SC-005**: Las pruebas existentes de saldos y reembolsos siguen pasando sin cambios.

## Assumptions

- "Ingreso" es solo el nombre que ve la persona; internamente es el reembolso existente.
- La pestaña Saldos y "Marcar como pagado" siguen igual.
- Un ingreso de plata nueva al grupo (devolución, premio, seña repartida entre varios) queda fuera
  de alcance; podría ser una feature futura.
- La exportación de datos (feature 005) ya incluye los reembolsos y no cambia.
