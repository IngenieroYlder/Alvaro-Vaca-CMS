# Script para crear respaldo Docker versión base 0.1

Write-Host "Iniciando construcción de imágenes..."
docker-compose build

Write-Host "Etiquetando imágenes como v0.1..."
docker tag patios-backend:latest patios-backend:v0.1
docker tag patios-frontend:latest patios-frontend:v0.1

Write-Host "Guardando imágenes en archivo patios_v0.1.tar..."
docker save -o patios_v0.1.tar patios-backend:v0.1 patios-frontend:v0.1

Write-Host "Respaldo completado: patios_v0.1.tar"
Write-Host "Para desplegar en VPS:"
Write-Host "1. Copia 'patios_v0.1.tar' y 'docker-compose.yml' a tu servidor."
Write-Host "2. En el servidor, ejecuta: docker load -i patios_v0.1.tar"
Write-Host "3. Modifica docker-compose.yml para usar las imagenes 'patios-backend:v0.1' y 'patios-frontend:v0.1' (o deja latest si reconstruyes alla)."
Write-Host "4. Ejecuta: docker-compose up -d"
