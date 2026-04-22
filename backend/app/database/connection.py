"""Connexion MySQL via PyMySQL (requêtes paramétrées, curseur dictionnaire)."""

from contextlib import contextmanager
from typing import Any, Dict, Iterator, List, Optional, Sequence, Tuple, Union

import pymysql
from pymysql.cursors import DictCursor

from app.config import get_settings


Params = Union[Sequence[Any], Tuple[()]]

def _connect():
    s = get_settings()
    return pymysql.connect(
        host=s.mysql_host,
        port=s.mysql_port,
        user=s.mysql_user,
        password=s.mysql_password,
        database=s.mysql_database,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
    )


@contextmanager
def get_db() -> Iterator[pymysql.connections.Connection]:
    """Contexte transactionnel : commit si succès, sinon rollback."""
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetch_one(conn, sql: str, params: Optional[Params] = None) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchone()


def fetch_all(conn, sql: str, params: Optional[Params] = None) -> List[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return list(cur.fetchall())


def execute(conn, sql: str, params: Optional[Params] = None) -> int:
    """Exécute INSERT/UPDATE/DELETE ; retourne rowcount."""
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.rowcount


def last_insert_id(conn) -> int:
    row = fetch_one(conn, "SELECT LAST_INSERT_ID() AS id")
    return int(row["id"]) if row else 0
