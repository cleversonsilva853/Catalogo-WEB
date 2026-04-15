<?php
// ============================================================
// routes/dashboard.php — Estatísticas do Dashboard
// ============================================================
$db = getDB();

if ($method === 'GET' && $id === 'stats') {
    require_auth();

    $start = $_GET['start'] ?? date('Y-m-d 00:00:00');
    $end = $_GET['end'] ?? date('Y-m-d 23:59:59');
    
    // Cálculo do período anterior para comparação (mesma duração)
    $tsStart = strtotime($start);
    $tsEnd = strtotime($end);
    $duration = $tsEnd - $tsStart;
    $prevStart = date('Y-m-d H:i:s', $tsStart - $duration - 1);
    $prevEnd = date('Y-m-d H:i:s', $tsStart - 1);

    // 1. Estatísticas atuais (Delivery)
    $stmt = $db->prepare("
        SELECT 
            SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as delivery_revenue,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as delivery_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_delivery,
            COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_delivery,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_delivery,
            COUNT(*) as total_delivery_orders
        FROM orders
        WHERE created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$start, $end]);
    $currentDelivery = $stmt->fetch();

    // 2. Estatísticas atuais (PDV/Mesas)
    $stmt = $db->prepare("
        SELECT 
            SUM(valor_total) as pdv_revenue,
            COUNT(*) as pdv_count
        FROM comanda_vendas
        WHERE created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$start, $end]);
    $currentPDV = $stmt->fetch();

    // 3. Estatísticas Período Anterior
    $stmt = $db->prepare("SELECT SUM(total_amount) as revenue, COUNT(*) as count FROM orders WHERE status = 'completed' AND created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $prevEnd]);
    $prevDelivery = $stmt->fetch();

    $stmt = $db->prepare("SELECT SUM(valor_total) as revenue, COUNT(*) as count FROM comanda_vendas WHERE created_at BETWEEN ? AND ?");
    $stmt->execute([$prevStart, $prevEnd]);
    $prevPDV = $stmt->fetch();

    // 4. Top Produtos
    $stmt = $db->prepare("
        SELECT product_name, SUM(quantity) as quantity, SUM(quantity * unit_price) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' AND o.created_at BETWEEN ? AND ?
        GROUP BY product_name
        ORDER BY quantity DESC LIMIT 5
    ");
    $stmt->execute([$start, $end]);
    $topProducts = $stmt->fetchAll();

    // 5. Gráfico de Horas (Unificado)
    $stmt = $db->prepare("
        SELECT HOUR(created_at) as hour, COUNT(*) as count, SUM(total_amount) as revenue
        FROM orders
        WHERE status = 'completed' AND created_at BETWEEN ? AND ?
        GROUP BY hour
    ");
    $stmt->execute([$start, $end]);
    $hourlyDelivery = $stmt->fetchAll();

    $stmt = $db->prepare("
        SELECT HOUR(created_at) as hour, COUNT(*) as count, SUM(valor_total) as revenue
        FROM comanda_vendas
        WHERE created_at BETWEEN ? AND ?
        GROUP BY hour
    ");
    $stmt->execute([$start, $end]);
    $hourlyPDV = $stmt->fetchAll();

    // 6. Meios de Pagamento
    $stmt = $db->prepare("
        SELECT payment_method as name, SUM(total_amount) as value 
        FROM orders WHERE status = 'completed' AND created_at BETWEEN ? AND ?
        GROUP BY payment_method
    ");
    $stmt->execute([$start, $end]);
    $payDelivery = $stmt->fetchAll();

    $stmt = $db->prepare("
        SELECT forma_pagamento as name, SUM(valor_total) as value 
        FROM comanda_vendas WHERE created_at BETWEEN ? AND ?
        GROUP BY forma_pagamento
    ");
    $stmt->execute([$start, $end]);
    $payPDV = $stmt->fetchAll();

    // 7. Status das Mesas e Cozinha (Tempo Real)
    $stmt = $db->query("SELECT COUNT(*) FROM tables_list WHERE status = 'occupied'");
    $occupiedTables = $stmt->fetchColumn();

    $stmt = $db->query("SELECT COUNT(*) FROM order_items WHERE status IN ('pending', 'preparing')");
    $kitchenPending = $stmt->fetchColumn();

    // Formatação da resposta
    respond([
        'stats' => [
            'delivery_revenue' => (float)($currentDelivery['delivery_revenue'] ?? 0),
            'delivery_count' => (int)$currentDelivery['delivery_count'],
            'pdv_revenue' => (float)($currentPDV['pdv_revenue'] ?? 0),
            'pdv_count' => (int)$currentPDV['pdv_count'],
            'prev_revenue' => (float)($prevDelivery['revenue'] ?? 0) + (float)($prevPDV['revenue'] ?? 0),
            'prev_orders' => (int)$prevDelivery['count'] + (int)$prevPDV['count'],
            'pending_delivery' => (int)$currentDelivery['pending_delivery'],
            'preparing_delivery' => (int)$currentDelivery['preparing_delivery'],
            'cancelled_delivery' => (int)$currentDelivery['cancelled_delivery'],
            'total_delivery_orders' => (int)$currentDelivery['total_delivery_orders'],
            'occupied_tables' => (int)$occupiedTables,
            'kitchen_pending' => (int)$kitchenPending
        ],
        'top_products' => $topProducts,
        'hourly_data' => array_merge($hourlyDelivery, $hourlyPDV),
        'payment_methods' => array_merge($payDelivery, $payPDV)
    ]);
}

respond_error('Método não permitido', 405);
