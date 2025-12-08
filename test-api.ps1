# ===================================================================
# SCRIPT DE PRUEBA COMPLETO - BOTSITOT API (VERSION FINAL)
# ===================================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " PROBANDO API BOTSITOT - VERSION FINAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ===================================================================
# 1. LOGIN
# ===================================================================
Write-Host "[1/7] Login como Admin..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"email":"admin@botsitot.com","password":"Admin123!"}'
    
    $token = $response.data.token
    $user = $response.data.user
    
    Write-Host "   OK - Login exitoso" -ForegroundColor Green
    Write-Host "   Usuario: $($user.nombre) ($($user.rol))" -ForegroundColor Gray
    Write-Host "   Token: $($token. Substring(0,30))..." -ForegroundColor Gray
} catch {
    Write-Host "   ERROR: $($_.Exception. Message)" -ForegroundColor Red
    exit
}

Write-Host ""

# ===================================================================
# 2. LISTAR PRODUCTOS
# ===================================================================
Write-Host "[2/7] Listando productos..." -ForegroundColor Yellow

try {
    $productosResponse = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/api/productos" `
        -Headers @{"Authorization"="Bearer $token"}
    
    $productos = $productosResponse.productos
    $pagination = $productosResponse.pagination
    
    Write-Host "   OK - $($pagination.total) productos encontrados (pagina $($pagination.page) de $($pagination.totalPages))" -ForegroundColor Green
    Write-Host ""
    
    $productos | Select-Object -First 10 nombre, @{Name='Precio';Expression={"$" + $_.precio}}, stock, categoria, subcategoria | Format-Table -AutoSize
} catch {
    Write-Host "   ERROR: $($_.Exception. Message)" -ForegroundColor Red
}

Write-Host ""

# ===================================================================
# 3. CREAR PRODUCTO (Intentar con diferentes configuraciones)
# ===================================================================
Write-Host "[3/7] Creando nuevo producto..." -ForegroundColor Yellow

try {
    # Ver un producto existente como ejemplo
    $ejemploProducto = $productos[0]
    
    $nuevoProductoBody = @{
        nombre = "Producto Test $(Get-Date -Format 'HH:mm:ss')"
        categoria = "LIBRERIA"
        subcategoria = "Testing"
        precio = "1500"  # String como en los productos existentes
        stock = $true
    }
    
    Write-Host "   Intentando crear con: $($nuevoProductoBody | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    $nuevoProductoResponse = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/api/productos" `
        -Method POST `
        -Headers @{
            "Authorization"="Bearer $token"
            "Content-Type"="application/json"
        } `
        -Body ($nuevoProductoBody | ConvertTo-Json)
    
    $nuevoProducto = if ($nuevoProductoResponse.data) { $nuevoProductoResponse.data } `
                     elseif ($nuevoProductoResponse.producto) { $nuevoProductoResponse.producto } `
                     else { $nuevoProductoResponse }
    
    Write-Host "   OK - Producto creado: $($nuevoProducto.nombre)" -ForegroundColor Green
    Write-Host "   ID: $($nuevoProducto. id)" -ForegroundColor Gray
} catch {
    Write-Host "   ERROR: $($_.Exception. Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails. Message) {
        Write-Host "   Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# ===================================================================
# 4. LISTAR CLIENTES
# ===================================================================
Write-Host "[4/7] Listando clientes..." -ForegroundColor Yellow

try {
    $clientesResponse = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/api/clientes" `
        -Headers @{"Authorization"="Bearer $token"}
    
    $clientes = if ($clientesResponse.clientes) { $clientesResponse.clientes } `
                elseif ($clientesResponse.data) { $clientesResponse.data } `
                else { $clientesResponse }
    
    $count = if ($clientes -is [Array]) { $clientes.Count } else { 1 }
    
    Write-Host "   OK - $count clientes encontrados" -ForegroundColor Green
    Write-Host ""
    
    if ($clientes -and $count -gt 0) {
        $clientes | Select-Object nombre, telefono, email, @{Name='Total Compras';Expression={"`$" + $_.totalCompras}} | Format-Table -AutoSize
    }
} catch {
    Write-Host "   ERROR: $($_. Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ===================================================================
# 5. LISTAR PEDIDOS
# ===================================================================
Write-Host "[5/7] Listando pedidos..." -ForegroundColor Yellow

try {
    $pedidosResponse = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/api/pedidos" `
        -Headers @{"Authorization"="Bearer $token"}
    
    $pedidos = if ($pedidosResponse.pedidos) { $pedidosResponse.pedidos } `
               elseif ($pedidosResponse.data) { $pedidosResponse.data } `
               else { $pedidosResponse }
    
    $count = if ($pedidos -is [Array]) { $pedidos.Count } else { if ($pedidos) { 1 } else { 0 } }
    
    Write-Host "   OK - $count pedidos encontrados" -ForegroundColor Green
    Write-Host ""
    
    if ($pedidos -and $count -gt 0) {
        $pedidos | Select-Object id, @{Name='Cliente';Expression={if ($_.cliente) { $_.cliente.nombre } else { "N/A" }}}, @{Name='Total';Expression={"`$" + $_. total}}, estado, fechaCreacion | Format-Table -AutoSize
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ===================================================================
# 6.  ESTADISTICAS (CORREGIDO)
# ===================================================================
Write-Host "[6/7] Obteniendo estadisticas..." -ForegroundColor Yellow

try {
    $statsResponse = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/api/stats" `
        -Headers @{"Authorization"="Bearer $token"}
    
    # Estructura correcta: $statsResponse.stats
    $stats = $statsResponse.stats
    
    Write-Host "   OK - Estadisticas obtenidas" -ForegroundColor Green
    Write-Host ""
    Write-Host "   CLIENTES:" -ForegroundColor Cyan
    Write-Host "     Total: $($stats.clientes.total)" -ForegroundColor White
    Write-Host ""
    Write-Host "   PRODUCTOS:" -ForegroundColor Cyan
    Write-Host "     Total: $($stats.productos. total)" -ForegroundColor White
    Write-Host "     Sin Stock: $($stats. productos.sinStock)" -ForegroundColor White
    Write-Host ""
    Write-Host "   PEDIDOS:" -ForegroundColor Cyan
    Write-Host "     Total: $($stats. pedidos.total)" -ForegroundColor White
    Write-Host "     Hoy: $($stats.pedidos.hoy)" -ForegroundColor White
    Write-Host "     Total Vendido: `$$($stats.pedidos.totalVendido)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception. Message)" -ForegroundColor Red
}

Write-Host ""

# ===================================================================
# 7. HEALTH CHECK
# ===================================================================
Write-Host "[7/7] Health check..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod `
        -Uri "https://botsitot-1.onrender.com/health/detailed"
    
    $statusColor = if ($health.status -eq "healthy") { "Green" } else { "Yellow" }
    
    Write-Host "   OK - Status: $($health.status. ToUpper())" -ForegroundColor $statusColor
    Write-Host "   Database: $($health.services.database. status) ($($health.services.database. latency))" -ForegroundColor White
    Write-Host "   Redis: $($health.services.cache.status) ($($health.services.cache.latency))" -ForegroundColor White
    Write-Host "   Response time: $($health.performance.responseTime)" -ForegroundColor White
} catch {
    Write-Host "   ERROR: $($_.Exception. Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  API: https://botsitot-1.onrender.com" -ForegroundColor Cyan
Write-Host "  Docs: https://botsitot-1.onrender.com/api-docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Credenciales:" -ForegroundColor Yellow
Write-Host "    Admin:    admin@botsitot.com / Admin123!" -ForegroundColor Gray
Write-Host "    Operator: operator@botsitot.com / Operator123!" -ForegroundColor Gray
Write-Host "    Viewer:   viewer@botsitot.com / Viewer123!" -ForegroundColor Gray
Write-Host ""