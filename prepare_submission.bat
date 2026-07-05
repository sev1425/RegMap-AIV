@echo off
echo Preparing repository for submission...

echo Deleting backend database...
del /Q backend\regmap.db

echo Deleting non-demo uploads...
del /Q backend\uploads\*.*

echo.
echo Pre-submission checklist completed! 
echo Make sure to run this script before creating a zip or publishing.
pause
