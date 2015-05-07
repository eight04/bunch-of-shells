@echo off
set "ffmpeg="C:\Program Files\ffmpeg-git-1eabd71-win32-shared\bin\ffmpeg.exe""
if {%1}=={} goto end
:top
set "dir=%~d1%~p1"
set "filename=%~n1"
set "extension=%~x1"
set "audio="
if {%extension%}=={.webm} set "audio=.ogg"
if {%extension%}=={.mp4} set "audio=.m4a"
if {%extension%}=={.flv} set "audio=.aac"
if not {%audio%}=={} goto convert
echo 不支援的檔案格式
:convert_
shift
if {%1}=={} goto end
goto top

:convert
cd /D "%dir%"
move %1 ".\convert_temp_video"
%ffmpeg% -i ".\convert_temp_video" -vn -acodec copy ".\convert_temp_audio%audio%"
move ".\convert_temp_video" %1
move ".\convert_temp_audio%audio%" "%dir%%filename%%audio%"
goto convert_

:end
echo 轉換完成
pause

:exit