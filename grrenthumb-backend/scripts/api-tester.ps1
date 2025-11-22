# GreenThumb API Client - Plant Disease & Soil Analysis
# Compatible with PowerShell 5.1+

$BaseURL = "http://localhost:8000"
Write-Host "GreenThumb API Client Ready!" -ForegroundColor Green
Write-Host "Services: Plant Disease Detection + Soil Analysis" -ForegroundColor Cyan

# ============================================
# Health & Info Functions
# ============================================

function Get-Health {
    Write-Host "Checking API Health..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/health" -Method GET
}

# ============================================
# Plant Disease Functions (Existing)
# ============================================

function Get-DatasetStats {
    Write-Host "Fetching Dataset Statistics..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/dataset-stats" -Method GET
}

function Get-ModelInfo {
    Write-Host "Getting Model Information..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/model-info" -Method GET
}

function Start-Training {
    Write-Host "Starting Model Training..." -ForegroundColor Yellow
    $config = @{
        epochs = 50
        batch_size = 8
        learning_rate = 0.001
        test_split = 0.2
        model_type = "hybrid"
        device = "cuda"
    }
    Invoke-RestMethod -Uri "$BaseURL/train" -Method POST -Body ($config | ConvertTo-Json) -ContentType "application/json"
}

function Analyze-PlantImage {
    param (
        [Parameter(Mandatory=$true)]
        [string]$ImagePath
    )
    
    if (!(Test-Path $ImagePath)) {
        throw "Image not found: $ImagePath"
    }
    
    Write-Host "Analyzing Plant Image..." -ForegroundColor Yellow
    
    $fileBinary = [System.IO.File]::ReadAllBytes($ImagePath)
    $fileName = Split-Path -Leaf $ImagePath
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: image/jpeg",
        "",
        [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBinary),
        "--$boundary--"
    ) -join $LF
    
    $body = [System.Text.Encoding]::UTF8.GetBytes($bodyLines)
    
    Invoke-RestMethod -Uri "$BaseURL/analyze" -Method POST -ContentType "multipart/form-data; boundary=$boundary" -Body $body
}

function Check-TrainingStatus {
    Write-Host "Checking Training Status..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/train/status" -Method GET
}

function Stop-Training {
    Write-Host "Requesting Training Stop..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/train/stop" -Method POST
}

function Pause-Training {
    Write-Host "Pausing Training..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/train/pause" -Method POST
}

function Resume-Training {
    Write-Host "Resuming Training..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/train/resume" -Method POST
}

function Get-TrainingLogs {
    Write-Host "Fetching Training Logs..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/train/logs" -Method GET
}

# ============================================
# NEW: Soil Analysis Functions
# ============================================

function Analyze-SoilImage {
    param (
        [Parameter(Mandatory=$true)]
        [string]$ImagePath
    )
    
    if (!(Test-Path $ImagePath)) {
        throw "Image not found: $ImagePath"
    }
    
    Write-Host "Analyzing Soil Image..." -ForegroundColor Yellow
    
    $fileBinary = [System.IO.File]::ReadAllBytes($ImagePath)
    $fileName = Split-Path -Leaf $ImagePath
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: image/jpeg",
        "",
        [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBinary),
        "--$boundary--"
    ) -join $LF
    
    $body = [System.Text.Encoding]::UTF8.GetBytes($bodyLines)
    
    $result = Invoke-RestMethod -Uri "$BaseURL/api/soil/analyze" -Method POST -ContentType "multipart/form-data; boundary=$boundary" -Body $body
    
    # Display formatted results
    Write-Host "`n=== Soil Analysis Results ===" -ForegroundColor Green
    Write-Host "pH Level: $($result.pH)" -ForegroundColor Cyan
    Write-Host "Moisture: $($result.moisture)%" -ForegroundColor Cyan
    Write-Host "Nitrogen (N): $($result.nitrogen) mg/kg" -ForegroundColor Cyan
    Write-Host "Phosphorus (P): $($result.phosphorus) mg/kg" -ForegroundColor Cyan
    Write-Host "Potassium (K): $($result.potassium) mg/kg" -ForegroundColor Cyan
    Write-Host "Texture: $($result.texture)" -ForegroundColor Cyan
    Write-Host "Confidence: $([math]::Round($result.confidence * 100, 1))%" -ForegroundColor Cyan
    Write-Host "`nRecommended Crops:" -ForegroundColor Yellow
    $result.recommendations | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    Write-Host ""
    
    return $result
}

function Get-SoilTextureTypes {
    Write-Host "Fetching Soil Texture Types..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/api/soil/texture-types" -Method GET
}

function Get-PhGuide {
    Write-Host "Fetching pH Guide..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/api/soil/ph-guide" -Method GET
}

function Get-NPKGuide {
    Write-Host "Fetching NPK Guide..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/api/soil/npk-guide" -Method GET
}

function Get-SoilAnalysisInfo {
    Write-Host "Fetching Soil Analysis Info..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseURL/api/soil/info" -Method GET
}

# ============================================
# Help Display
# ============================================

Write-Host "`n=== Plant Disease Functions ===" -ForegroundColor Cyan
Write-Host "Get-Health                - Check API health"
Write-Host "Get-DatasetStats          - Get dataset statistics"
Write-Host "Get-ModelInfo             - Get model information"
Write-Host "Start-Training            - Start training the model"
Write-Host "Check-TrainingStatus      - Check current training status"
Write-Host "Stop-Training             - Stop training"
Write-Host "Pause-Training            - Pause training"
Write-Host "Resume-Training           - Resume training"
Write-Host "Get-TrainingLogs          - Get training logs"
Write-Host "Analyze-PlantImage        - Analyze plant disease"

Write-Host "`n=== Soil Analysis Functions ===" -ForegroundColor Green
Write-Host "Analyze-SoilImage         - Analyze soil sample"
Write-Host "Get-SoilTextureTypes      - Get soil texture information"
Write-Host "Get-PhGuide               - Get pH level guide"
Write-Host "Get-NPKGuide              - Get NPK requirements guide"
Write-Host "Get-SoilAnalysisInfo      - Get soil analysis information"

Write-Host "`n=== Examples ===" -ForegroundColor Yellow
Write-Host "Analyze-PlantImage -ImagePath 'C:\path\to\plant.jpg'"
Write-Host "Analyze-SoilImage -ImagePath 'C:\path\to\soil.jpg'"
Write-Host ""