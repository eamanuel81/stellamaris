#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from common.config import get_database_schema
from common.db import conectar

PASO1 = ROOT / "salida" / "embarc_clientes" / "paso01_extracto.json"


def main() -> int:
    schema = get_database_schema()
    extracto = json.loads(PASO1.read_text(encoding="utf-8"))
    esperados = extracto["total"]

    conn = conectar()
    cur = conn.cursor()

    cur.execute(f"SELECT COUNT(*) FROM {schema}.clients")
    total_db = cur.fetchone()[0]

    cur.execute(
        f"""
        SELECT COUNT(*) FROM {schema}.clients
        WHERE boats IS NOT NULL AND jsonb_array_length(boats) > 0
        """
    )
    con_embarc = cur.fetchone()[0]

    cur.execute(
        f"""
        SELECT COUNT(*) FROM {schema}.clients
        WHERE trim(coalesce(first_name, '')) = ''
           OR trim(coalesce(last_name, '')) = ''
        """
    )
    sin_nombre = cur.fetchone()[0]

    cur.execute(
        f"""
        SELECT first_name, last_name,
               boats->0->>'name',
               boats->0->>'registrationNumber'
        FROM {schema}.clients
        ORDER BY created_at DESC NULLS LAST
        LIMIT 10
        """
    )
    recientes = cur.fetchall()

    cur.execute(
        f"""
        SELECT first_name, last_name, jsonb_array_length(boats)
        FROM {schema}.clients
        WHERE jsonb_array_length(boats) > 1
        ORDER BY last_name, first_name
        LIMIT 10
        """
    )
    multi = cur.fetchall()

    # cruce por nombre normalizado
    cur.execute(
        f"""
        SELECT upper(trim(last_name)) || '|' || upper(trim(first_name)), id
        FROM {schema}.clients
        """
    )
    db_claves = {row[0]: row[1] for row in cur.fetchall()}

    faltantes = []
    for c in extracto["clientes"]:
        clave = f"{c['lastName'].strip().upper()}|{c['firstName'].strip().upper()}"
        if clave not in db_claves:
            faltantes.append(
                f"fila {c['sourceRow']}: {c['lastName']}, {c['firstName']}"
            )

    reporte = ROOT / "salida" / "embarc_clientes" / "verificacion_db.json"
    data = {
        "esperados_desde_excel": esperados,
        "total_en_db": total_db,
        "con_embarcacion": con_embarc,
        "sin_nombre_o_apellido": sin_nombre,
        "faltantes_respecto_excel": faltantes,
        "clientes_con_varias_embarcaciones": [
            {"firstName": r[0], "lastName": r[1], "boats": r[2]} for r in multi
        ],
        "ultimos_10": [
            {
                "firstName": r[0],
                "lastName": r[1],
                "boat": r[2],
                "registration": r[3],
            }
            for r in recientes
        ],
    }
    reporte.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=== Verificacion de carga ===")
    print(f"Esperados desde Excel: {esperados}")
    print(f"Total en DB:           {total_db}")
    print(f"Con embarcacion:       {con_embarc}")
    print(f"Sin nombre/apellido:   {sin_nombre}")
    print(f"Faltantes vs Excel:    {len(faltantes)}")
    if faltantes[:5]:
        for f in faltantes[:5]:
            print(f"  - {f}")
    print(f"Varias embarcaciones:  {len(multi)}")
    for r in multi[:5]:
        print(f"  - {r[1]}, {r[0]} ({r[2]} embarcaciones)")
    print()
    print("Ultimos 5 cargados:")
    for r in recientes[:5]:
        print(f"  - {r[1]}, {r[0]} | {r[2]} | mat: {r[3]}")
    print()
    print(f"Reporte: {reporte}")

    conn.close()
    return 0 if len(faltantes) == 0 and sin_nombre == 0 and con_embarc >= esperados else 1


if __name__ == "__main__":
    raise SystemExit(main())
