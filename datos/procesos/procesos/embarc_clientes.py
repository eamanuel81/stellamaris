from __future__ import annotations

from pathlib import Path

import pandas as pd

from common.config import DATOS_DIR
from common.estado import EstadoPaso
from common.parsers import fila_a_cliente
from common.runner import PasoResultado, ejecutar_paso, guardar_json, guardar_reporte
from registry import ProcesoDef

PROCESO_ID = "embarc_clientes"
ORIGEN = DATOS_DIR / "EMBARC.CLIENTES.xlsx"
SALIDA = Path(__file__).resolve().parent.parent / "salida" / PROCESO_ID

PASO1_JSON = SALIDA / "paso01_extracto.json"
PASO1_XLSX = SALIDA / "paso01_normalizado.xlsx"
PASO1_REPORT = SALIDA / "paso01_report.json"

PASO2_JSON = SALIDA / "paso02_validado.json"
PASO2_REPORT = SALIDA / "paso02_report.json"

PASO3_REPORT = SALIDA / "paso03_report.json"


def _leer_excel(origen: Path) -> pd.DataFrame:
    df = pd.read_excel(origen)
    if df.shape[1] < 3:
        raise ValueError("Se esperaban al menos 3 columnas en el Excel de origen")
    df = df.iloc[:, :3].copy()
    df.columns = ["boat_name", "registration", "client_raw"]
    return df


def paso01_extraer(*, forzar: bool = False) -> dict:
    def _run() -> PasoResultado:
        if not ORIGEN.exists():
            raise FileNotFoundError(f"No se encontró el archivo origen: {ORIGEN}")

        df = _leer_excel(ORIGEN)
        clientes = []
        for idx, row in df.iterrows():
            if pd.isna(row["client_raw"]) or not str(row["client_raw"]).strip():
                continue
            clientes.append(
                fila_a_cliente(
                    {
                        "boat_name": None if pd.isna(row["boat_name"]) else row["boat_name"],
                        "registration": None if pd.isna(row["registration"]) else row["registration"],
                        "client_raw": str(row["client_raw"]).strip(),
                    },
                    int(idx),
                )
            )

        extracto = {
            "proceso": PROCESO_ID,
            "origen": str(ORIGEN),
            "total": len(clientes),
            "clientes": clientes,
        }

        guardar_json(PASO1_JSON, extracto)

        filas_excel = []
        for c in clientes:
            boat = c["boats"][0]
            filas_excel.append(
                {
                    "fila_origen": c["sourceRow"],
                    "apellido": c["lastName"],
                    "nombre": c["firstName"],
                    "embarcacion": boat["name"],
                    "matricula": boat["registrationNumber"],
                    "tipo_casco": boat["hullType"],
                    "nota_interna": c["internalNote"],
                    "advertencias": ", ".join(c.get("advertencias", [])),
                    "cliente_raw": c["raw"]["client_raw"],
                }
            )
        pd.DataFrame(filas_excel).to_excel(PASO1_XLSX, index=False)

        advertencias = sum(len(c.get("advertencias", [])) for c in clientes)
        reporte = {
            "paso": "01_extraer",
            "origen": str(ORIGEN),
            "filas_leidas": len(df),
            "clientes_generados": len(clientes),
            "advertencias": advertencias,
            "salidas": [str(PASO1_JSON), str(PASO1_XLSX)],
        }
        guardar_reporte(PASO1_REPORT, reporte)

        return PasoResultado(
            estado=EstadoPaso.COMPLETADO,
            mensaje=f"Extraídos {len(clientes)} clientes desde Excel",
            detalle=reporte,
        )

    return ejecutar_paso(
        paso_id="01_extraer",
        salida=PASO1_JSON,
        forzar=forzar,
        ejecutar=_run,
    )


def paso02_validar(*, forzar: bool = False) -> dict:
    def _run() -> PasoResultado:
        if not PASO1_JSON.exists():
            raise FileNotFoundError(
                f"Falta {PASO1_JSON.name}. Ejecutá primero el paso 01."
            )

        import json

        from common.validators import validar_extracto

        extracto = json.loads(PASO1_JSON.read_text(encoding="utf-8"))
        errores, advertencias = validar_extracto(extracto)

        validado = {
            **extracto,
            "validacion": {
                "errores": errores,
                "advertencias": advertencias,
                "valido": len(errores) == 0,
            },
        }
        guardar_json(PASO2_JSON, validado)

        reporte = {
            "paso": "02_validar",
            "valido": len(errores) == 0,
            "errores": errores,
            "advertencias": advertencias,
            "total_clientes": extracto.get("total", 0),
        }
        guardar_reporte(PASO2_REPORT, reporte)

        if errores:
            return PasoResultado(
                estado=EstadoPaso.ERROR,
                mensaje=f"Validación fallida con {len(errores)} error(es)",
                detalle=reporte,
            )

        return PasoResultado(
            estado=EstadoPaso.COMPLETADO,
            mensaje=f"Validación OK ({len(advertencias)} advertencia(s))",
            detalle=reporte,
        )

    return ejecutar_paso(
        paso_id="02_validar",
        salida=PASO2_JSON,
        forzar=forzar,
        ejecutar=_run,
    )


def paso03_cargar_db(*, forzar: bool = False, dry_run: bool = False) -> dict:
    def _run() -> PasoResultado:
        import json

        if not PASO2_JSON.exists():
            raise FileNotFoundError(
                f"Falta {PASO2_JSON.name}. Ejecutá primero el paso 02."
            )

        validado = json.loads(PASO2_JSON.read_text(encoding="utf-8"))
        if not validado.get("validacion", {}).get("valido"):
            raise ValueError("El JSON validado contiene errores. Revisá paso02_report.json")

        from common.db import cargar_clientes

        clientes = validado["clientes"]
        resultado = cargar_clientes(
            clientes,
            dry_run=dry_run,
            omitir_existentes=True,
        )

        reporte = {
            "paso": "03_cargar_db",
            "dry_run": dry_run,
            **resultado,
        }
        guardar_reporte(PASO3_REPORT, reporte)

        if resultado["errores"]:
            return PasoResultado(
                estado=EstadoPaso.ERROR,
                mensaje=f"Carga con {len(resultado['errores'])} error(es)",
                detalle=reporte,
            )

        accion = "Simulación" if dry_run else "Carga"
        return PasoResultado(
            estado=EstadoPaso.COMPLETADO,
            mensaje=(
                f"{accion}: +{resultado['insertados']} insertados, "
                f"{resultado['actualizados']} actualizados, "
                f"{resultado['omitidos']} omitidos"
            ),
            detalle=reporte,
        )

    return ejecutar_paso(
        paso_id="03_cargar_db",
        salida=PASO3_REPORT,
        forzar=forzar,
        ejecutar=_run,
    )


def ejecutar_todos(*, forzar: bool = False, dry_run: bool = False) -> dict[str, dict]:
    return {
        "01_extraer": paso01_extraer(forzar=forzar),
        "02_validar": paso02_validar(forzar=forzar),
        "03_cargar_db": paso03_cargar_db(forzar=forzar, dry_run=dry_run),
    }


PROCESO = ProcesoDef(
    id=PROCESO_ID,
    nombre="Embarcaciones y clientes",
    origen=ORIGEN,
    salida_dir=SALIDA,
    pasos=(
        ("01_extraer", "Extraer Excel a JSON/Excel normalizado", paso01_extraer),
        ("02_validar", "Validar estructura y reglas", paso02_validar),
        ("03_cargar_db", "Cargar a PostgreSQL", paso03_cargar_db),
    ),
)
