# Actualizaciones

Bruma usa el updater oficial de Tauri 2 con un manifiesto JSON estático publicado en GitHub Releases.

## Claves de firma

La clave pública está en `src-tauri/tauri.conf.json` dentro de `plugins.updater.pubkey`. La clave privada se mantiene fuera del repositorio. Para generar un par nuevo:

```bash
pnpm tauri signer generate -w ~/.tauri/bruma.key
```

Si se rota la clave, los usuarios que ya tengan instalada una versión con la clave pública anterior solo podrán actualizar a bundles firmados con la clave privada correspondiente.

## Secrets de CI

Configurar en GitHub Actions:

- `TAURI_SIGNING_PRIVATE_KEY`: contenido o ruta de la clave privada del updater.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: contraseña si la clave fue protegida con una.

## Publicación

1. Actualizar `package.json` y ejecutar `pnpm sync:version`.
2. Crear el tag `vX.Y.Z`.
3. Ejecutar el workflow `Release`.
4. Verificar que la release contiene `update.json` y las firmas `.sig` de los
   cuatro artifacts de updater.

El manifest se genera con:

```bash
node scripts/generate-update-json.mjs release-assets release-assets/update.json
```

El JSON incluye `version`, `notes`, `pub_date` y `platforms` con `url` y
`signature` para macOS ARM64, Linux x64, Windows x64 y Windows ARM64. Si falta
uno de esos assets o su firma, el generador falla.

La primera release con la clave rotada debe advertir que las instalaciones
1.7.x necesitan reinstalación manual porque contienen la clave pública anterior.
