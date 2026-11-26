$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$documents = ConvertFrom-Json -InputObject ([Console]::In.ReadToEnd())
$title = [System.Drawing.Font]::new('Segoe UI', 25, [System.Drawing.FontStyle]::Bold)
$label = [System.Drawing.Font]::new('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
$body = [System.Drawing.Font]::new('Segoe UI', 16)
$ink = [System.Drawing.Brushes]::DarkSlateGray
$muted = [System.Drawing.Brushes]::DimGray
$rule = [System.Drawing.Pens]::Gainsboro

try {
    foreach ($document in $documents) {
        $bitmap = [System.Drawing.Bitmap]::new(860, 458)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $jpeg = [System.IO.MemoryStream]::new()
        try {
            $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.FillRectangle([System.Drawing.Brushes]::Honeydew, 0, 0, 860, 143)
            $graphics.DrawString('DEMO | COMPROBANTE FICTICIO', $label, $ink, 48, 35)
            $graphics.DrawString('Registro de vacunas', $title, $ink, 48, 76)
            $graphics.DrawString("Paciente: $($document.catName)", $label, $ink, 48, 170)
            $graphics.DrawString('Vacuna', $label, $muted, 48, 229)
            $graphics.DrawString('Fecha', $label, $muted, 606, 229)

            $row = 266
            foreach ($dose in $document.doses) {
                $graphics.DrawLine($rule, 48, $row, 811, $row)
                $graphics.DrawString($dose.label, $body, $ink, 48, $row + 12)
                $graphics.DrawString($dose.date, $body, $ink, 606, $row + 12)
                $row += 49
            }
            $graphics.DrawString('Datos inventados para CatWorld Demo', $body, $muted, 48, 399)
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
