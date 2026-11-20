# Quickstart: validar Ingresos en la lista

## Preparación

```powershell
docker compose up -d --build
```

Una Cuenta abierta en ARS con Ana (vos), Beto y Caro, y un par de gastos en fechas distintas.

## Escenarios (Web y App)

1. **Menú "+"**: en la lista, "+" ofrece "Gasto" e "Ingreso"; "Gasto" abre el formulario de
   siempre.
2. **Alta**: "Ingreso" → "Beto le pagó a Ana", 5.000, hoy → vuelve a la lista y el ingreso
   aparece arriba con ícono, etiqueta "Ingreso" y texto "Beto le pagó a Ana".
3. **Saldos**: los saldos de Ana y Beto cambiaron en 5.000; la suma de saldos sigue en 0.
4. **Validaciones**: mismo participante en los dos lados, importe vacío o 0 → error, no guarda.
5. **Desde Saldos**: "Marcar como pagado" en una sugerencia → aparece también en la lista.
6. **Orden**: un ingreso con fecha de ayer queda entre los gastos de ayer y de hoy.
7. **Paginación**: con más de 20 movimientos, "Cargar más" trae los siguientes sin repetir.
8. **Totales**: si la lista muestra total de gastos, no cambia al agregar ingresos.
9. **Detalle**: tocar el ingreso → quién pagó, quién recibió, importe, fecha, "Registrado por …";
   no hay "Editar" y se ve la ayuda.
10. **Eliminar**: eliminar y confirmar → desaparece de la lista y de Saldos; los saldos vuelven.
11. **Cuenta Cerrada**: "+" no ofrece "Ingreso" y el detalle no permite eliminar.
12. **Eliminado por otro**: abrir un detalle que otro eliminó → "ya no existe".
13. **Doble toque**: tocar "Guardar" dos veces crea un solo ingreso.
14. **Idioma**: en inglés, "Income" y "Beto paid Ana".
