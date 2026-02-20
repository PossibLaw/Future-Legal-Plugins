"""Tests for validate-subagent.py hook script."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = str(Path(__file__).resolve().parent.parent / "scripts" / "validate-subagent.py")


def run_hook(output: str, subagent_type: str = "Explore") -> subprocess.CompletedProcess:
    """Run validate-subagent.py with a simulated SubagentStop payload."""
    payload = json.dumps({
        "tool_input": {"output": output, "subagent_type": subagent_type}
    })
    return subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )


# --- Outputs with incomplete markers (exit 0 + warning) ---


@pytest.mark.parametrize(
    "output,expected_marker",
    [
        ("Found the file. TODO: need to check edge cases", "TODO"),
        ("Implementation is WIP, will finish later", "WIP"),
        ("FIXME: this function has a race condition", "FIXME"),
        ("Used a HACK to get around the issue", "HACK"),
        ("This is a placeholder for the real implementation", "placeholder"),
    ],
)
def test_warns_on_incomplete_markers(output, expected_marker):
    result = run_hook(output)
    assert result.returncode == 0
    parsed = json.loads(result.stdout)
    context = parsed["hookSpecificOutput"]["additionalContext"]
    assert expected_marker.lower() in context.lower()


# --- Outputs with error markers (exit 0 + warning) ---


@pytest.mark.parametrize(
    "output,expected_marker",
    [
        ("BLOCKED: Could not access the API", "BLOCKED"),
        ("FAILED: Test suite did not pass", "FAILED"),
        ("ERROR: File not found at the expected path", "ERROR"),
        ("I was unable to find the configuration file", "unable to"),
    ],
)
def test_warns_on_error_markers(output, expected_marker):
    result = run_hook(output)
    assert result.returncode == 0
    parsed = json.loads(result.stdout)
    context = parsed["hookSpecificOutput"]["additionalContext"]
    assert expected_marker.lower() in context.lower()


# --- Clean outputs (exit 0, no warning) ---


@pytest.mark.parametrize(
    "output",
    [
        "Found 3 files matching the pattern. All tests pass.",
        "The authentication module uses JWT tokens with RS256 signing.",
        "Completed analysis. The codebase follows a clean MVC architecture.",
    ],
)
def test_clean_output(output):
    result = run_hook(output)
    assert result.returncode == 0
    assert result.stdout.strip() == ""


# --- Edge cases ---


def test_empty_output():
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
