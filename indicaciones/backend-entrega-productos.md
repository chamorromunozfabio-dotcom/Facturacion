# Backend – Entrega de Productos

> **Estado vigente (20-11-2026):** este era el instructivo inicial. Ya no hay módulo “Órdenes”: la orden es la factura. Están publicados `/facturas` con sus acciones y PDF, y `/estadisticas/resumen` con el permiso `estadisticas_view`. El front llama a `/api` mediante el proxy de Vite, así que **no hace falta ampliar el CORS**. Fuentes confiables: `indicaciones/info-proyecto.md` y `ArchivosMD/RESPUESTA_ESTADISTICAS.md`.

**Stack:** FastAPI + SQLAlchemy + MySQL (Laragon / phpMyAdmin)
**Rol:** Es el "cerebro". Guarda los datos, aplica las reglas, valida el login y los permisos, y entrega todo al frontend por medio de una API REST en formato JSON.

**Fecha de entrega:** lunes 23-11-2026

---

## 1. Qué hace el backend (y qué recibe el frontend de él)

| El backend hace | El frontend recibe |
|---|---|
| Conectarse a la base de datos | Nunca toca la BD, solo pide datos por la API |
| Crear, leer, editar y eliminar registros (CRUD) | Endpoints REST con respuestas JSON |
| Validar login y generar el token JWT | Un token que guarda y envía en cada petición |
| Controlar roles y permisos | Respuestas `401` (sin sesión) o `403` (sin permiso) |
| Calcular órdenes y facturas | Datos ya calculados, listos para mostrar |
| Documentar la API automáticamente | Página `/docs` para probar cada endpoint |

---

## 2. Paso a paso de lo que voy a hacer

### Paso 1 – Preparar el entorno
```bash
mkdir entrega-productos-back
cd entrega-productos-back
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv pydantic[email] python-jose passlib[bcrypt] python-multipart
pip freeze > requirements.txt
```

### Paso 2 – Base de datos
1. Iniciar Laragon (Apache + MySQL).
2. Abrir phpMyAdmin e importar el script `.sql` que da el líder.
3. Revisar las tablas y relaciones (tipos, bodegas, usuarios, permisos).

### Paso 3 – Estructura del proyecto
```
app/
  main.py           # arranque de FastAPI y CORS
  database.py       # conexión a MySQL
  models/           # tablas (SQLAlchemy)
  schemas/          # validaciones (Pydantic)
  routers/          # endpoints por módulo
  services/         # lógica de negocio
  core/             # seguridad, JWT, configuración
.env
```

### Paso 4 – Conexión a MySQL
Archivo `.env`:
```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/nombre_bd
SECRET_KEY=cambia_esto
```

Archivo `app/database.py`:
```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Paso 5 – Arranque y CORS
Archivo `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Entrega de Productos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # el front usa el proxy /api: no hace falta ampliar la lista
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Ejecutar:
```bash
uvicorn app.main:app --reload
```
Probar en: `http://localhost:8000/docs`

### Paso 6 – Primer CRUD: Tipos (sirve de plantilla)
Por cada módulo se crean 3 archivos:
1. `models/tipo.py` → la tabla.
2. `schemas/tipo.py` → qué datos se aceptan y se devuelven.
3. `routers/tipos.py` → los 5 endpoints.

Cuando Tipos funcione, se **copia el mismo patrón** para Bodegas, Usuarios y Permisos.

### Paso 7 – Login y seguridad
- Contraseñas guardadas con hash (bcrypt), nunca en texto plano.
- `POST /login` valida usuario y contraseña y devuelve un token JWT.
- Una dependencia revisa el token y el rol antes de ejecutar cada endpoint protegido.

### Paso 8 – Facturas y estadísticas (fase 2)
- No hay módulo “Órdenes”: la orden es la factura, un solo recurso `/facturas`.
- Estados `emitida → entregada → firmada → recibida`, o `rechazada` con motivo.
- Aceptar guarda la firma PNG en data URL (máx. 500 KB) que envía el frontend; recibir cierra el ciclo; PDF generado por el backend.
- Factura con encabezado, emisor, adquiriente, detalle, totales, pie de página, validación electrónica y datos del software.
- `GET /estadisticas/resumen?desde=&hasta=` con permiso `estadisticas_view`: admin global, bodeguero solo lo que creó, cliente lo suyo sin `emitida`.

### Paso 9 – Pruebas y entrega
- Probar cada endpoint en `/docs`.
- Corregir errores con el frontend.
- Escribir el README con cómo ejecutar el proyecto.

---

## 3. Endpoints que el frontend va a consumir

```
POST   /login

GET    /tipos            Lista (con paginación y búsqueda)
GET    /tipos/{id}       Un registro
POST   /tipos            Crear
PUT    /tipos/{id}       Editar
DELETE /tipos/{id}       Eliminar

(El mismo patrón para /bodegas, /usuarios y /permisos)
```

### Formato de respuestas (acordar con el frontend)

Éxito en lista:
```json
{
  "data": [ { "id": 1, "nombre": "Alimentos" } ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

Error:
```json
{ "detail": "Mensaje del error" }
```

| Código | Significado |
|---|---|
| 200 / 201 | Todo bien / creado |
| 400 / 422 | Datos inválidos |
| 401 | No ha iniciado sesión |
| 403 | No tiene permiso |
| 404 | No existe el registro |

---

## 4. Plan de trabajo (5 días) sincronizado con el frontend

| Día | Backend (yo) | Frontend (compañero) |
|---|---|---|
| 1 | Entorno, BD importada, conexión, CORS | Proyecto Vue, rutas, layout, axios |
| 2 | Login + JWT + roles | Pantalla de login + guardas |
| 3 | CRUD Tipos y Bodegas | Componentes reutilizables + vistas Tipos y Bodegas |
| 4 | CRUD Usuarios y Permisos, órdenes | Vistas Usuarios y Permisos, órdenes y firma |
| 5 | Factura, pruebas, README | Factura, integración final |

---

## 5. Lo que necesito del frontend

- Confirmar el formato de las respuestas y la paginación.
- Avisarme si necesita un campo o endpoint adicional.
- Probar cada endpoint apenas lo publique y reportarme errores.
- Confirmar con el líder el formato de la firma (imagen dibujada en base64, por ejemplo).

## 6. Lo que le entrego al frontend en cada CRUD

1. Los campos de la tabla y cuáles son obligatorios.
2. El endpoint funcionando en `http://localhost:8000/docs`.
3. Un ejemplo de JSON de entrada y de salida.

## 7. Checklist de entrega

- [ ] BD importada y conectada
- [x] CORS para `localhost:5173` (el front en IP usa el proxy `/api`; no hubo que ampliar la lista)
- [ ] Login con JWT funcionando
- [ ] Roles y permisos aplicados
- [ ] CRUD Tipos, Bodegas, Usuarios y Permisos
- [x] Facturas: entregar, aceptar con firma, rechazar, recibir y PDF (sin módulo “Órdenes”)
- [x] Estadísticas: `GET /estadisticas/resumen` y permiso `estadisticas_view`
- [ ] README y `requirements.txt`
