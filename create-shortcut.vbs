On Error Resume Next
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = WshShell.CurrentDirectory

' Check if target batch file exists
If Not fso.FileExists(strCurrentDir & "\start-content-editor.bat") Then
    WScript.Echo "Error: start-content-editor.bat not found in " & strCurrentDir
    WScript.Quit
End If

Set oShellLink = WshShell.CreateShortcut(strDesktop & "\Content Editor.lnk")
oShellLink.TargetPath = strCurrentDir & "\start-content-editor.bat"
oShellLink.WorkingDirectory = strCurrentDir
oShellLink.Description = "Content Editor"

' Use a default Windows icon for applications
oShellLink.IconLocation = "%SystemRoot%\System32\Shell32.dll,3"

If Err.Number <> 0 Then
    WScript.Echo "Error creating shortcut: " & Err.Description
    WScript.Quit
End If

oShellLink.Save

If Err.Number <> 0 Then
    WScript.Echo "Error saving shortcut: " & Err.Description
Else
    WScript.Echo "Shortcut created successfully on the desktop!"
End If 