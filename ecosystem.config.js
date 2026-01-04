// Configuración de puertos - Edita estos valores según necesites
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

module.exports = {
  apps: [
    {
      name: 'sistema-email-server',
      script: 'src/app.ts',
      interpreter: 'ts-node',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: BACKEND_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'sistema-email-client',
      script: 'npm',
      args: 'start',
      cwd: './client',
      env: {
        NODE_ENV: 'production',
        PORT: FRONTEND_PORT
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/client-error.log',
      out_file: './logs/client-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

