from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any

from .config import ESTADO_DIR


class EstadoPaso(str, Enum):
    PENDIENTE = "pendiente"
    COMPLETADO = "completado"
    DESCARTADO = "descartado"
    ERROR = "error"
    NO_EJECUTADO = "no_ejecutado"


def _ahora_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


@dataclass
class EstadoProceso:
    proceso_id: str
    archivo: Path

    def _leer(self) -> dict[str, Any]:
        if not self.archivo.exists():
            return {"proceso_id": self.proceso_id, "pasos": {}}
        return json.loads(self.archivo.read_text(encoding="utf-8"))

    def _guardar(self, data: dict[str, Any]) -> None:
        self.archivo.parent.mkdir(parents=True, exist_ok=True)
        self.archivo.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def registrar(
        self,
        paso: str,
        estado: EstadoPaso,
        mensaje: str = "",
        detalle: dict[str, Any] | None = None,
    ) -> None:
        data = self._leer()
        data["proceso_id"] = self.proceso_id
        data["ultima_actualizacion"] = _ahora_iso()
        data.setdefault("pasos", {})[paso] = {
            "estado": estado.value,
            "mensaje": mensaje,
            "timestamp": _ahora_iso(),
            "detalle": detalle or {},
        }
        self._guardar(data)

    def resumen(self) -> dict[str, Any]:
        return self._leer()


@dataclass
class EstadoGeneral:
    archivo: Path = field(default_factory=lambda: ESTADO_DIR / "proceso_general.json")
    procesos: dict[str, EstadoProceso] = field(default_factory=dict)

    def proceso(self, proceso_id: str) -> EstadoProceso:
        if proceso_id not in self.procesos:
            self.procesos[proceso_id] = EstadoProceso(
                proceso_id=proceso_id,
                archivo=ESTADO_DIR / f"{proceso_id}.json",
            )
        return self.procesos[proceso_id]

    def registrar_ejecucion(self, proceso_id: str, paso: str, resultado: dict[str, Any]) -> None:
        estado = EstadoPaso(resultado.get("estado", EstadoPaso.ERROR.value))
        self.proceso(proceso_id).registrar(
            paso=paso,
            estado=estado,
            mensaje=resultado.get("mensaje", ""),
            detalle=resultado.get("detalle"),
        )
        general = self._leer()
        general["ultima_ejecucion"] = _ahora_iso()
        general.setdefault("procesos", {}).setdefault(proceso_id, {})[paso] = {
            "estado": estado.value,
            "mensaje": resultado.get("mensaje", ""),
            "timestamp": _ahora_iso(),
        }
        self._guardar(general)

    def _leer(self) -> dict[str, Any]:
        if not self.archivo.exists():
            return {"procesos": {}}
        return json.loads(self.archivo.read_text(encoding="utf-8"))

    def _guardar(self, data: dict[str, Any]) -> None:
        self.archivo.parent.mkdir(parents=True, exist_ok=True)
        self.archivo.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def mostrar(self) -> str:
        data = self._leer()
        lineas = [f"Ultima ejecucion general: {data.get('ultima_ejecucion', '-')}", ""]
        procesos = data.get("procesos", {})
        if not procesos:
            lineas.append("Sin ejecuciones registradas.")
            return "\n".join(lineas)

        for proceso_id, pasos in procesos.items():
            lineas.append(f"[{proceso_id}]")
            for paso, info in pasos.items():
                lineas.append(
                    f"  {paso}: {info.get('estado')} - {info.get('mensaje', '')}"
                )
            lineas.append("")
        return "\n".join(lineas).rstrip()
