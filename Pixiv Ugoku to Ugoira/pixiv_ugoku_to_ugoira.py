#! python3

"""Convert pixiv ugoku zip into mp4"""

import json
import sys
import re
from zipfile import ZipFile
from pathlib import Path
from comiccrawler.core import Downloader
from comiccrawler.mods import pixiv

def convert(file):
	file = Path(file)
	downloader = Downloader(pixiv)
	id = re.search(r"^\d+", file.stem).group()
	url = "http://www.pixiv.net/member_illust.php?mode=medium&illust_id={id}".format(id=id)
	print(url)
	html = downloader.html(url)
	data = re.search(
		r"pixiv\.context\.ugokuIllustFullscreenData\s+= ([^;]+)",
		html
	).group(1)
	frames = json.loads(data)["frames"]
	file.write_bytes(pixiv.pack_ugoira(file.read_bytes(), frames))
	file.rename(file.with_suffix(".ugoira"))
	
for file in sys.argv[1:]:
	convert(file)
