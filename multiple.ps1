if (!$args) {
    Write-Host " install test lint build start " -BackgroundColor DarkBlue
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
