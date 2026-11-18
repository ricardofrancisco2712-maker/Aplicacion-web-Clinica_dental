DentaCare Pro · Aplicación web de Clínica Dental

Aplicación web para la gestión de una clínica dental: inicio de sesión con roles, pacientes, agenda de citas, odontograma (hallazgos y notas clínicas) y finanzas básicas. El frontend (HTML + Tailwind + JavaScript) consume una API REST en Node.js con base de datos SQLite.

Tecnologías
Capa	Tecnología
Frontend	HTML, Tailwind CSS (CDN), JavaScript
Backend	Node.js 20+, Express 5
Base de datos	SQLite (better-sqlite3)
Seguridad	JWT, contraseñas con bcryptjs, control de acceso por rol


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

# Base de datos local (SQLite)

La aplicación utiliza SQLite: la base de datos se guarda en el archivo `data/dentacare.sqlite`, dentro de esta carpeta. No necesitas instalar ni configurar SQL Server, crear usuarios, contraseñas o abrir puertos. La aplicación crea la carpeta, el archivo y la tabla automáticamente al iniciarse.

## Iniciar la aplicación

1. Instala Node.js 20 o una versión más reciente.
2. Abre PowerShell en esta carpeta y ejecuta:

   ```powershell
   npm install
   npm start
   ```

3. Abre `http://localhost:3000`. Para verificar que SQLite está abierta, visita `http://localhost:3000/api/health`.

El archivo de la base de datos se conserva entre reinicios y no se sube a Git. Haz copias de seguridad de `data/dentacare.sqlite`; al cerrar la aplicación, SQLite también puede utilizar los archivos temporales `data/dentacare.sqlite-wal` y `data/dentacare.sqlite-shm`.

Puedes cambiar la ubicación con `SQLITE_DATABASE_PATH` en `.env`. Una ruta relativa se interpreta desde la carpeta del proyecto.

Si el navegador tiene datos guardados bajo la clave `dentacare-demo-v1`, se copian al archivo SQLite la primera vez que se inicia con la base vacía. La copia del navegador solo se elimina después de confirmar el guardado.

> SQLite guarda los datos en esta máquina. Para compartirlos entre usuarios en distintas computadoras o publicar la aplicación en Render, necesitarás una base de datos alojada y accesible por el servidor.

Tablas: usuarios, pacientes, citas, registros_clinicos, presupuestos, pagos. El script completo está en database/schema.sql y se ejecuta automáticamente al iniciar el servidor.

usuarios 1──* citas *──1 pacientes 1──* registros_clinicos
                              ├──* presupuestos
                              └──* pagos
Limitaciones conocidas
Las tarjetas de ejemplo de la agenda (Carlos Méndez, Sofía Alarcón, etc.) son contenido estático del prototipo; las citas reales se muestran debajo de ellas.
"Hacer pasar", "Finalizar turno", recetas y solicitudes de asistente siguen guardándose solo en el navegador (localStorage).
Tailwind se carga desde CDN, por lo que la interfaz necesita conexión a internet.
