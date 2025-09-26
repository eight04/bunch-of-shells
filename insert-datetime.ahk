; Inserts current date and time when Ctrl + Alt + D is pressed
^!d:: {
  dt := FormatTime(, "yyyy-MM-dd_HH-mm-ss")
  SendText dt
}
