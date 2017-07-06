SET DIRSWITCHES=/v /np /njs /njh /bytes /fft /ndl /e
SET FILESWITCHES=/v /np /njs /njh /bytes /fft /ndl 

ROBOCOPY \\methlab\Stimulant\Projects\EBX2\Deployment\Tablet\tools .\tools %DIRSWITCHES%
ROBOCOPY \\methlab\Stimulant\Projects\EBX2\Deployment\Tablet\content .\app\content %DIRSWITCHES%
