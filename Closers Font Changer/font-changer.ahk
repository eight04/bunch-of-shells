While 1 {
  PID := ProcessWait("CW.EXE")
  Path := ProcessGetPath(PID) . "\..\MSJH.TTF"
  OldPath := Path . "\..\MSJH_BACKUP.TTF"
  NewPath := A_ScriptDir . "\MSJH.TTF"
  FileMove(Path, OldPath)
  FileCopy(NewPath, Path)
  ProcessWaitClose(PID)
  FileMove(OldPath, Path, 1)
}
