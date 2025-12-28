module.exports = {
  apps: [{
    name: 'agenda-backend',
    script: './dist/index.js',
    instances: process.env.PM2_INSTANCES || 1,
    exec_mode: 'cluster',

    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',

    // Environment variables
    env: {
      NODE_ENV: 'production',
    },

    // Logging
    error_file: '/dev/stderr',
    out_file: '/dev/stdout',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true,

    // Health monitoring
    max_restarts: 10,
    min_uptime: '10s',

    // Additional options
    time: true,
  }]
};
