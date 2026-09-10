---
name: devflow
description: Rigorous DevFlow engine integration. Use when the user wants to run devflow commands (review, run, recall, ocs) directly in the chat window.
---

# DevFlow In-Chat Execution Skill

When the user asks to use or call DevFlow directly in this chat window:
1. Do not ask the user to open an external terminal.
2. Directly execute the appropriate command using run_command in the project root (d:\to-do-list):
   - Review: .\devflow.bat review <proposal>
   - Run: .\devflow.bat run <goal> (support --topology <octopus|bee|slime>)
   - Recall: .\devflow.bat recall <query>
   - OCS: .\devflow.bat ocs
3. Parse and present the results clearly in markdown.
