@ECHO OFF

:: Unzip panoramas
IF NOT EXIST app\content\panorama\day (
    ECHO Unzipping day...
    tools\7z x -oapp\content\panorama\day -y app\content\panorama\day.zip
)

if not exist node_modules (
	call npm install
)

:: overwrite xml
::node tools\poisToXml.js app\content\pois.json app\OneLibertyGigapixelDay.xml
COPY /Y app\OneLibertyGigapixelDay.xml app\content\panorama\day

ampm ampm.json dev
