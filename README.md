# ContraDrivers — GitHub Pages Ready v0.5.1

Esta carpeta está preparada para publicarse como sitio estático de GitHub Pages. Contiene la presentación del proyecto, la guía interactiva de botones, imágenes de las pistas y el ZIP del proyecto de escritorio.

## Publicar

1. Crea un repositorio nuevo en GitHub.
2. Sube **el contenido de esta carpeta** a la rama `main`.
3. En **Settings → Pages**, selecciona **GitHub Actions** como origen de publicación si GitHub todavía no lo ha activado para el repositorio.
4. Abre la pestaña **Actions** y espera a que termine `Deploy ContraDrivers to GitHub Pages`.
5. La URL publicada aparecerá en el deployment `github-pages` y en Settings → Pages.

El workflow usa las acciones oficiales actuales `actions/checkout@v6`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4` y `actions/deploy-pages@v4`.

## Importante

GitHub Pages no ejecuta el juego Ursina/Python. El sitio permite **descargar** `downloads/ContraDrivers_v0.5.1_Desktop_Source.zip`; el juego se ejecuta localmente con Python.
