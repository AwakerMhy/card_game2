---
name: version-and-push
description: Summarizes current code changes as a version, appends an entry to docs/PROJECT_LOG.md, updates package.json version, then commits and pushes with message "version X.Y.Z". Use when the user says to record current changes as a version (e.g. 将当前改动作为一个版本) or to version and push.
---

# Version and Push

## When to Use

Apply this skill when the user asks to **record current changes as a version** (e.g. 「将当前改动作为一个版本」) or to create a version and push.

## Steps

### 1. Summarize changes

- Run `git status` and `git diff` (or `git diff --staged`) to see what changed.
- Optionally use recent conversation context to describe the changes in short bullet points (功能/UI/修复/重构等).

### 2. Determine next version

- Open `docs/PROJECT_LOG.md` and read the **五、版本历史** table.
- Take the last version in the table (e.g. `0.5.0`); the new version is the next **minor** (e.g. `0.5.0` → `0.6.0`). If the project uses patch bumps for small fixes, use next **patch** (e.g. `0.5.0` → `0.5.1`). Prefer minor for feature/UI/logic changes.
- Note the last **改动** number in **三、后期改动记录** (e.g. 改动 12); the new entry is 改动 N+1.

### 3. Update docs

- In `docs/PROJECT_LOG.md`:
  - Before **## 四、文件变更总览**, add a new subsection:
    - **### 改动 N：简短标题（vX.Y.Z）**
    - **日期**：当前日期（YYYY-MM-DD）
    - **改动内容**：用简洁条目列出本次改动（可分行、分小标题）
    - **涉及文件**：列出本版本修改/新增的文件路径
  - In **五、版本历史** table, add one row: `| X.Y.Z | YYYY-MM-DD | 一句话主要变更 |`
- Keep style consistent with existing 改动 12 and version table.

### 4. Update package version

- In `package.json`, set `"version": "X.Y.Z"` to the same version used above.

### 5. Git commit and push

- Stage all changes: `git add .`
- Commit with message exactly: `version X.Y.Z` (e.g. `version 0.6.0`)
- Push: `git push -u origin main`

Use a single commit; message format is **only** `version X.Y.Z`.

## PROJECT_LOG.md structure reference

- **三、后期改动记录**：多个 **### 改动 N：...**，每个含 日期、改动内容、涉及文件。
- **五、版本历史**：表格，列 版本、日期、主要变更。
- New 改动 is inserted **before** `## 四、文件变更总览`.

## Commit and push commands

```bash
git add .
git commit -m "version X.Y.Z"
git push -u origin main
```

Replace `X.Y.Z` with the version chosen in step 2.
