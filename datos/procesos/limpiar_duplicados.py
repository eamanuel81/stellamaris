#!/usr/bin/env python3
"""Elimina clientes duplicados (mismo nombre normalizado) y fusiona embarcaciones."""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from psycopg2.extras import Json

from common.config import get_database_schema
from common.db import conectar, embarcacion_existe
from common.parsers import normalizar_clave

REPORTE = ROOT / "salida" / "embarc_clientes" / "dedup_report.json"


def clave(first_name: str, last_name: str) -> str:
    return f"{normalizar_clave(last_name)}|{normalizar_clave(first_name)}"


def main() -> int:
    schema = get_database_schema()
    conn = conectar()
    cur = conn.cursor()

    cur.execute(
        f"""
        SELECT id, first_name, last_name, boats, created_at
        FROM {schema}.clients
        ORDER BY created_at ASC NULLS FIRST, id ASC
        """
    )
    rows = cur.fetchall()
    grupos: dict[str, list] = defaultdict(list)
    for row in rows:
        grupos[clave(row[1] or "", row[2] or "")].append(row)

    eliminados = 0
    fusionados = 0
    detalle = []

    with conn:
        with conn.cursor() as cur:
            for key, items in grupos.items():
                if len(items) <= 1:
                    continue

                keeper = items[0]
                keeper_id = str(keeper[0])
                boats = list(keeper[3] or [])

                for dup in items[1:]:
                    dup_id = str(dup[0])
                    for boat in dup[3] or []:
                        if not embarcacion_existe(
                            boats,
                            boat.get("registrationNumber", ""),
                            boat.get("name", ""),
                        ):
                            boats.append(boat)
                            fusionados += 1

                    cur.execute(
                        f"DELETE FROM {schema}.clients WHERE id = %s",
                        (dup_id,),
                    )
                    eliminados += 1
                    detalle.append(
                        {
                            "clave": key,
                            "conservado": keeper_id,
                            "eliminado": dup_id,
                        }
                    )

                cur.execute(
                    f"UPDATE {schema}.clients SET boats = %s WHERE id = %s",
                    (Json(boats), keeper_id),
                )

    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {schema}.clients")
    total = cur.fetchone()[0]
    conn.close()

    reporte = {
        "duplicados_eliminados": eliminados,
        "embarcaciones_fusionadas": fusionados,
        "total_final": total,
        "detalle": detalle,
    }
    REPORTE.write_text(json.dumps(reporte, ensure_ascii=False, indent=2), encoding="utf-8")

    print("Duplicados eliminados:", eliminados)
    print("Embarcaciones fusionadas:", fusionados)
    print("Total clientes final:", total)
    print("Reporte:", REPORTE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
