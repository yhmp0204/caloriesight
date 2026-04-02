@echo off
chcp 65001 >nul
echo.
echo ============================================
echo   CalorieSight デプロイスクリプト
echo ============================================
echo.

REM === 設定 ===
set GITHUB_USER=yhmp0204
set REPO_NAME=caloriesight

echo [1/5] GitHubにリポジトリを作成中...
curl -s -X POST https://api.github.com/user/repos ^
  -H "Authorization: token %GITHUB_TOKEN%" ^
  -H "Accept: application/vnd.github.v3+json" ^
  -d "{\"name\":\"%REPO_NAME%\",\"description\":\"AI食事管理アプリ - カロリー収支管理PWA\",\"homepage\":\"https://%GITHUB_USER%.github.io/%REPO_NAME%/\",\"private\":false}" >nul 2>&1
echo    完了

echo [2/5] Gitリポジトリを初期化中...
git init >nul 2>&1
git remote remove origin >nul 2>&1
git remote add origin https://%GITHUB_USER%:%GITHUB_TOKEN%@github.com/%GITHUB_USER%/%REPO_NAME%.git
echo    完了

echo [3/5] ファイルをコミット中...
git add -A >nul 2>&1
git commit -m "Initial commit: CalorieSight v0.2" >nul 2>&1
echo    完了

echo [4/5] GitHubにプッシュ中...
git branch -M main >nul 2>&1
git push -u origin main >nul 2>&1
echo    完了

echo [5/5] GitHub Pagesにデプロイ中...
call npm run deploy >nul 2>&1
echo    完了

echo.
echo ============================================
echo   デプロイ完了！
echo.
echo   URL: https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo.
echo   ※反映まで1-2分かかることがあります
echo ============================================
echo.
pause
