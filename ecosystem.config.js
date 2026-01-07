// Configuración de puertos - se puede sobreescribir por variables de entorno
const BACKEND_PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3000);

module.exports = {
  apps: [
    {
      name: 'sistema-email-server',
      // En producción es más robusto ejecutar el build compilado (evita depender de ts-node global)
      script: 'dist/app.js',
      interpreter: 'node',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: BACKEND_PORT,
        BACKEND_PORT: BACKEND_PORT,
        FRONTEND_PORT: FRONTEND_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      // Guardar logs en la carpeta /logs del proyecto (fuera de server/)
      error_file: '../logs/server-error.log',
      out_file: '../logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'sistema-email-client',
      script: 'npm',
      // Forzar puerto explícito (evita arrancar en un puerto inesperado)
      args: `start -- -p ${FRONTEND_PORT}`,
      cwd: './client',
      env: {
        NODE_ENV: 'production',
        PORT: FRONTEND_PORT,
        BACKEND_PORT: BACKEND_PORT,
        FRONTEND_PORT: FRONTEND_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: '../logs/client-error.log',
      out_file: '../logs/client-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

