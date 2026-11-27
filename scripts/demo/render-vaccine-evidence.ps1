$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$documents = ConvertFrom-Json -InputObject ([Console]::In.ReadToEnd())
$title = [System.Drawing.Font]::new('Segoe UI', 25, [System.Drawing.FontStyle]::Bold)
$label = [System.Drawing.Font]::new('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
$body = [System.Drawing.Font]::new('Segoe UI', 16)
$ink = [System.Drawing.Brushes]::DarkSlateGray
$muted = [System.Drawing.Brushes]::DimGray
$rule = [System.Drawing.Pens]::Gainsboro
$headers = @{
    register = [System.Drawing.Brushes]::Honeydew
    cover = [System.Drawing.Brushes]::AliceBlue
    rabies = [System.Drawing.Brushes]::Linen
    triple = [System.Drawing.Brushes]::Lavender
    lots = [System.Drawing.Brushes]::OldLace
    validation = [System.Drawing.Brushes]::MintCream
}

try {
    foreach ($document in $documents) {
        $bitmap = [System.Drawing.Bitmap]::new(860, 490)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $jpeg = [System.IO.MemoryStream]::new()
        try {
            $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.FillRectangle($headers[$document.kind], 0, 0, 860, 143)
            $graphics.DrawString('DEMO | COMPROBANTE FICTICIO', $label, $ink, 48, 35)
            $graphics.DrawString($document.title, $title, $ink, 48, 76)
            $graphics.DrawString("Paciente: $($document.catName)", $label, $ink, 48, 161)
            $graphics.DrawString("Libreta $($document.reference)", $body, $muted, 606, 161)
            $graphics.DrawString($document.caption, $body, $muted, 48, 196)
            $lotsPage = $document.kind -eq 'lots'
            $dateColumn = if ($lotsPage) { 386 } else { 606 }
            $graphics.DrawString('Vacuna', $label, $muted, 48, 247)
            $graphics.DrawString('Fecha', $label, $muted, $dateColumn, 247)
            if ($lotsPage) {
                $graphics.DrawString('Lote ficticio', $label, $muted, 606, 247)
            }

            $row = 282
            foreach ($dose in $document.doses) {
                $graphics.DrawLine($rule, 48, $row, 811, $row)
                $graphics.DrawString($dose.label, $body, $ink, 48, $row + 12)
                $graphics.DrawString($dose.date, $body, $ink, $dateColumn, $row + 12)
                if ($lotsPage) {
                    $graphics.DrawString($dose.lot, $body, $ink, 606, $row + 12)
                }
                $row += 49
            }
            if ($document.kind -eq 'validation') {
                $graphics.DrawRectangle([System.Drawing.Pens]::DarkSlateGray, 499, 396, 312, 57)
                $graphics.DrawString('CONSULTORIO DEMO', $label, $ink, 519, 412)
            }
            $graphics.DrawString('Datos inventados para CatWorld Demo', $body, $muted, 48, 413)
            $bitmap.Save($jpeg, [System.Drawing.Imaging.ImageFormat]::Jpeg)
            [Console]::WriteLine([Convert]::ToBase64String($jpeg.ToArray()))
        } finally {
            $jpeg.Dispose()
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
} finally {
    $title.Dispose()
    $label.Dispose()
    $body.Dispose()
}
