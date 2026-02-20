"""Tests for persist-state.py hook script."""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

SCRIPT = str(Path(__file__).resolve().parent.parent / "scripts" / "persist-state.py")


def run_hook(project_dir: str, stdin_data: str = "{}") -> subprocess.CompletedProcess:
    """Run persist-state.py with CLAUDE_PROJECT_DIR set."""
    env = os.environ.copy()
    env["CLAUDE_PROJECT_DIR"] = project_dir
    return subprocess.run(
        [sys.executable, SCRIPT],
        input=stdin_data,
        capture_output=True,
        text=True,
        env=env,
    )


def test_creates_compact_state_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        result = run_hook(tmpdir)
        assert result.returncode == 0
        state_file = Path(tmpdir) / ".agent" / "COMPACT_STATE.md"
        assert state_file.exists()
        content = state_file.read_text()
        assert "Compact at" in content
        assert "Context was compressed" in content


def test_detects_plan_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        agent_dir = Path(tmpdir) / ".agent"
        agent_dir.mkdir()
        (agent_dir / "PLAN.md").write_text("# Plan")
        result = run_hook(tmpdir)
        assert result.returncode == 0
        content = (agent_dir / "COMPACT_STATE.md").read_text()
        assert "Active plan" in content


def test_detects_tasks_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        agent_dir = Path(tmpdir) / ".agent"
        agent_dir.mkdir()
        (agent_dir / "TASKS.md").write_text("# Tasks")
        result = run_hook(tmpdir)
        assert result.returncode == 0
        content = (agent_dir / "COMPACT_STATE.md").read_text()
        assert "Task list" in content


def test_outputs_additional_context():
    with tempfile.TemporaryDirectory() as tmpdir:
        result = run_hook(tmpdir)
        assert result.returncode == 0
        output = json.loads(result.stdout)
        context = output["hookSpecificOutput"]["additionalContext"]
        assert "COMPACT_STATE.md" in context


def test_appends_to_existing_state():
    with tempfile.TemporaryDirectory() as tmpdir:
        agent_dir = Path(tmpdir) / ".agent"
        agent_dir.mkdir()
        (agent_dir / "COMPACT_STATE.md").write_text("# Previous state\n\nOld entry.\n")
        result = run_hook(tmpdir)
        assert result.returncode == 0
        content = (agent_dir / "COMPACT_STATE.md").read_text()
        assert "Previous state" in content
        assert "Compact at" in content


def test_handles_invalid_json():
    with tempfile.TemporaryDirectory() as tmpdir:
        result = run_hook(tmpdir, stdin_data="not json")
        assert result.returncode == 0
