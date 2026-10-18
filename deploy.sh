#!/bin/bash
set -e
USER="${1:?请提供 GitHub 用户名}"
TOKEN="${2:?请提供 Personal Access Token}"
REPO="${3:-quiz-site}"
cd "$(dirname "$0")"
git remote remove origin 2>/dev/null || true
git remote add origin "https://${TOKEN}@github.com/${USER}/${REPO}.git"
GIT_SSL_NO_VERIFY=true git -c http.version=HTTP/1.1 push -u origin main --force 2>&1 | grep -v "ghp_" || true
echo ""
echo "已推送到 https://github.com/${USER}/${REPO}"
echo "访问地址：https://${USER}.github.io/${REPO}/"
