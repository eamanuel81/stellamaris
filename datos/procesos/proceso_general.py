#!/usr/bin/env python3
"""
Orquestador de cargas masivas desde /datos.

Uso:
  python proceso_general.py
  python proceso_general.py --proceso embarc_clientes
  python proceso_general.py --proceso embarc_clientes --paso 1
  python proceso_general.py --forzar
  python proceso_general.py --dry-run
  python proceso_general.py --estado
  python proceso_general.py --listar
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from common.estado import EstadoGeneral, EstadoPaso
from procesos import REGISTRO


def _imprimir_resultado(proceso_id: str, paso: str, resultado: dict) -> None:
    estado = resultado.get("estado", "error")
    mensaje = resultado.get("mensaje", "")
    print(f"  [{proceso_id}] {paso}: {estado} - {mensaje}")


def _ejecutar_proceso(
    proceso_id: str,
    *,
    paso: int | None,
    forzar: bool,
    dry_run: bool,
    estado_general: EstadoGeneral,
) -> int:
    definicion = REGISTRO[proceso_id]
    errores = 0

    print(f"\n=== {definicion.nombre} ({proceso_id}) ===")
    if not definicion.origen.exists():
        msg = f"Origen no encontrado: {definicion.origen}"
        print(f"  ERROR - {msg}")
        estado_general.registrar_ejecucion(
            proceso_id,
            "origen",
            {"estado": EstadoPaso.ERROR.value, "mensaje": msg},
        )
        return 1

    pasos_a_correr = definicion.pasos
    if paso is not None:
        pasos_a_correr = tuple(p for p in definicion.pasos if p[0].startswith(f"{paso:02d}"))

    for paso_id, descripcion, fn in pasos_a_correr:
        print(f"\n> {paso_id} - {descripcion}")
        kwargs = {"forzar": forzar}
        if paso_id == "03_cargar_db":
            kwargs["dry_run"] = dry_run

        resultado = fn(**kwargs)
        _imprimir_resultado(proceso_id, paso_id, resultado)
        estado_general.registrar_ejecucion(proceso_id, paso_id, resultado)

        if resultado.get("estado") == EstadoPaso.ERROR.value:
            errores += 1
            break

        if resultado.get("estado") == EstadoPaso.DESCARTADO.value and not forzar:
            print("  (Pasos siguientes pueden depender de este; revisa con --forzar si queres regenerar)")

    return errores


def main() -> int:
    parser = argparse.ArgumentParser(description="Cargador masivo Stella - proceso general")
    parser.add_argument(
        "--proceso",
        action="append",
        choices=sorted(REGISTRO.keys()),
        help="Proceso a ejecutar (repetible). Sin esto, corre todos.",
    )
    parser.add_argument(
        "--paso",
        type=int,
        choices=[1, 2, 3],
        help="Ejecutar solo un paso numerado del proceso",
    )
    parser.add_argument(
        "--forzar",
        action="store_true",
        help="Regenerar salidas aunque ya existan",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simular paso 3 sin escribir en la base",
    )
    parser.add_argument(
        "--estado",
        action="store_true",
        help="Mostrar estado de ejecuciones previas",
    )
    parser.add_argument(
        "--listar",
        action="store_true",
        help="Listar procesos registrados",
    )
    args = parser.parse_args()

    if args.listar:
        print("Procesos registrados:\n")
        for proc_id, definicion in REGISTRO.items():
            print(f"  {proc_id}")
            print(f"    {definicion.nombre}")
            print(f"    Origen: {definicion.origen}")
            for paso_id, desc, _ in definicion.pasos:
                print(f"  {paso_id}: {desc}")
            print()
        return 0

    estado_general = EstadoGeneral()

    if args.estado:
        print(estado_general.mostrar())
        return 0

    procesos = args.proceso or list(REGISTRO.keys())
    total_errores = 0

    print("Stella - cargador masivo")
    print(f"Procesos: {', '.join(procesos)}")
    if args.forzar:
        print("Modo: FORZAR regeneración")
    if args.dry_run:
        print("Modo: DRY-RUN (sin escribir en DB en paso 3)")

    for proceso_id in procesos:
        total_errores += _ejecutar_proceso(
            proceso_id,
            paso=args.paso,
            forzar=args.forzar,
            dry_run=args.dry_run,
            estado_general=estado_general,
        )

    print("\n--- Resumen ---")
    print(estado_general.mostrar())

    return 1 if total_errores else 0


if __name__ == "__main__":
    raise SystemExit(main())
