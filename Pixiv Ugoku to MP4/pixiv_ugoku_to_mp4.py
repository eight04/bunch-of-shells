#! python3

"""Convert pixiv ugoku zip into mp4"""

import sys
import re
import execjs
import subprocess
import io
import traceback

from zipfile import ZipFile
from pathlib import Path
from tempfile import TemporaryDirectory

from send2trash import send2trash
from comiccrawler.core import Downloader
from comiccrawler.mods import pixiv

FFMPEG = r"D:\Programs\ffmpeg-20160527-git-d970f7b-win64-static\bin\ffmpeg.exe"

path = Path(sys.argv[1])

downloader = Downloader(pixiv)

def find_delay(index):
	delay = index[0][1]
	if all(delay == i[1] for i in index):
		return int(delay)

for file in path.glob("*.zip"):
	index = None
	delay = None
	
	with ZipFile(str(file)) as zip:
		try:
			with zip.open("index") as index:
				index = index.read().decode("utf-8")
		except KeyError:
			pass
		else:
			index = index.split("\n")
			index = [i.split("\t") for i in index]
			
	if not index:
		id = re.search(r"^\d+", file.stem).group()
		url = "http://www.pixiv.net/member_illust.php?mode=medium&illust_id={id}".format(id=id)
		print(url)
		try:
			html = downloader.html(url)
			js_src = re.search(
				r"pixiv\.context\.ugokuIllustFullscreenData\s+= ([^;]+)",
				html
			).group(1)
		except Exception:
			traceback.print_exc()
			continue
			
		frames = execjs.eval(js_src)["frames"]
		
		index = [(f["file"], f["delay"]) for f in frames]
		
		data = "\n".join(
			"{file}\t{delay}".format_map(f) for f in frames
		)
		
		delay = find_delay(index)
		
		if not delay:
			with ZipFile(str(file), "a") as zip:
				zip.writestr("index", data.encode("utf-8"))
			continue
			
	if not index:
		continue
		
	if not delay:
		delay = find_delay(index)
		
	if not delay:
		continue
		
	fps = 1000 / delay
	
	with ZipFile(str(file)) as zip:
		with TemporaryDirectory() as dirname:
			for name in zip.namelist():
				if name != "index":
					zip.extract(name, path=dirname)
					
			# 3.5 needed
			subprocess.run("\"{ffmpeg}\" -framerate {fps} -i \"{dirname}\%06d.jpg\" -codec copy \"{output}\"".format(
				ffmpeg=FFMPEG,
				fps=fps,
				dirname=dirname,
				output=str(file.with_suffix(".mp4"))
			))
			
	send2trash(str(file))
