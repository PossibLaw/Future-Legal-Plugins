"""Tests for validate-task.py hook script."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = str(Path(__file__).resolve().parent.parent / "scripts" / "validate-task.py")


def run_hook(output: str, subject: str = "Test task") -> subprocess.CompletedProcess:
    """Run validate-task.py with a simulated TaskCompleted payload."""
    payload = json.dumps({
        "tool_input": {"output": output, "subject": subject}
    })
    return subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )


# --- Empty or too-short output (exit 0 + warning) ---


def test_warns_on_empty_output():
    result = run_hook("")
    assert result.returncode == 0
    parsed = json.loads(result.stdout)
    context = parsed["hookSpecificOutput"]["additionalContext"]
    assert "no output" in context


def test_warns_on_short_output():
    result = run_hook("Done.")
    assert result.returncode == 0
    parsed = json.loads(result.stdout)
    context = parsed["hookSpecificOutput"]["additionalContext"]
    assert "very short output" in context


# --- Deferral signals (exit 0 + warning) ---


@pytest.mark.parametrize(
    "output,expected_signal",
    [
        ("I'll complete this but skipping for now to focus on higher priority", "skipping for now"),
        ("This feature is out of scope for the current task", "out of scope"),
        ("Added a TODO marker for later implementation", "TODO"),
        ("There's a FIXME in the generated code that needs attention", "FIXME"),
    ],
)
def test_warns_on_deferral_signals(output, expected_signal):
    result = run_hook(output)
    assert result.returncode == 0
    parsed = json.loads(result.stdout)
    context = parsed["hookSpecificOutput"]["additionalContext"]
    assert expected_signal in context or expected_signal.upper() in context


# --- Clean task output (exit 0, no warning) ---


@pytest.mark.parametrize(
    "output",
    [
        "Successfully refactored the authentication module. All 12 tests pass.",
        "Created the new API endpoint at /api/v2/users with full CRUD operations.",
        "Fixed the race condition in the connection pool by adding a mutex lock.",
    ],
)
def test_clean_task_output(output):
    result = run_hook(output)
    assert result.returncode == 0
    assert result.stdout.strip() == ""


# --- Edge cases ---


def test_invalid_json():
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input="not json",
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0


def test_missing_output_field():
    payload = json.dumps({"tool_input": {"subject": "Test"}})
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0
