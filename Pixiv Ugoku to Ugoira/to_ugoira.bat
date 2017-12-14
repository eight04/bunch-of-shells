@ECHO off
py %0\..\pixiv_ugoku_to_ugoira.py %*
if %errorlevel% neq 0 pause
