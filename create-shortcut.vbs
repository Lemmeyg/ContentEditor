Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")

Set oShellLink = WshShell.CreateShortcut(strDesktop & "\Content Editor.lnk")
oShellLink.TargetPath = WshShell.CurrentDirectory & "\start-content-editor.bat"
oShellLink.WorkingDirectory = WshShell.CurrentDirectory
oShellLink.Description = "Content Editor"
oShellLink.IconLocation = WshShell.CurrentDirectory & "\app\favicon.ico"
oShellLink.Save 