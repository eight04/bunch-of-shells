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
      try {
        ; this may fail when CW.EXE is running
        FileMove(this.Path, this.PathBackup)
        FileCopy(this.PathMyFont, this.Path)
      }
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
  __New() {
    this.timer := () => ProcessClose("tbs_browser.exe")
  }

  Check() {
    return ProcessExist("tbs_browser.exe") && !ProcessExist("intl_service.exe") && !ProcessExist("nikke.exe")
  }

  Update(state) {
    SetTimer(this.timer, state ? 1000 : 0)
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

A_TrayMenu.add("Kill tbs_browser", (name, pos, menu) => ProcessKillAll("tbs_browser.exe"))

ProcessKillAll(name) {
  While (PID := ProcessClose(name)) {
    Sleep(1000)
  }
}
