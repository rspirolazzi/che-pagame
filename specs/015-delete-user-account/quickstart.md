# Quickstart: Eliminar mi cuenta de usuario

## Prerrequisitos

- Stack local levantado (backend, MongoDB, Web) y la App en un dev build, como en el README.
- Tres usuarios de prueba creados en el entorno local (no usar cuentas reales): **Ana**, **Beto**
  y **Caro**. Beto entra con contraseña y Caro solo con Google.
- Una Cuenta "Viaje" con Ana (Owner) y Beto, con gastos pagados por los dos; una Cuenta "Solo
  Beto" donde Beto es el único miembro registrado (con participantes de texto libre); y una Cuenta
  "Caro y Ana" creada por Caro.

## Escenarios

1. **Pantalla de eliminación** (Web): Beto → Perfil → "Eliminar mi cuenta". Ve qué se borra y qué
   se conserva, el link a "Exportar mis datos" y el botón para recibir el código.
2. **Código incorrecto**: pide el código, ingresa uno equivocado → error "código inválido", la
   cuenta sigue igual. Cinco errores agotan el código; pedir otro funciona.
3. **Borrado**: ingresa el código correcto → vuelve al login con "Tu cuenta fue eliminada".
4. **Sesiones**: Beto tenía la App abierta con sesión → la próxima acción lo manda al login.
5. **Cuenta compartida**: Ana abre "Viaje" → los gastos de Beto siguen, con "Usuario eliminado"
   como pagador, y los saldos son los mismos que antes (anotarlos antes del paso 3).
6. **Idioma**: Ana cambia la Web a inglés → ve "Deleted user".
7. **Cuenta propia**: "Solo Beto" ya no existe; su link de invitación dice que no es válida.
8. **Owner**: Caro borra su usuario desde la App (Perfil → "Eliminar mi cuenta") → en "Caro y Ana"
   Ana queda como Owner (puede cerrar la Cuenta o regenerar la invitación).
9. **Usuario de Google**: Caro recibió el código en su email de Google sin tener contraseña.
10. **Volver a registrarse**: registrarse otra vez con el email de Beto → usuario nuevo, sin
    Cuentas; "Viaje" sigue mostrando "Usuario eliminado".
11. **Sin rastros**: buscar el email y el nombre de perfil de Beto en la base local (por ejemplo,
    con `mongosh` y un `find` por el texto en `users`, `audit_logs`, `accounts`,
    `verification_codes` y `pending_registrations`) → ningún resultado.
12. **Página pública**: sin sesión, abrir `/delete-account` en la computadora y en el teléfono →
    se lee bien en español e inglés; el botón lleva al login y, después de entrar, a
    `/profile/delete`.
13. **Privacidad**: `/privacy` tiene "Eliminar tus datos" con el link y la fecha actualizada.
14. **Logs**: en los logs del backend durante el escenario 3 no aparece el email ni el nombre de
    Beto.
15. **Quality gates**: `ruff` y `pytest` en `backend/`; `npm run lint`, `tsc` y
    `npm test` en `web/` y `mobile/`.
