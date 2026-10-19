# Nexora Shop

Repositorio privado para el laboratorio OWASP API Security Top 10:2023.

## Estado
Repositorio creado. **Código de la fase 2 aún pendiente de incorporar.**

La aplicación se distribuirá con Docker Compose. No publicar el laboratorio en internet sin auditoría y aislamiento.

## Incorporar el proyecto
Extraer los archivos del paquete `nexora-shop-github-ready.zip` en la raíz de este repositorio y enviarlos a `main`. No copiar la carpeta contenedora; `compose.yaml`, `apps/`, `database/` y `.github/` deben estar en la raíz.

## Validación
GitHub Actions ejecutará compilación de API y frontend, pruebas SQLite, comprobación de Compose y smoke tests HTTP. El workflow **no está validado hasta que el código completo esté subido y haya una ejecución con resultado exitoso**.
