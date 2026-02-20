"""Tests for sanitize-input.py hook script."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = str(Path(__file__).resolve().parent.parent / "scripts" / "sanitize-input.py")


def run_hook(user_prompt: str) -> subprocess.CompletedProcess:
    """Run sanitize-input.py with a simulated UserPromptSubmit payload."""
    payload = json.dumps({"tool_input": {"user_prompt": user_prompt}})
    return subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )


# --- Prompts containing secrets (exit 0 + additionalContext warning) ---


@pytest.mark.parametrize(
    "prompt,expected_fragment",
    [
        ("Please use my key sk-live-abcdefghijklmnopqrstuvwx to call the API", "API key"),
        ("My GitHub token is ghp_abcdefghijklmnopqrstuvwxyz0123456789", "GitHub personal access token"),
        ("Use this GitLab token glpat-abcdefghijklmnopqrst to deploy", "GitLab personal access token"),
        ("Slack token: xoxb-1234567890-abcdefghij", "Slack token"),
        ("AWS key AKIAIOSFODNN7EXAMPLE for the bucket", "AWS access key"),
        ("-----BEGIN RSA PRIVATE KEY----- here is my key", "Private key"),
        ('Set password="SuperSecret123!" in the config', "Hardcoded password"),
        ("Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0", "JWT token"),
    ],
    ids=lambda x: str(x)[:50],
)
def test_warns_on_secrets(prompt, expected_fragment):
    result = run_hook(prompt)
    assert result.returncode == 0
    output = json.loads(result.stdout)
    context = output["hookSpecificOutput"]["additionalContext"]
    assert "WARNING" in context
    assert expected_fragment in context


# --- Clean prompts (exit 0, no output) ---


@pytest.mark.parametrize(
    "prompt",
    [
        "Please fix the bug in the login function",
        "Add a new test for the user model",
        "How do I configure prettier for this project?",
        "Refactor the database connection to use a pool",
    ],
)
def test_clean_prompts(prompt):
    result = run_hook(prompt)
    assert result.returncode == 0
    assert result.stdout.strip() == ""


# --- Edge cases ---


def test_short_prompt_skipped():
    """Prompts shorter than MIN_CHECK_LENGTH are skipped."""
    result = run_hook("sk-live-x")
    assert result.returncode == 0
    assert result.stdout.strip() == ""


def test_empty_prompt():
    result = run_hook("")
    assert result.returncode == 0
    assert result.stdout.strip() == ""


def test_invalid_json():
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input="not json",
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0


def test_missing_prompt_field():
    payload = json.dumps({"tool_input": {}})
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0
