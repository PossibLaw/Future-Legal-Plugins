"""Tests for protect-files.py hook script."""

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = str(Path(__file__).resolve().parent.parent / "scripts" / "protect-files.py")


def run_hook(file_path: str) -> subprocess.CompletedProcess:
    """Run protect-files.py with a simulated tool input payload."""
    payload = json.dumps({"tool_name": "Write", "tool_input": {"file_path": file_path}})
    return subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )


# --- Protected files (exit 2) ---


@pytest.mark.parametrize(
    "file_path",
    [
        ".env",
        "/project/.env",
        ".env.production",
        ".env.local",
        ".git/config",
        "/home/user/.gitconfig",
        "/home/user/.ssh/id_rsa",
        "id_rsa",
        "id_ed25519",
        "server.pem",
        "private.key",
        "credentials.json",
        "/app/credentials.json",
        "secrets.yaml",
        "token.secret",
        "/home/user/.ssh/config",
        "/home/user/.aws/credentials",
    ],
    ids=lambda p: p.replace("/", "_")[:40],
)
def test_protected_files(file_path):
    result = run_hook(file_path)
    assert result.returncode == 2, f"Expected exit 2 for: {file_path}"
    assert "BLOCKED" in result.stderr


# --- Safe files (exit 0) ---


@pytest.mark.parametrize(
    "file_path",
    [
        "src/main.py",
        "README.md",
        "package.json",
        "src/components/App.tsx",
        "Makefile",
        "docker-compose.yml",
        "tsconfig.json",
        ".gitignore",
    ],
    ids=lambda p: p.replace("/", "_")[:40],
)
def test_safe_files(file_path):
    result = run_hook(file_path)
    assert result.returncode == 0, f"Expected exit 0 for: {file_path}"
    assert result.stderr.strip() == ""


# --- Edge cases ---


def test_empty_file_path():
    result = run_hook("")
    assert result.returncode == 0


def test_invalid_json():
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input="not json",
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0


def test_missing_file_path_field():
    payload = json.dumps({"tool_name": "Write", "tool_input": {}})
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0


def test_edit_tool_input():
    """Verify hook works with Edit tool input format too."""
    payload = json.dumps({
        "tool_name": "Edit",
        "tool_input": {
            "file_path": ".env",
            "old_string": "KEY=old",
            "new_string": "KEY=new",
        },
    })
    proc = subprocess.run(
        [sys.executable, SCRIPT],
        input=payload,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 2
    assert "BLOCKED" in proc.stderr
