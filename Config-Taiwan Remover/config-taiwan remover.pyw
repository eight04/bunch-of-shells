#! python3

import time, os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

def check(event):
	if os.path.basename(event.src_path) == "config-taiwan.properties":
		try:
			os.remove(event.src_path)
		except FileNotFoundError:
			pass

class EventHandler(FileSystemEventHandler):
	def on_created(self, event):
		check(event)

	def on_modified(self, event):
		check(event)

event_handler = EventHandler()
observer = Observer()
observer.schedule(event_handler, path=r"C:\Users\Owner\AppData\Local\Ankama\Wakfu\game")
observer.start()

try:
	while True:
		time.sleep(1)
except KeyboardInterrupt:
	observer.stop()
observer.join()
