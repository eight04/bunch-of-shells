#! python3

"""Split Folder

Usage:
  Split Folder.py DIRECTORY [SIZE]

Options:
  DIRECTORY  Folder path to split.
  SIZE       Split size in GB. [default: 4.6]
"""

import os, os.path, win32com.client as com, sys
from safeprint import safeprint as print
from pprint import pprint

fso = com.Dispatch("Scripting.FileSystemObject")

def get_size(path):
	if os.path.isdir(path):
		return fso.GetFolder(path).Size
	return os.path.getsize(path)

try:
	src = sys.argv[1]
except:
	src = "."

try:
	chunk = sys.argv[2]
except:
	chunk = 4.6

print("Split {} in chunk size of {}GB".format(src, chunk))

chunk *= 1000 * 1000 * 1000

groups = []

def new_head():
	head = {
		"files": [],
		"size": 0
	}
	groups.append(head)
	return head

head = new_head()

for file in os.listdir(src):
	print(file)
	size = get_size(os.path.join(src, file))
	if head["size"] and head["size"] + size > chunk:
		head = new_head()
	head["files"].append(file)
	head["size"] += size

with open("groups.txt", "w", encoding="utf-8") as f:
	pprint(groups, stream=f)

input("\nCheck groups.txt before continue...")

count = 1
for group in groups:
	fn = "folder - {:02}".format(count)
	os.makedirs(os.path.join(src, fn))
	for file in group["files"]:
		os.rename(os.path.join(src, file), os.path.join(src, fn, file))
	count += 1
