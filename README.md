DentaCare Pro · Aplicación web de Clínica Dental

Aplicación web para la gestión de una clínica dental: inicio de sesión con roles, pacientes, agenda de citas, odontograma (hallazgos y notas clínicas) y finanzas básicas. El frontend (HTML + Tailwind + JavaScript) consume una API REST en Node.js con base de datos SQLite.

Tecnologías
Capa	Tecnología
Frontend	HTML, Tailwind CSS (CDN), JavaScript
Backend	Node.js 20+, Express 5
Base de datos	SQLite (better-sqlite3)
Seguridad	JWT, contraseñas con bcryptjs, control de acceso por rol
Estructura del proyecto
├── backend/
│   ├── src/
│   │   ├── config/db.js           # conexión a SQLite y creación de tablas
│   │   ├── middlewares/auth.js    # JWT y control de roles
│   │   ├── controllers/           # lógica de cada módulo
│   │   ├── routes/index.js        # definición de endpoints
│   │   └── server.js              # arranque de Express + archivos estáticos
│   ├── scripts/seed.js            # usuarios y pacientes de prueba
│   ├── .env.example
│   └── package.json
├── database/
│   └── schema.sql                 # definición de tablas
├── frontend/
│   ├── pages/                     # login, agenda, nueva-cita, odontograma
│   ├── js/                        # api.js (cliente de la API) y app.js (interfaz)
│   └── css/
└── README.md
Requisitos previos
Node.js 20 o superior (incluye npm).
Git.

No hace falta instalar ningún servidor de base de datos: SQLite crea el archivo database/clinica.db automáticamente.

Instalación
bash
git clone https://github.com/ricardofrancisco2712-maker/Aplicacion-web-Clinica_dental.git
cd Aplicacion-web-Clinica_dental/backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run seed                # carga usuarios y pacientes de prueba

Edita backend/.env y cambia JWT_SECRET por una clave larga y aleatoria.

Ejecución
bash
cd backend
npm start

Abre http://localhost:3000 en el navegador. Para desarrollo con recarga automática: npm run dev.

Usuarios de prueba
Rol	Correo	Contraseña
Administrador	admin@dentacare.com	Admin1234
Dentista	dentista@dentacare.com	Dentista1234
Recepción	recepcion@dentacare.com	Recepcion1234

Son solo para pruebas. Cámbialas antes de usar la aplicación con datos reales.

Módulos implementados
Login y gestión de usuarios: inicio de sesión con JWT, roles (admin, dentista, recepcion), alta/edición/desactivación de usuarios (solo admin).
Pacientes: alta, búsqueda, edición y eliminación.
Agenda y citas: crear cita (paciente, fecha, hora, duración, especialidad, sillón), listar por fecha, cancelar. Evita dos citas a la misma hora en el mismo sillón.
Odontograma y finanzas: hallazgos y notas por pieza dental (FDI), presupuestos y pagos por paciente.
Endpoints principales

Todas las rutas, salvo el login, requieren el encabezado Authorization: Bearer <token>.

Método	Ruta	Descripción	Roles
POST	/api/auth/login	Iniciar sesión	público
GET	/api/auth/me	Usuario actual	todos
GET/POST	/api/usuarios	Listar / crear usuarios	admin
PUT	/api/usuarios/:id	Editar / desactivar usuario	admin
GET/POST	/api/pacientes	Listar (?q=) / crear	todos
GET/PUT	/api/pacientes/:id	Ver / editar	todos
DELETE	/api/pacientes/:id	Eliminar	admin
GET/POST	/api/citas	Listar (?fecha=, ?desde=) / crear	todos
PATCH	/api/citas/:id/estado	Cambiar estado (programada, en_sillon, finalizada, cancelada)	todos
DELETE	/api/citas/:id	Eliminar cita	todos
GET/POST	/api/registros	Hallazgos y notas clínicas	POST: admin, dentista
GET	/api/finanzas	Presupuestos y pagos	todos
POST	/api/finanzas/presupuestos	Crear presupuesto	admin, dentista, recepción
POST	/api/finanzas/pagos	Registrar pago	admin, recepción
Base de datos

Tablas: usuarios, pacientes, citas, registros_clinicos, presupuestos, pagos. El script completo está en database/schema.sql y se ejecuta automáticamente al iniciar el servidor.

usuarios 1──* citas *──1 pacientes 1──* registros_clinicos
                              ├──* presupuestos
                              └──* pagos
Limitaciones conocidas
Las tarjetas de ejemplo de la agenda (Carlos Méndez, Sofía Alarcón, etc.) son contenido estático del prototipo; las citas reales se muestran debajo de ellas.
"Hacer pasar", "Finalizar turno", recetas y solicitudes de asistente siguen guardándose solo en el navegador (localStorage).
Tailwind se carga desde CDN, por lo que la interfaz necesita conexión a internet.
