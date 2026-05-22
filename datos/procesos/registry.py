from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable


@dataclass(frozen=True)
class ProcesoDef:
    id: str
    nombre: str
    origen: Path
    salida_dir: Path
    pasos: tuple[tuple[str, str, Callable[..., dict]], ...]
