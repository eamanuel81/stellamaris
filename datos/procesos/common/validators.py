from __future__ import annotations

from typing import Any

from jsonschema import Draft202012Validator

CLIENTE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["firstName", "lastName", "boats"],
    "properties": {
        "sourceRow": {"type": "integer"},
        "firstName": {"type": "string", "minLength": 1},
        "lastName": {"type": "string"},
        "dni": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "internalNote": {"type": "string"},
        "boats": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "name", "registrationNumber"],
                "properties": {
                    "id": {"type": "string", "minLength": 1},
                    "name": {"type": "string", "minLength": 1},
                    "hullType": {"type": "string"},
                    "engine": {"type": "string"},
                    "registrationNumber": {"type": "string"},
                    "photos": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
        "responsibles": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "firstName", "lastName", "dni", "phone"],
                "properties": {
                    "id": {"type": "string"},
                    "firstName": {"type": "string"},
                    "lastName": {"type": "string"},
                    "dni": {"type": "string"},
                    "phone": {"type": "string"},
                },
            },
        },
        "avatarUrl": {"type": "string"},
        "advertencias": {"type": "array", "items": {"type": "string"}},
        "raw": {"type": "object"},
    },
}

EXTRACTO_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["proceso", "origen", "total", "clientes"],
    "properties": {
        "proceso": {"type": "string"},
        "origen": {"type": "string"},
        "total": {"type": "integer", "minimum": 0},
        "clientes": {"type": "array", "items": CLIENTE_SCHEMA},
    },
}


def validar_extracto(data: dict[str, Any]) -> tuple[list[str], list[str]]:
    errores: list[str] = []
    advertencias: list[str] = []

    validator = Draft202012Validator(EXTRACTO_SCHEMA)
    for error in sorted(validator.iter_errors(data), key=lambda e: list(e.path)):
        errores.append(f"{list(error.path)}: {error.message}")

    claves_vistas: dict[str, int] = {}
    for cliente in data.get("clientes", []):
        clave = f"{cliente.get('lastName', '').strip().upper()}|{cliente.get('firstName', '').strip().upper()}"
        if clave in claves_vistas:
            advertencias.append(
                f"Posible duplicado fila {cliente.get('sourceRow')} y {claves_vistas[clave]}"
            )
        else:
            claves_vistas[clave] = cliente.get("sourceRow", 0)

        for adv in cliente.get("advertencias", []):
            advertencias.append(f"Fila {cliente.get('sourceRow')}: {adv}")

        if not cliente.get("lastName"):
            advertencias.append(
                f"Fila {cliente.get('sourceRow')}: apellido vacío tras parseo"
            )

    return errores, advertencias
