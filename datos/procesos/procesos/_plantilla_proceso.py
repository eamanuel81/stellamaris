"""Plantilla para agregar nuevos procesos (ej. ADAN, empleados, tareas).

1. Copiá este archivo como procesos/mi_proceso.py
2. Definí ORIGEN apuntando a un Excel en /datos
3. Implementá paso01_extraer, paso02_validar, paso03_cargar_db
4. Registralo en procesos/__init__.py
"""

from __future__ import annotations

from common.runner import PasoResultado, ejecutar_paso
from registry import ProcesoDef

PROCESO_ID = "plantilla"
PROCESO = ProcesoDef(
    id=PROCESO_ID,
    nombre="Plantilla de proceso",
    origen=__file__,
    salida_dir=__file__,
    pasos=(),
)


def paso01_extraer(*, forzar: bool = False) -> dict:
    def _run() -> PasoResultado:
        raise NotImplementedError("Implementar extracción")

    return ejecutar_paso(
        paso_id="01_extraer",
        salida=PROCESO.salida_dir / "paso01_extracto.json",
        forzar=forzar,
        ejecutar=_run,
    )
