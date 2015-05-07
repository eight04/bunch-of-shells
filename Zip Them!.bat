@echo off
set "exe7z="C:\Program Files\7-Zip\7z.exe""
if {%1}=={} goto exit

:top
set "dir=%~d1%~p1"
SET "filename=%~n1%~x1"
cd /D "%dir%"
%exe7z% a "%filename%.zip" "%filename%"
rd /S /Q "%filename%"
shift
if {%1}=={} goto end
goto top

:end
echo Âà´«§¹¦¨
pause

:exit