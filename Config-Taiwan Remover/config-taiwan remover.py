#! python3

import time, os, threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

dir = r"C:\Users\Owner\AppData\Local\Ankama\Wakfu\game"
filename = "config-taiwan.properties"

def remove():
	try:
		os.remove(os.path.join(dir, filename))
	except FileNotFoundError:
		pass
	except PermissionError:
		threading.Timer(1, remove).start()

def check(event):
	if os.path.basename(event.src_path) == filename:
		remove()

class EventHandler(FileSystemEventHandler):
	def on_created(self, event):
		check(event)

	def on_modified(self, event):
		check(event)

event_handler = EventHandler()
observer = Observer()
observer.schedule(event_handler, path=dir)
observer.start()

remove()

try:
	while True:
		time.sleep(1)
except KeyboardInterrupt:
	observer.stop()
observer.join()
