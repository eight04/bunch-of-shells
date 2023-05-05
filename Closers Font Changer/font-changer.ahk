Init([
  ClosersChecker(),
  NikkeChecker()
])

class ClosersChecker {
  Path := ""
  PathBackup := ""
  PathMyFont := ""

  Check() {
    return ProcessExist("CW.EXE")
  }

  Update(PID) {
    If PID {
      this.InitPath(PID)
      FileMove(this.Path, this.PathBackup)
      FileCopy(this.PathMyFont, this.Path)
      return
    }

    If !this.Path {
      return
    }

    FileMove(this.PathBackup, this.Path, 1)
  }

  InitPath(PID) {
    If !this.Path {
      this.Path := ProcessGetPath(PID) . "\..\MSJH.TTF"
      this.PathBackup := this.Path . "\..\MSJH_BACKUP.TTF"
      this.PathMyFont := A_ScriptDir . "\MSJH.TTF"
    }
  }
}

class NikkeChecker {
  Check() {
    return !!(ProcessExist("nikke_launcher_hmt.exe") || ProcessExist("nikke.exe"))
  }

  Update(state) {
    if (!state) {
      ProcessKillAll("tbs_browser.exe")
    }
  }
}

Init(checkers) {
  for checker in checkers {
    checker._state := 0
  }
  SetTimer(Check, 1000)

  Check() {
    for checker in checkers {
      newState := checker.Check()
      if (newState == checker._state) {
        continue
      }
      checker._state := newState
      checker.Update(newState)
    }
  }
}

ProcessKillAll(name) {
  While (PID := ProcessClose(name)) {
    ProcessWaitClose(PID)
  }
}
