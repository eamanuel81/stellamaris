from __future__ import annotations

import re
from typing import Any

import psycopg2
from psycopg2.extras import Json

from .config import get_database_schema, get_database_url
from .parsers import normalizar_clave


def _url_psycopg2() -> str:
    url = get_database_url()
    return url.split("?", 1)[0]


def conectar():
    schema = get_database_schema()
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", schema):
        raise ValueError(f"DATABASE_SCHEMA invalido: {schema}")

    conn = psycopg2.connect(_url_psycopg2())
    with conn.cursor() as cur:
        cur.execute(f"SET search_path TO {schema}")
    conn.commit()
    return conn


def buscar_cliente_existente(cur, first_name: str, last_name: str) -> dict[str, Any] | None:
    schema = get_database_schema()
    cur.execute(
        f"""
        SELECT id, first_name, last_name, email, boats
        FROM {schema}.clients
        """
    )
    objetivo_nombre = normalizar_clave(first_name)
    objetivo_apellido = normalizar_clave(last_name)
    for row in cur.fetchall():
        if normalizar_clave(row[1]) == objetivo_nombre and normalizar_clave(row[2]) == objetivo_apellido:
            return {
                "id": str(row[0]),
                "firstName": row[1],
                "lastName": row[2],
                "email": row[3],
                "boats": row[4] or [],
            }
    return None


def embarcacion_existe(boats: list[dict[str, Any]], registration: str, name: str) -> bool:
    reg = normalizar_clave(registration)
    nombre = normalizar_clave(name)
    for boat in boats:
        if reg and normalizar_clave(boat.get("registrationNumber")) == reg:
            return True
        if not reg and normalizar_clave(boat.get("name")) == nombre:
            return True
    return False


def insertar_cliente(cur, cliente: dict[str, Any]) -> str:
    schema = get_database_schema()
    payload = {
        "first_name": cliente["firstName"],
        "last_name": cliente["lastName"],
        "dni": cliente.get("dni") or None,
        "email": cliente.get("email") or None,
        "phone": cliente.get("phone") or None,
        "internal_note": cliente.get("internalNote") or None,
        "boats": cliente.get("boats") or [],
        "responsibles": cliente.get("responsibles") or [],
        "avatar_url": cliente.get("avatarUrl") or None,
    }
    cur.execute(
        f"""
        INSERT INTO {schema}.clients
            (first_name, last_name, dni, email, phone, internal_note, boats, responsibles, avatar_url)
        VALUES (%(first_name)s, %(last_name)s, %(dni)s, %(email)s, %(phone)s,
                %(internal_note)s, %(boats)s, %(responsibles)s, %(avatar_url)s)
        RETURNING id
        """,
        {
            **payload,
            "boats": Json(payload["boats"]),
            "responsibles": Json(payload["responsibles"]),
        },
    )
    return str(cur.fetchone()[0])


def agregar_embarcacion(cur, client_id: str, boats: list[dict[str, Any]], nueva: dict[str, Any]) -> None:
    schema = get_database_schema()
    actualizadas = [*boats, nueva]
    cur.execute(
        f"UPDATE {schema}.clients SET boats = %s WHERE id = %s",
        (Json(actualizadas), client_id),
    )


def cargar_clientes(
    clientes: list[dict[str, Any]],
    *,
    dry_run: bool = False,
    omitir_existentes: bool = True,
) -> dict[str, Any]:
    insertados = 0
    actualizados = 0
    omitidos = 0
    errores: list[str] = []

    conn = conectar()
    try:
        with conn:
            with conn.cursor() as cur:
                for cliente in clientes:
                    try:
                        existente = buscar_cliente_existente(
                            cur, cliente["firstName"], cliente["lastName"]
                        )
                        nueva_boat = cliente["boats"][0]

                        if existente:
                            if omitir_existentes:
                                if embarcacion_existe(
                                    existente["boats"],
                                    nueva_boat.get("registrationNumber", ""),
                                    nueva_boat.get("name", ""),
                                ):
                                    omitidos += 1
                                    continue
                                if dry_run:
                                    actualizados += 1
                                    continue
                                agregar_embarcacion(
                                    cur, existente["id"], existente["boats"], nueva_boat
                                )
                                actualizados += 1
                                continue

                            omitidos += 1
                            continue

                        if dry_run:
                            insertados += 1
                            continue

                        insertar_cliente(cur, cliente)
                        insertados += 1
                    except Exception as exc:  # noqa: BLE001
                        errores.append(
                            f"Fila {cliente.get('sourceRow')}: {exc}"
                        )
    finally:
        conn.close()

    return {
        "insertados": insertados,
        "actualizados": actualizados,
        "omitidos": omitidos,
        "errores": errores,
        "dry_run": dry_run,
    }
