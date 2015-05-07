@echo off
CD /D %~dp1
REM echo %~dp1
REM pause
if %~x1 == .py goto %~x1
if %~x1 == .pyw goto %~x1
if %~x1 == .c goto %~x1
if %~x1 == .cpp goto %~x1
if %~x1 == .less goto %~x1
if %~x1 == .js goto %~x1
REM START /b CALL "%~nx1"
cmd /c start "" /d"%~dp1" "%~nx1"
goto exit


:.py
:.pyw
	REM chcp 950
	py "%~n1%~x1"
	GOTO end
	
	
:.c
	gcc -lm -O2 -pipe -DONLINE_JUDGE -o %~n1.exe %~n1%~x1
	if errorlevel 1 goto end
	echo Compile finished..
	echo.
	%~n1
	goto end

:.cpp
	g++ -lm -O2 -pipe -DONLINE_JUDGE -o %~n1.exe %~n1%~x1
	if errorlevel 1 goto end
	echo Compile finished.
	%~n1
	goto end
	
:.less
	lessc %~n1%~x1
	goto end
	
:.js
	set "NODE_PATH=C:\Users\Owner\AppData\Roaming\npm\node_modules"
	node %~n1%~x1
	goto end
	
:end
	echo.
	PAUSE

:exit
