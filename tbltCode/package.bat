REM DIE IF NOT ON BUILD SERVER
IF %COMPUTERNAME% NEQ JENKINS GOTO NOTBUILD

REM SET UP ENVIRONMENT
SET DIRSWITCHES=/v /np /njs /njh /bytes /fft /ndl /e
SET FILESWITCHES=/v /np /njs /njh /bytes /fft /ndl 

SET TARGET=..\builds\%BUILD_ID%\archive\

:: Copy app
call npm install
cd ContentServer
call npm install
cd ..

ROBOCOPY C:\Jenkins\buildTools %TARGET%\tools %DIRSWITCHES%
ROBOCOPY \\methlab\Stimulant\Projects\EBX2\Deployment\Tablet\tools .\tools %DIRSWITCHES%
ROBOCOPY \\methlab\Stimulant\Projects\EBX2\Deployment\Tablet\content .\app\content %DIRSWITCHES%
ROBOCOPY \\methlab\Stimulant\Projects\EBX2\Deployment\Tablet\cmscontent .\app\cmscontent %DIRSWITCHES%
ROBOCOPY . %TARGET% %DIRSWITCHES%

RMDIR /S /Q %TARGET%\.git
DEL %TARGET%\.*
DEL %TARGET%\*.sublime-project
DEL %TARGET%\package.bat
DEL %TARGET%\README.md
ECHO %BUILD_NUMBER% > %TARGET%\BUILD_%BUILD_NUMBER%

:: MAKE THIS BETTER
EXIT /B 0

:NOTBUILD
ECHO This should only be run on the build server.
PAUSE
