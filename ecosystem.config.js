module.exports = {
  apps: [{
    name: 'chat',
    script: 'yarn',
    args: 'dev',
    instances: 1,
    ignore_watch: [
        'node_modules',
        'logs'
    ],
    env: {
      PORT: 3000
    },
    exec_mode: 'fork',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    log_file: 'logs/app.log',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    merge_logs: true
  }]
};
