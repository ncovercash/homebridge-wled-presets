# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### CI (`ci.yml`)
Runs on every push and pull request to main/master/develop branches:
- Tests on Node.js 18.x and 20.x
- Linting
- Test coverage generation
- Build verification

### Release (`release.yml`)
Runs when a tag starting with `v` is pushed:
- Creates GitHub Release with release notes
- Automatically extracts version from tag

### NPM Publish (`npm-publish.yml`)
Runs when a GitHub Release is published:
- Publishes package to NPM
- Requires `NPM_TOKEN` secret to be set

## Setup Instructions

### 1. Enable GitHub Actions
- Go to Repository Settings → Actions → General
- Enable "Allow all actions and reusable workflows"
- Set "Workflow permissions" to "Read and write permissions"

### 2. Add NPM Token (for automatic publishing)
- Go to Repository Settings → Secrets and variables → Actions
- Add new secret: `NPM_TOKEN`
- Get token from: https://www.npmjs.com/settings/[your-username]/tokens
- Create "Automation" token with "Publish" permission

### 3. Ensure package-lock.json is committed
The workflows use `npm ci` which requires `package-lock.json` to be in the repository:
```bash
# If package-lock.json is missing or out of sync:
npm install --package-lock-only
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

## Troubleshooting

### npm ci fails with "package.json and package-lock.json are out of sync"
1. Run `npm install` locally to update package-lock.json
2. Commit and push the updated package-lock.json
3. Ensure package-lock.json is NOT in .gitignore

### Build fails in CI
- Check that all dependencies are listed in package.json
- Ensure package-lock.json is committed
- Verify Node.js version compatibility

### Release not created
- Ensure tag starts with `v` (e.g., `v2.0.0`)
- Check that tag is pushed to remote: `git push origin v2.0.0`

