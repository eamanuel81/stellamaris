from __future__ import annotations

import re
import unicodedata
import uuid
from typing import Any


def normalizar_texto(valor: str | None) -> str:
    if valor is None:
        return ""
    texto = str(valor).strip()
    texto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in texto if not unicodedata.combining(c))


def normalizar_clave(valor: str | None) -> str:
    return normalizar_texto(valor).upper()


def parsear_nombre_cliente(raw: str) -> dict[str, Any]:
    """
    Convierte 'APELLIDO, Nombre' en firstName/lastName.
    Casos complejos quedan en internalNote.
    """
    original = str(raw).strip()
    limpio = re.sub(r"\s+", " ", original)

    advertencias: list[str] = []
    nota_extra = ""

    if "/" in limpio or re.search(r"\([^)]+\)", limpio):
        advertencias.append("nombre_compuesto_o_con_nota")

    base = limpio
    match_nota = re.search(r"\(([^)]+)\)", base)
    if match_nota:
        nota_extra = match_nota.group(1).strip()
        base = re.sub(r"\s*\([^)]+\)", "", base).strip()

    if "/" in base:
        advertencias.append("multiples_titulares")
        parte = base.split("/")[0].strip()
    else:
        parte = base

    if "," not in parte:
        return {
            "firstName": parte,
            "lastName": "",
            "internalNote": original if original != parte else nota_extra,
            "advertencias": advertencias + (["sin_coma"] if not parte else []),
            "raw": original,
        }

    apellido, nombres = parte.split(",", 1)
    first_name = nombres.strip()
    last_name = apellido.strip()

    notas = []
    if nota_extra:
        notas.append(nota_extra)
    if original != parte:
        notas.append(original)

    return {
        "firstName": first_name,
        "lastName": last_name,
        "internalNote": " | ".join(notas),
        "advertencias": advertencias,
        "raw": original,
    }


def inferir_embarcacion(boat_name: Any, client_raw: str, registration: Any) -> dict[str, Any]:
    boat = normalizar_texto(str(boat_name) if boat_name is not None and str(boat_name) != "nan" else "")
    reg = normalizar_texto(str(registration) if registration is not None and str(registration) != "nan" else "")
    raw = normalizar_texto(client_raw)

    hull_type = ""
    advertencias: list[str] = []

    if not boat:
        if "moto" in raw.lower() or reg.lower() in {"e/t", "et"}:
            boat = "Moto de agua"
            hull_type = "Moto de agua"
            advertencias.append("embarcacion_inferida")
        else:
            boat = "Sin nombre"
            advertencias.append("embarcacion_sin_nombre")

    if boat.lower() in {"moto de agua", "moto"}:
        hull_type = hull_type or "Moto de agua"

    if reg.lower() in {"e/t", "et", "rey e/t"}:
        reg = "e/t"

    return {
        "id": str(uuid.uuid4()),
        "name": boat,
        "hullType": hull_type,
        "engine": "",
        "registrationNumber": reg,
        "photos": [],
        "advertencias": advertencias,
    }


def fila_a_cliente(fila: dict[str, Any], indice: int) -> dict[str, Any]:
    parsed = parsear_nombre_cliente(fila["client_raw"])
    boat = inferir_embarcacion(
        fila.get("boat_name"),
        fila["client_raw"],
        fila.get("registration"),
    )

    advertencias = parsed.get("advertencias", []) + boat.pop("advertencias", [])

    return {
        "sourceRow": indice + 2,
        "firstName": parsed["firstName"],
        "lastName": parsed["lastName"],
        "dni": "",
        "email": "",
        "phone": "",
        "internalNote": parsed.get("internalNote") or "",
        "boats": [boat],
        "responsibles": [],
        "avatarUrl": "",
        "advertencias": advertencias,
        "raw": {
            "boat_name": fila.get("boat_name"),
            "registration": fila.get("registration"),
            "client_raw": fila.get("client_raw"),
        },
    }
