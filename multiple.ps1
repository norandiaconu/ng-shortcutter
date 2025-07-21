if (!$args) {
    Write-Host "Multiple Shortcuts" -ForegroundColor DarkRed
    Write-Host "              i" -ForegroundColor DarkRed -NoNewline
    Write-Host "|" -ForegroundColor DarkGray -NoNewline
    Write-Host "install" -ForegroundColor DarkYellow -NoNewline

    Write-Host "  t" -ForegroundColor DarkRed -NoNewline
    Write-Host "|" -ForegroundColor DarkGray -NoNewline
    Write-Host "test" -ForegroundColor DarkYellow -NoNewline

    Write-Host "  l" -ForegroundColor DarkRed -NoNewline
    Write-Host "|" -ForegroundColor DarkGray -NoNewline
    Write-Host "lint" -ForegroundColor DarkYellow -NoNewline

    Write-Host "  b" -ForegroundColor DarkRed -NoNewline
    Write-Host "|" -ForegroundColor DarkGray -NoNewline
    Write-Host "build" -ForegroundColor DarkYellow -NoNewline

    Write-Host "  s" -ForegroundColor DarkRed -NoNewline
    Write-Host "|" -ForegroundColor DarkGray -NoNewline
    Write-Host "start" -ForegroundColor DarkYellow -NoNewline
    exit
}

$commands = ""
if ($args -match "i") {
    $commands = $commands + " install "
}
if ($args -match "t") {
    $commands = $commands + " test "
}
if ($args -match "l") {
    $commands = $commands + " lint "
}
if ($args -match "b") {
    $commands = $commands + " build "
}
if ($args -match "s") {
    $commands = $commands + " start "
}
Write-Host $commands -BackgroundColor DarkBlue

if ($args -match "i") {
    n i
}
if ($args -match "t") {
    n t
}
if ($args -match "l") {
    n l
}
if ($args -match "b") {
    n b
}
if ($args -match "s") {
    n s
}
