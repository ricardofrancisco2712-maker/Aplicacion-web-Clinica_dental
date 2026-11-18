require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const sql = require('mssql');

const app = express();
const pages = ['Capa1.html', 'capa2.html', 'capa3.html', 'pacientes.html'];
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', asyncHandler(async (req, res) => {
  const pool = app.locals.databasePool;
  if (!pool) return res.status(503).json({ error: 'SQL Server no está conectado.' });
  await pool.request().query('SELECT 1 AS connected');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/api/state', asyncHandler(async (req, res) => {
  const pool = app.locals.databasePool;
  if (!pool) return res.status(503).json({ error: 'SQL Server no está conectado.' });
  const result = await pool.request().query(
    'SELECT StateJson FROM dbo.ClinicState WHERE Id = 1'
  );
  res.json({ state: result.recordset[0] ? JSON.parse(result.recordset[0].StateJson) : null });
}));

app.put('/api/state', asyncHandler(async (req, res) => {
  const pool = app.locals.databasePool;
  if (!pool) return res.status(503).json({ error: 'SQL Server no está conectado.' });
  const state = req.body;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ error: 'El estado debe ser un objeto JSON.' });
  }

  const stateJson = JSON.stringify(state);
  await pool.request()
    .input('stateJson', sql.NVarChar(sql.MAX), stateJson)
    .query(`
      MERGE dbo.ClinicState WITH (HOLDLOCK) AS target
      USING (SELECT CONVERT(tinyint, 1) AS Id) AS source
        ON target.Id = source.Id
      WHEN MATCHED THEN
        UPDATE SET StateJson = @stateJson, UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (Id, StateJson) VALUES (source.Id, @stateJson);
    `);
  res.json({ saved: true });
}));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'Capa1.html')));
for (const page of pages) {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(__dirname, page)));
}
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));

app.use((req, res) => {
  res.status(404).json({ error: 'No se encontró el recurso solicitado.' });
});

app.use((error, req, res, next) => {
  console.error('Error en el servidor DentaCare:', error);
  const status = error.type === 'entity.too.large' ? 413
    : error instanceof SyntaxError && Object.hasOwn(error, 'body') ? 400
      : 500;
  res.status(status).json({
    error: status === 400 ? 'El cuerpo de la solicitud no contiene JSON válido.'
      : status === 413 ? 'El estado enviado supera el límite permitido.'
        : 'No se pudo completar la operación.'
  });
});

function createDatabaseConfig() {
  if (process.env.SQL_CONNECTION_STRING) return process.env.SQL_CONNECTION_STRING;

  const required = ['SQL_SERVER', 'SQL_DATABASE', 'SQL_USER', 'SQL_PASSWORD'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}.`);
  }

  const [server, serverInstance] = process.env.SQL_SERVER.split('\\');
  if (!server || (process.env.SQL_SERVER.includes('\\') && !serverInstance)) {
    throw new Error('SQL_SERVER debe contener un nombre de servidor válido y, opcionalmente, una instancia.');
  }
  if (process.env.SQL_SERVER.includes('\\') && process.env.SQL_INSTANCE_NAME) {
    throw new Error('Indica la instancia en SQL_SERVER o en SQL_INSTANCE_NAME, no en ambos.');
  }

  const instanceName = process.env.SQL_INSTANCE_NAME || serverInstance;
  const port = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined;
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new Error('SQL_PORT debe ser un puerto válido entre 1 y 65535.');
  }
  if (instanceName && port !== undefined) {
    throw new Error('Configura SQL_PORT o SQL_INSTANCE_NAME, no ambos.');
  }

  return {
    server,
    ...(port === undefined ? {} : { port }),
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      ...(instanceName ? { instanceName } : {}),
      encrypt: process.env.SQL_ENCRYPT !== 'false',
      trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true'
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: 15000
  };
}

async function start() {
  const pool = new sql.ConnectionPool(createDatabaseConfig());
  await pool.connect();
  await pool.request().batch(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  app.locals.databasePool = pool;

  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => {
    console.log(`DentaCare disponible en http://localhost:${port}`);
  });
  const close = () => server.close(async () => {
    await pool.close();
    process.exit(0);
  });
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
}

if (require.main === module) {
  start().catch(error => {
    console.error('No se pudo iniciar DentaCare o conectar con SQL Server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, createDatabaseConfig, start };
