@echo off
:loop
if exist "%cd%\node_modules\@angular\cli\bin\ng.js" (
    echo | set /p=%cd% 
    node "%cd%\node_modules\@angular\cli\bin\ng.js" %*
    goto :end
) else (
    if "%cd%"=="%~d0\" (
        echo ng not found
        goto :end
    ) else (
        cd ..
    )
)
goto :loop
:end
