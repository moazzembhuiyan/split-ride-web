powershell -Command "
$workspace = 'R:\WEB\\REBASE\\split-ride'
Set-Location -LiteralPath $workspace
$current = git rev-parse HEAD

try {
    $content = cat 'src/app/driver/(view)/my-rides/[id]/page.tsx' -ErrorAction SilentlyContinue
    if ($content) {
        Write-Output 'File exists - checking changes...'
        $status = git status --porcelain 'src/app/driver/(view)/my-rides/[id]/page.tsx' 2>&1
        if ($status) { Write-Output 'UNCOMMITED CHANGES DETECTED:';$status } else { Write-Output 'No uncommitted changes' }
        
        $diff = git diff HEAD 'src/app/driver/(view)/my-rides/[id]/page.tsx' 2>&1
        if ($diff) { Write-Output 'HEAD changes:';$diff }
    } else {
        Write-Output 'File does not exist or empty'
    }
} catch {
    Write-Output 'Error: $_'
}
"