sc query uxsms | FIND "STATE" | FIND "RUNNING"
IF errorlevel 1 (
	net start uxsms
) ELSE (
	net stop uxsms
)
