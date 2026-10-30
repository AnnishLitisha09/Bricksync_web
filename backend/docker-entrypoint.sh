#!/bin/sh
set -e

echo '========================================='
echo 'Starting Bricksync Backend Container'
echo '========================================='

echo 'Running Database Migrations...'
npx sequelize db:migrate

echo 'Migrations finished successfully.'
echo 'Launching Node.js server...'
exec node server.js
