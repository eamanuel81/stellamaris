from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from common.estado import EstadoPaso


@dataclass
class PasoResultado:
    estado: EstadoPaso
    mensaje: str
    detalle: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "estado": self.estado.value,
            "mensaje": self.mensaje,
            "detalle": self.detalle or {},
        }


def guardar_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def guardar_reporte(path: Path, reporte: dict[str, Any]) -> None:
    guardar_json(path, reporte)


def ejecutar_paso(
    *,
    paso_id: str,
    salida: Path,
    forzar: bool,
    ejecutar: Callable[[], PasoResultado],
) -> dict[str, Any]:
    if salida.exists() and not forzar:
        return PasoResultado(
            estado=EstadoPaso.DESCARTADO,
            mensaje=f"No se ejecuto: ya existe {salida.name}. Usa --forzar para regenerar.",
            detalle={"archivo": str(salida)},
        ).to_dict()

    try:
        resultado = ejecutar()
        return resultado.to_dict()
    except Exception as exc:  # noqa: BLE001
        return PasoResultado(
            estado=EstadoPaso.ERROR,
            mensaje=str(exc),
            detalle={"paso": paso_id},
        ).to_dict()
