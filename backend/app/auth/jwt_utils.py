from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt

from app.config import get_settings


def create_access_token(subject: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    s = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes if expires_minutes is not None else s.jwt_expires_minutes
    )
    to_encode = {**subject, "exp": expire}
    return jwt.encode(to_encode, s.jwt_secret, algorithm=s.jwt_algorithm)


def decode_token(token: str) -> Dict[str, Any]:
    s = get_settings()
    return jwt.decode(token, s.jwt_secret, algorithms=[s.jwt_algorithm])


def safe_decode(token: str) -> Optional[Dict[str, Any]]:
    try:
        return decode_token(token)
    except JWTError:
        return None
