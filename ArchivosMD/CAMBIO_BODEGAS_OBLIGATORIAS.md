# Cambio del backend: datos de bodega obligatorios

> Fecha: 19-11-2026 · Servidor: `http://192.168.20.49:8000` · Ya está publicado y probado.

## `POST /bodegas`: ahora todos los datos son obligatorios

| Campo | Largo máximo |
|---|---|
| `nombre` | 100 (único) |
| `codigo` | 30 (único, se guarda en MAYÚSCULAS) |
| `direccion` | 200 |
| `ciudad` | 100 |
| `departamento` | 100 |
| `telefono` | 30 |
| `correo` | 100 (formato de correo válido) |
| `recibe_nombre` | 100 |
| `recibe_documento` | 30 |
| `recibe_cargo` | 100 |
| `recibe_telefono` | 30 |

Siguen siendo opcionales:
- `bodeguero_id`: solo lo usa el admin. Si crea la bodega un bodeguero, él queda como dueño.
- `estado`: por defecto `true`.

Si falta alguno → **422** con un mensaje por campo:
```json
{
  "detail": "codigo: es obligatorio; direccion: es obligatorio; ...",
  "errores": {"codigo": "es obligatorio", "direccion": "es obligatorio", "ciudad": "es obligatorio"}
}
```

## `PUT /bodegas/{id}`: se envía solo lo que cambia, pero nada puede quedar vacío
- Un campo que no se envía, o que llega en `null`, no se cambia (igual que antes).
- **Ya no se puede borrar un dato con `""`.** Un vacío (o solo espacios) da 422:
  `{"detail": "telefono: no puede estar vacío", "errores": {"telefono": "no puede estar vacío"}}`.

## Mensaje nuevo en toda la API
Cuando un texto obligatorio llega vacío (`""` o solo espacios), el 422 ahora dice **`no puede estar vacío`**, ya no `es demasiado corto`.
Esto aplica a todos los módulos: por ejemplo `POST /tipos` con `{"nombre": "  "}` → `nombre: no puede estar vacío`.
`es demasiado corto` queda solo para los campos con un mínimo mayor, como la contraseña de 8 caracteres.

## Bodegas que ya existen
Las bodegas creadas antes de este cambio pueden tener datos vacíos (`null`). Se siguen viendo y listando normal.
Para completarlas, usen `PUT /bodegas/{id}` con los datos que falten.
