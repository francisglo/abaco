#!/bin/bash
# ÁBACO v1.0 - Script de Inicialización

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 ÁBACO v1.0 - Sistema Integral de Territorial SaaS${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check Node.js
echo -e "${YELLOW}Verificando Node.js...${NC}"
node --version

# Kill previous processes
echo -e "${YELLOW}Limpiando procesos previos...${NC}"
pkill -f "node" || true
sleep 2

# Install dependencies
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install

# Build if needed
echo -e "${YELLOW}Verificando build...${NC}"

# Start dev servers
echo -e "${GREEN}✅ Iniciando servidores...${NC}"

# Terminal 1: Vite Dev Server
echo -e "${BLUE}🚀 Iniciando Vite en puerto 5174...${NC}"
npm run dev &
VITE_PID=$!

# Terminal 2: JSON Server
echo -e "${BLUE}🚀 Iniciando JSON-Server en puerto 4000...${NC}"
cd mock
npx json-server --watch db.json --port 4000 &
JSON_PID=$!
cd ..

echo -e "\n${GREEN}✨ ÁBACO INICIADO CON ÉXITO${NC}"
echo -e "${GREEN}==============================${NC}\n"

echo -e "📱 URLs Disponibles:"
echo -e "  🏠 Inicio:        ${BLUE}http://localhost:5174${NC}"
echo -e "  🎛️  Control:      ${BLUE}http://localhost:5174/control${NC}"
echo -e "  ⚙️  Optimización: ${BLUE}http://localhost:5174/optimization${NC}"
echo -e "  📊 Dashboard:    ${BLUE}http://localhost:5174/dashboard${NC}"
echo -e "  📍 Territorios:  ${BLUE}http://localhost:5174/zones${NC}"
echo -e "  👥 Contactos:    ${BLUE}http://localhost:5174/voters${NC}"
echo -e "  🔌 Mock API:     ${BLUE}http://localhost:4000${NC}\n"

echo -e "📚 Documentación:"
echo -e "  ${BLUE}GUIA_RAPIDA.md${NC} - Guía rápida"
echo -e "  ${BLUE}STATUS_COMPLETO.md${NC} - Estado actual"
echo -e "  ${BLUE}ALGORITMOS_COMPLETOS.md${NC} - Documentación técnica\n"

echo -e "⌨️  Comandos útiles:"
echo -e "  ${YELLOW}npm run dev${NC}         - Iniciar desarrollo"
echo -e "  ${YELLOW}npm run build${NC}       - Build producción"
echo -e "  ${YELLOW}npm run preview${NC}     - Preview build"
echo -e "  ${YELLOW}npm run mock:server${NC} - Solo JSON server\n"

echo -e "🎯 Para parar los servidores:"
echo -e "  ${YELLOW}Ctrl + C${NC} en esta terminal\n"

echo -e "${GREEN}¡Sistema listo para trabajar! 🚀${NC}\n"

# Keep processes running
wait $VITE_PID $JSON_PID
