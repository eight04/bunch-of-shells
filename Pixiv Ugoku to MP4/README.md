Pixiv Ugoku to MP4
==================

A python script to convert ugoku zip into mp4 video [losslessly](http://video.stackexchange.com/questions/7903/how-to-losslessly-encode-a-jpg-image-sequence-to-a-video-in-ffmpeg).

It can only handle static frame rate, so it will only process those ugoku having the same delay.

Dependencies
------------

* [python 3.5](https://www.python.org/), including these modules:
	- [comiccrawler](https://github.com/eight04/ComicCrawler) - actually this script is a `runafterdownload` script written for comiccrawler.
	- [Send2Trash](https://github.com/hsoft/send2trash)
* [ffmpeg](https://ffmpeg.org/) - you have to edit the script to use your ffmpeg executable.

Usage
-----

	pixiv_ugoku_to_mp4.py "the/folder/containing/zip/file"
