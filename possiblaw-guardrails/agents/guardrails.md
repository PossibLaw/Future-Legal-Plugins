---
name: guardrails
description: Manage and view active Claude Code guardrails and safety hooks.
argument-hint: [optional status or rule check]
allowed-tools: Read
---

# /possiblaw:guardrails

View the active safety guardrails protecting your workspace.

## Overview

The PossibLaw guardrails plugin operates globally by installing safety hooks in your environment. These hooks intercept dangerous actions before they execute.

## Active Protections

By default, the guardrails plugin monitors for:
1. **Destructive Commands:** Blocks dangerous commands like `rm -rf` or file formatters.
2. **Stop Prompts Validation:** Safely manages state when waiting for user input.
3. **Sensitive File Edits:** Warns when credentials or critical files are modified.

To see the exact rules and prompt changes applied, review your local `.claude/settings.json` or the plugin's `hooks.json` files.

## Usage

This is a read-only command. The actual guardrails apply automatically to every conversation while the plugin is installed.
