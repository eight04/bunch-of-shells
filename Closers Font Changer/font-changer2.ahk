; 2025-09-27 It seems that Closers doesn't reset the font file on startup anymore.
strComputer := "." 
objWMIService := ComObjGet("winmgmts:\\" . strComputer . "\root\CIMV2") 
objEvents := objWMIService.ExecNotificationQuery("SELECT * FROM Win32_ProcessTrace")

Path := ""
PathBackup := ""
PathMyFont := A_ScriptDir . "\MSJH.TTF"
Loop {
  objReceivedEvent := objEvents.NextEvent
  exitStatus := -1
  try {
    exitStatus := objReceivedEvent.ExitStatus
  }

  if (objReceivedEvent.ProcessName = "CW.EXE") {
    if (exitStatus < 0) {
      if (Path = "") {
        PID := objReceivedEvent.ProcessID
        Path := ProcessGetPath(PID) . "\..\MSJH.TTF"
        PathBackup := Path . "\..\MSJH_BACKUP.TTF"
      }
      FileCopy(PathMyFont, Path, 1)
    }
  }
}
return
