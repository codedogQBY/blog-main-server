{
  "apps": [
    {
      "name": "blog-main-server",
      "script": "dist/main.js",
      "cwd": "./",
      "instances": 1,
      "exec_mode": "cluster",
      "watch": false,
      "merge_logs": true,
      "log_date_format": "YYYY-MM-DD HH:mm Z",
      "log_file": "logs/combined.log",
      "out_file": "logs/out.log",
      "error_file": "logs/error.log",
      "pid_file": "logs/app.pid",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "env_development": {
        "NODE_ENV": "development",
        "PORT": 3001
      },
      "env_staging": {
        "NODE_ENV": "staging",
        "PORT": 3001
      },
      "max_memory_restart": "1G",
      "node_args": "--max-old-space-size=1024",
      "min_uptime": "10s",
      "max_restarts": 10,
      "autorestart": true,
      "cron_restart": "0 2 * * *",
      "restart_delay": 4000,
      "kill_timeout": 5000,
      "listen_timeout": 8000,
      "shutdown_with_message": true,
      "source_map_support": false
    }
  ],
  "deploy": {
    "production": {
      "user": "root",
      "host": ["your-server-ip"],
      "ref": "origin/master",
      "repo": "git@github.com:codedogQBY/blog-main-server.git",
      "path": "/var/www/blog-main-server",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      "ssh_options": "StrictHostKeyChecking=no"
    },
    "staging": {
      "user": "root",
      "host": ["your-staging-server-ip"],
      "ref": "origin/develop",
      "repo": "git@github.com:codedogQBY/blog-main-server.git",
      "path": "/var/www/blog-main-server-staging",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env staging",
      "pre-setup": "",
      "ssh_options": "StrictHostKeyChecking=no"
    }
  }
}