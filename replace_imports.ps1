$files = Get-ChildItem -Path src -Recurse -Include *.ts, *.tsx, *.js, *.jsx -Exclude ".git"
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = $content -replace '@/components/ui/', '@/ui/' `
        -replace '@/layouts/', '@/layout/' `
        -replace '@/components/layout/', '@/layout/' `
        -replace '@/components/common/', '@/shared/ui/' `
        -replace '@/components/cart/', '@/feat/cart/components/' `
        -replace '@/components/notifications/', '@/feat/notifications/components/' `
        -replace '@/components/settings/', '@/feat/user/components/settings/' `
        -replace '@/components/category/', '@/feat/products/components/' `
        -replace '@/hooks/', '@/shared/hook/' `
        -replace '@/utils/', '@/shared/util/' `
        -replace '@/core/hook/', '@/shared/hook/' `
        -replace '@/core/util/', '@/shared/util/' `
        -replace '@/components/icons/', '@/shared/ui/icons/' `
        -replace '\.from\("profiles"\)', '.from("users")' `
        -replace '\.from\(''profiles''\)', '.from("users")' `
        -replace '\.from\("user_roles"\)', '.from("users")' `
        -replace '\.from\(''user_roles''\)', '.from("users")' `
        -replace 'verification_status', 'verificationStatus' `
        -replace 'verification_comments', 'verificationComments'
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}
