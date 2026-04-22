"""Règles de transition de livraison et confirmation par le client."""

from __future__ import annotations

from typing import Optional, Set

_VALID_NEXT: dict[str, Set[str]] = {
    "en_attente": {"en_route", "en_preparation", "annulee"},
    "en_preparation": {"en_route", "annulee"},
    "en_route": {"livree", "annulee"},
    "livree": set(),
    "annulee": set(),
}


def assert_transition_is_valid(current: str, new: str) -> None:
    allowed = _VALID_NEXT.get(current, set())
    if new not in allowed and new != current:
        raise ValueError(
            f"Transition {current} -> {new} interdite. Étapes possibles: {', '.join(sorted(allowed)) or 'aucune'}"
        )
