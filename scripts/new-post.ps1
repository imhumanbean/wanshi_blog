param(
  [string]$Title,
  [string]$Summary,
  [string]$Tags,
  [string]$ReadTime,
  [string]$Author
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $root
$postsDir = Join-Path $root "posts"

if (-not (Test-Path $postsDir)) {
  Write-Error "找不到 posts 目录，请确认仓库根目录存在该目录。"
  exit 1
}

if (-not $Title) {
  $Title = Read-Host "文章标题"
}
if (-not $Summary) {
  $Summary = Read-Host "文章摘要"
}
if (-not $Tags) {
  $Tags = Read-Host "标签（用英文逗号分隔）"
}
if (-not $ReadTime) {
  $ReadTime = Read-Host "阅读时长（例如 5 分钟）"
}

if (-not $Author) {
  $gitAuthor = git config user.name 2>$null
  if ($gitAuthor) {
    $Author = $gitAuthor
  } else {
    $Author = Read-Host "作者名"
  }
}

$date = Get-Date -Format "yyyy-MM-dd"
$tagList = $Tags.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }

$slugBase = $Title.ToLowerInvariant()
$slugParts = New-Object System.Collections.Generic.List[string]
foreach ($ch in $slugBase.ToCharArray()) {
  if (($ch -ge "a" -and $ch -le "z") -or ($ch -ge "0" -and $ch -le "9")) {
    $slugParts.Add($ch)
  } else {
    $slugParts.Add("-")
  }
}
$slug = (-join $slugParts) -replace "-{2,}", "-"
$slug = $slug.Trim("-")
if (-not $slug) {
  $slug = "post"
}

$fileName = "$date-$slug.md"
$filePath = Join-Path $postsDir $fileName

if (Test-Path $filePath) {
  Write-Error "文件已存在：$fileName"
  exit 1
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("---")
$lines.Add("title: $Title")
$lines.Add("date: $date")
$lines.Add("readTime: $ReadTime")
$lines.Add("tags:")
foreach ($tag in $tagList) {
  $lines.Add("  - $tag")
}
$lines.Add("summary: $Summary")
$lines.Add("author: $Author")
$lines.Add("---")
$lines.Add("")
$lines.Add("在这里写正文内容。")

$lines | Set-Content -Path $filePath -Encoding UTF8

Write-Host "已新增文章：$fileName"

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
  node (Join-Path $root "scripts/build-posts.js")
} else {
  Write-Host "未检测到 Node.js，请手动执行：npm run build:posts"
}

Write-Host "接下来执行 git add . && git commit -m ""add post"" && git push"
