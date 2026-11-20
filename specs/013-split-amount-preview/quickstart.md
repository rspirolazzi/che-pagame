# Quickstart: validar la división en el formulario

## Preparación

```powershell
docker compose up -d --build
```

Una Cuenta en ARS con Ana, Beto, Caro y Dani (en ese orden), y otra en CLP.

## Escenarios (Web y App)

1. **Partes**: gasto nuevo de 100 con Ana, Beto y Caro → 33,34 / 33,33 / 33,33.
2. **Destildar**: destildar Caro → Ana 50,00 y Beto 50,00; Caro muestra "No participa".
3. **Cambiar importe**: 101 → 50,50 / 50,50.
4. **Orden de la Cuenta**: tildar primero Caro y después Ana con 100 entre 3 (Ana, Beto, Caro) →
   el centavo extra sigue yendo a Ana.
5. **Sin importe o inválido**: vaciar el importe o escribir "abc" → no hay partes ni ceros.
6. **Nadie tildado**: no hay partes; al guardar sale el error de siempre.
7. **Guardar y comparar**: guardar 100 entre 3 y abrir el detalle → las mismas partes.
8. **Edición**: editar un gasto → partes actuales visibles y se recalculan al cambiar.
9. **CLP**: 100 entre 3 → 34 / 33 / 33, sin decimales.
10. **Lector de pantalla**: TalkBack/NVDA lee "Ana, 33,34 ARS" en el checkbox.
11. **Pantalla angosta**: nombre largo + importe largo en 360 dp → no se superponen.
12. **Inglés**: "33.34" con punto decimal.
