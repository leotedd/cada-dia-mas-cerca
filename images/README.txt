DISTRIBUCIÓN ACTUAL (actualizada) — qué foto usa cada día
==========================================================

4 sept (día 1, faltan 7)  -> foto dia uno nueva.jpeg
5 sept (día 2, faltan 6)  -> foto dia 2 nueva.jpeg
6 sept (día 3, faltan 5)  -> foto 3 nueva.jpeg
7 sept (día 4, faltan 4)  -> juntoo a foto 4 .jpeg
8 sept (día 5, faltan 3)  -> segunda imagen.jpeg
9 sept (día 6, faltan 2)  -> junto a foto dia 6 .jpeg
10 sept (día 7, faltan 1) -> tercera imagen.jpeg
11 sept (encuentro)       -> cuarta imagen.jpeg

Sin usar por ahora (no se borraron, quedan disponibles para el futuro):
  - primera imagen.jpeg
  - junto a foto 3 nueva.jpeg
  - dia-1.jpg ... dia-7.jpg, encuentro.jpg (copias de la distribución anterior)

IMPORTANTE: varios nombres de archivo tienen espacios (ej. "foto dia uno
nueva.jpeg", "juntoo a foto 4 .jpeg"). NO los renombres. En js/app.js las
rutas se escriben con %20 en vez de espacio (ej. "images/foto%20dia%20uno%20nueva.jpeg")
porque así se escribe correctamente una URL con espacios — el archivo en
disco sigue llamándose igual, con espacio normal.

Si agregas más fotos nuevas o quieres reordenar cuál va con cada día,
edita únicamente el arreglo CONFIG.days (y CONFIG.meeting.photo) dentro
de js/app.js — cada entrada tiene su "image" y su "phrase".
