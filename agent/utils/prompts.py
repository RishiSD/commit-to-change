"""Prompt loading utilities."""

from typing import Dict

import opik

_PROMPT_CACHE: Dict[str, str] = {}


def _load_prompt(name: str) -> str:
    opik_client = opik.Opik()
    opik_prompt = opik_client.get_prompt(name=name)
    if not opik_prompt:
        raise Exception(
            f"Prompt '{name}' not found in Opik. "
            'Please create it in the Opik dashboard before running the agent.'
        )
    return opik_prompt.prompt


def get_prompt(name: str) -> str:
    if name not in _PROMPT_CACHE:
        _PROMPT_CACHE[name] = _load_prompt(name)
    return _PROMPT_CACHE[name]


SYSTEM_PROMPT = get_prompt('AuraChef system')
VALIDATE_AND_FORMAT_PROMPT = get_prompt('AuraChef validate and format')
EXTRACT_RECIPE_NAME_PROMPT = get_prompt('AuraChef extract recipe name')
# GENERATE_RECIPE_PROMPT = get_prompt('AuraChef generate recipe')
