@echo off
setlocal
cd /d "%~dp0"
if not exist "KANJI_QUEST_PC.html" goto missing
start "" "%CD%\KANJI_QUEST_PC.html"
if errorlevel 1 goto failed
exit /b 0

:missing
echo ERROR: KANJI_QUEST_PC.html was not found.
pause
exit /b 1

:failed
echo ERROR: Could not open the HTML file.
echo Double-click KANJI_QUEST_PC.html directly.
pause
exit /b 1
