@echo off
for /f "skip=2 tokens=2*" %%a in ('REG QUERY HKEY_CURRENT_USER\Software\Classes\http\shell\open\command /ve') do (
	set command=%%b
)
call %command%
