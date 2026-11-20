# Feature Specification: Importes grandes abreviados (K y M)

**Feature Branch**: `016-compact-amounts`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "formatear mejor los numeros con muchos ceros. usar un formato de M y K"
(con una captura del detalle de un gasto de 10.000.000,00 ARS en la App, donde el importe ocupa
todo el ancho y el título "Nada" y la fecha se cortan letra por letra).

## Clarifications

### Session 2026-11-20

- Q: ¿Desde qué importe se abrevia? → A: Desde 10.000 con "K" y desde 1.000.000 con "M"; por
  debajo de 10.000 se ve completo.
- Q: ¿Cómo se ve el importe principal en el detalle de un gasto? → A: Abreviado y grande, con el
  importe exacto debajo y más chico.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Leer importes grandes de un vistazo (Priority: P1)

Como miembro de una Cuenta con importes grandes (por ejemplo, en pesos), quiero ver
"10 M ARS" en lugar de "10.000.000,00 ARS" en listas, resúmenes y saldos, para leer los números
sin contar ceros y sin que la pantalla se desarme.

**Why this priority**: es el pedido principal. En monedas con mucha inflación los importes de
millones son comunes y hoy rompen el diseño en el teléfono (la captura).

**Independent Test**: crear una Cuenta en ARS con un gasto de 10.000.000 y otro de 25.500; ver
la lista de gastos, el saldo y el Inicio en Web y App: muestran "10 M ARS" y "25,5 K ARS".

**Acceptance Scenarios**:

1. **Given** un gasto de 10.000.000,00 ARS, **When** veo la lista de gastos, **Then** el importe
   se muestra "10 M ARS" (en inglés "ARS 10M" o el orden que use el idioma).
2. **Given** un gasto de 25.500,00 ARS, **When** veo la lista, **Then** se muestra "25,5 K ARS"
   (en inglés "25.5K").
3. **Given** un importe de 1.234.567,89, **When** se abrevia, **Then** se muestra con un decimal
   como máximo ("1,2 M") y sin ceros de más ("10 M", no "10,0 M").
4. **Given** un importe por debajo de 10.000, **When** lo veo, **Then** se
   muestra completo como hoy ("950,00 ARS").
5. **Given** un saldo negativo de −2.300.000, **When** lo veo, **Then** se abrevia igual ("Debés
   2,3 M ARS") y conserva su signo, color e indicador accesible.

---

### User Story 2 - Ver el importe exacto cuando lo necesito (Priority: P1)

Como miembro, quiero poder ver el importe exacto de cualquier importe abreviado, para controlar
cuentas y pagar el monto justo.

**Why this priority**: el Principio III exige importes exactos; abreviar solo puede ser una forma
de mostrar, nunca una pérdida de precisión.

**Independent Test**: en un importe abreviado, abrir el detalle o pedir el valor exacto (tocar o
pasar el mouse) y ver "10.000.000,00 ARS"; un lector de pantalla lee el importe exacto.

**Acceptance Scenarios**:

1. **Given** un importe abreviado en una lista, **When** abro el detalle del gasto, **Then** veo
   el importe principal abreviado ("10 M ARS") y, debajo y más chico, el exacto
   ("10.000.000,00 ARS").
2. **Given** un importe abreviado en la Web, **When** paso el mouse o hago foco, **Then** veo el
   importe exacto.
3. **Given** un importe abreviado, **When** lo lee un lector de pantalla, **Then** escucha el
   importe exacto, no la abreviatura.
4. **Given** un formulario de gasto, reembolso o el modal "Marcar como pagado", **When** escribo o
   reviso un importe, **Then** siempre se muestra exacto.
5. **Given** una exportación CSV/JSON, **When** la descargo, **Then** los importes son exactos.

---

### User Story 3 - Pantallas que no se desarman con importes largos (Priority: P2)

Como usuario de la App en un teléfono, quiero que el título, la fecha y el importe de un gasto se
lean bien aunque el importe sea largo, para no ver palabras cortadas letra por letra.

**Why this priority**: la captura muestra el título "Nada" partido en cuatro líneas. Abreviar lo
reduce, pero un importe exacto largo (detalle, formularios, monedas sin abreviar) no debe
desarmar la pantalla.

**Independent Test**: abrir en un teléfono de 360 dp de ancho el detalle de un gasto de
999.999.999,99 con un título largo y verificar que título, fecha e importe se leen sin cortes
dentro de una palabra.

**Acceptance Scenarios**:

1. **Given** un gasto con importe exacto largo, **When** abro su detalle en un teléfono angosto,
   **Then** el importe pasa a su propia línea antes de que el título o la fecha se corten dentro
   de una palabra.
2. **Given** el mismo gasto con letra grande del sistema (200 %), **When** abro el detalle,
   **Then** el contenido sigue legible (puede ocupar más líneas, pero ninguna palabra se corta
   letra por letra).

---

### Edge Cases

- 9.999,99 se muestra completo; 10.000 se muestra "10 K".
- Importes justo en el límite: 999.999 se redondea a "1 M", no a "1.000 K".
- Redondeo: la abreviatura redondea al decimal más cercano solo para mostrar; nunca se usa para
  calcular, totalizar ni prellenar formularios.
- Totales que superan 999.999.999 (por ejemplo, la suma de varios gastos): se muestran en M
  ("1.250 M"); no se usan "B" ni "mil millones", que cambian de significado entre idiomas.
- Monedas con 0 decimales (por ejemplo, CLP o JPY) y con 3 decimales: la abreviatura funciona
  igual.
- Cero y saldos "al día": se muestran como hoy.
- Importes negativos y positivos en saldos y sugerencias de pago conservan signo, color e
  indicador accesible (Principio VII).
- El importe en "Marcar como pagado" se prellena exacto aunque la sugerencia se muestre abreviada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Web y App MUST mostrar abreviados con "K" (miles) y "M" (millones) los importes a
  partir de 10.000 ("10 K") y con "M" desde 1.000.000 ("1 M"); por debajo de 10.000 se muestran
  completos como hoy. Aplica en listas de gastos, reembolsos, saldos, sugerencias de pago, tarjetas de Cuentas e Inicio.
- **FR-002**: Un importe abreviado MUST tener como máximo un decimal, sin ceros finales, con el
  separador decimal del idioma ("2,5 M" en español, "2.5M" en inglés), y la moneda en la posición
  que usa hoy cada idioma.
- **FR-003**: Las letras MUST ser "K" y "M" en español y en inglés. Por encima de 999 M se sigue
  usando "M" con separador de miles.
- **FR-004**: La abreviatura MUST ser solo de presentación: cálculos, totales, validaciones,
  formularios, prellenados, API y exportaciones MUST usar el importe exacto (Principio III).
- **FR-005**: Todo importe abreviado MUST exponer el importe exacto: como nombre accesible para
  lectores de pantalla en Web y App, y como texto emergente al pasar el mouse o hacer foco en la
  Web.
- **FR-006**: El detalle de un gasto y de un reembolso MUST mostrar el importe principal
  abreviado (si corresponde) y, debajo y más chico, el importe exacto, sin pasos extra.
- **FR-007**: Los campos donde se escribe un importe y la vista previa de la división (feature
  013) MUST mostrar importes exactos.
- **FR-008**: Los importes abreviados MUST conservar el signo, el color y el indicador accesible
  de saldo actuales (Principio VII).
- **FR-009**: En el detalle de un gasto de la App, título, fecha e importe MUST acomodarse sin
  cortar palabras letra por letra en pantallas de 360 dp de ancho y con texto al 200 %.
- **FR-010**: Web y App MUST abreviar con las mismas reglas y mostrar el mismo texto para el mismo
  importe, moneda e idioma (Principio I).

### Key Entities

- **Importe mostrado**: la forma de presentar un importe exacto (decimal, moneda e idioma) en
  forma completa o abreviada. No se guarda; no cambia ningún dato.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: un importe de 10.000.000,00 ARS ocupa como máximo 8 caracteres visibles en listas
  ("10 M ARS"), frente a los 17 actuales.
- **SC-002**: en un teléfono de 360 dp, el detalle de un gasto de 999.999.999,99 con título de 30
  caracteres no corta ninguna palabra dentro de sí misma.
- **SC-003**: el 100 % de los importes abreviados tiene el importe exacto disponible para lectores
  de pantalla (verificado con tests automáticos en Web y App).
- **SC-004**: los totales, saldos y exportaciones son idénticos al centavo antes y después de la
  feature para el mismo conjunto de datos.
- **SC-005**: para el mismo importe, moneda e idioma, Web y App muestran el mismo texto abreviado
  (verificado con los mismos casos de prueba en ambos).

## Assumptions

- "K" y "M" se usan igual en español e inglés, como pidió el usuario, aunque en español formal
  se escriba "mil"; en Argentina "10K" y "10 M" son de uso común.
- No se agrega una preferencia en el Perfil para desactivar la abreviatura; el importe exacto
  siempre está a un toque o en el detalle.
- Las exportaciones y los emails (si muestran importes) quedan exactos.
- Los importes llegan como texto decimal exacto (Principio III) y el máximo de un gasto es
  999.999.999; las sumas pueden superarlo.

## Out of Scope

- Convertir la Web y la App en PWA y el link de invitación con `localhost`: se tratan aparte.
- Cambiar cómo se escriben los importes en los formularios.
