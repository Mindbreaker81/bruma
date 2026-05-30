# Update System Troubleshooting Report

## Contexto
Implementación del sistema de actualización híbrido para Bruma con Tauri updater plugin y GitHub Actions workflow.

## Problemas Encontrados

### 1. Playwright Test Failures
**Problema:** Los tests e2e fallaban por selectores demasiado amplios que coincidían con múltiples elementos.

**Solución:**
- `tests/smoke.spec.ts`: 
  - Agregado `.first()` al selector del botón de cambio de idioma
  - Cambiado selector de botón de búsqueda a coincidencia parcial
  - Cambiado selector de botón "New document" a coincidencia parcial con `aria-label*`

**Resultado:** Todos los tests e2e pasan localmente.

### 2. Code Formatting Issues
**Problema:** Prettier detectaba violaciones de estilo en `tests/smoke.spec.ts`.

**Solución:** Ejecutado `pnpm exec prettier --write tests/smoke.spec.ts`

**Resultado:** Formato corregido.

### 3. Tauri Updater Signing Key Issues
**Problema:** El workflow de release fallaba al intentar firmar los artifacts del updater con el error:
```
failed to decode secret key: incorrect updater private key password: failed to fill whole buffer
```

**Intentos de solución:**
1. Regeneración de claves minisign con password vacío
2. Actualización de `TAURI_SIGNING_PRIVATE_KEY` en GitHub secrets
3. Agregado de variables de entorno `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` al step de build macOS en `.github/workflows/release.yml`
4. Múltiples regeneraciones de claves

**Resultado:** El problema persistía. La clave privada base64 no estaba siendo reconocida correctamente por Tauri.

### 4. Solución Temporal: Deshabilitar Updater Artifacts
**Problema:** Como la firma del updater no funcionaba, se decidió deshabilitar temporalmente la generación de artifacts del updater.

**Cambios realizados:**
1. `src-tauri/tauri.conf.json`:
   - Cambiado `createUpdaterArtifacts: true` a `false`

2. `.github/workflows/release.yml`:
   - Hecho opcional la recolección de archivos `.app.tar.gz` para macOS
   - Hecho opcional la recolección de archivos `.sig` para Linux AppImage
   - Esto permite que el workflow continúe aunque no existan los archivos del updater

**Resultado:** Los builds de macOS, Windows y Linux completan exitosamente.

### 5. Current Issue: Generate update.json Failure
**Problema:** El workflow falla en el paso "Generate update.json" del job "Publish update manifest".

**Causa probable:** El script `scripts/generate-update-json.mjs` espera los archivos de firma (.sig) y los archivos del updater (.app.tar.gz) que no se generaron porque `createUpdaterArtifacts: false`.

**Estado actual:**
- ✓ Builds de todas las plataformas completan
- ✓ Assets principales (.dmg, .msi, .AppImage) se generan
- ✗ Generación de update.json falla

## Archivos Modificados

### `tests/smoke.spec.ts`
- Selectores de Playwright actualizados para evitar strict mode violations

### `src-tauri/tauri.conf.json`
- `createUpdaterArtifacts`: `true` → `false`
- `pubkey` actualizado múltiples veces (último: `RWR9m3fYz9Xxl+ZnM/3r44noiHVDRxFdojdf5MQZtt1iPnYWYjPoW/jm`)

### `.github/workflows/release.yml`
- Agregadas variables de entorno de firma al step macOS
- Hecha opcional la recolección de artifacts del updater

### `.github/workflows/ci.yml`
- Agregadas variables de entorno `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` al job tauri

## Próximos Pasos Sugeridos

### Opción 1: Solucionar la firma del updater
1. Investigar por qué Tauri no puede decodificar la clave privada
2. Verificar el formato exacto que espera Tauri para la clave
3. Posiblemente usar el comando `tauri signer generate` en lugar de `minisign` directamente
4. Re-habilitar `createUpdaterArtifacts: true`
5. Modificar `generate-update-json.mjs` para trabajar sin archivos de firma temporalmente

### Opción 2: Implementar sistema de actualización sin firma
1. Mantener `createUpdaterArtifacts: false`
2. Modificar `generate-update-json.mjs` para no requerir archivos .sig
3. El updater funcionará pero sin verificación de firma (menos seguro)
4. Considerar si esto es aceptable para el caso de uso

### Opción 3: Usar un método de firma alternativo
1. Investigar otros métodos de firma para Tauri updater
2. Posiblemente usar GitHub Actions para firmar después del build
3. Revisar documentación de Tauri sobre alternativas de firma

## Claves Generadas (última)
- **Public key:** `RWR9m3fYz9Xxl+ZnM/3r44noiHVDRxFdojdf5MQZtt1iPnYWYjPoW/jm`
- **Private key (base64):** `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5TjZ0OS82VHBjT1I2VTZ3aXdGZTBqZThjR3g4SmNOQWYwNFVkYktqNTZLa0FBQUFDQUFBQUFBQUFBRUFBQUFBQVFVaW1HZk1YdmlJY1g5dVJmOWhSSmloTjVadGY4em5ud0o3cXg1cGdCVjIrSUNBYkxoNVR0RlI1cm1oc3Q0aHBKOEUzWEsrNVVXVjV6QzJ4ZnhnV0U3RFZIU0k1SThnRUV6K0NQM0hnV2hXVWk2T3JPTFcw`
- **Password:** (vacío)

## GitHub Secrets Configurados
- `TAURI_SIGNING_PRIVATE_KEY`: (configurado con el valor base64 arriba)
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: (no existe/debe estar vacío)

## Notas
- El sistema de actualización híbrido está implementado en el código (frontend, backend, i18n)
- Los tests unitarios y e2e pasan
- El CI workflow pasa
- El Release workflow falla solo en la generación del update.json
- Los assets principales de la aplicación se generan correctamente
