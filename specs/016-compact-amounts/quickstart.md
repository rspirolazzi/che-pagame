# Quickstart: validar importes abreviados

## Preparación

```powershell
docker compose up -d --build
```

Una Cuenta en ARS con gastos de 9.500, 25.500, 1.234.567,89 y 10.000.000, y un saldo negativo
de al menos 2.300.000. Otra en CLP.

## Escenarios (Web y App)

1. **Lista**: 9.500,00 ARS completo; "25,5 K ARS"; "1,2 M ARS"; "10 M ARS".
2. **Inicio y Cuentas**: el saldo de la Cuenta aparece abreviado con signo, color e indicador.
3. **Saldos y sugerencias**: "Debés 2,3 M ARS"; "Marcar como pagado" prellena 2.300.000,00.
4. **Exacto en la Web**: pasar el mouse por un importe abreviado → se ve el exacto.
5. **Lector de pantalla**: NVDA/TalkBack leen el exacto, no "10 M".
6. **Detalle**: el gasto de 10.000.000 muestra "10 M ARS" grande y "10.000.000,00 ARS" debajo;
   las partes de cada uno exactas.
7. **Layout de la captura**: en un teléfono angosto, el detalle de un gasto de 999.999.999,99 con
   título "Nada" → título, fecha e importe se leen sin cortes letra por letra; repetir con texto
   del sistema al 200 %.
8. **Formularios**: editar el gasto de 10.000.000 → el campo muestra el importe exacto.
9. **Exportación**: exportar CSV → importes exactos.
10. **Inglés**: "ARS 25.5K" y "ARS 10M".
11. **CLP**: 25.500 CLP → "25,5 K CLP" (sin decimales en el exacto).
12. **Totales grandes**: un saldo de 1.250.000.000 → "1.250 M".
