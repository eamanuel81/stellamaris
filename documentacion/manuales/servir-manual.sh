#!/bin/bash
echo "========================================"
echo "Servidor Local para Manuales HTML"
echo "========================================"
echo ""
echo "Abre tu navegador en: http://localhost:8000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8000


