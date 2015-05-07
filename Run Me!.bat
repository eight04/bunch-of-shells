:: This shell will execute the file passed in.
:: Usage:
::   runme "File"

@echo off
CD /D %~dp1
FOR %%i IN (.py .pyw .c .cpp .less .js) DO (
	IF %~x1 EQU %i GOTO %~x1
)
cmd /c start "" /d"%~dp1" "%~nx1"
GOTO exit

:.py
:.pyw
	:: Run python script
	py "%~n1%~x1"
	GOTO end
	
	
:.c
	:: Compile C
	gcc -lm -O2 -pipe -DONLINE_JUDGE -o %~n1.exe %~n1%~x1
	if errorlevel 1 goto end
	echo Compile finished..
	GOTO execute

:.cpp
	:: Compile CPP
	g++ -lm -O2 -pipe -DONLINE_JUDGE -o %~n1.exe %~n1%~x1
	if errorlevel 1 goto end
	echo Compile finished..
	GOTO execute
	
:execute
	:: Execute
	%~n1
	goto end
	
:.less
	:: Compile Less
	lessc %~n1%~x1
	goto end
	
:.js
	:: Run node script
	set "NODE_PATH=C:\Users\Owner\AppData\Roaming\npm\node_modules"
	node %~n1%~x1
	goto end
	
:end
	echo.
	PAUSE

:exit
