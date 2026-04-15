<?php
// ============================================================
// routes/table_orders.php — Pedidos de mesa (stub)
// Retorna lista vazia pois o módulo de mesas usa comandas
// ============================================================
$db = getDB();

if ($method === 'GET') {
    // Retorna comandas como table_orders para compatibilidade com Dashboard
    try {
        $stmt = $db->query('SELECT * FROM comandas ORDER BY created_at DESC LIMIT 100');
        respond($stmt->fetchAll());
    } catch (Exception $e) {
        respond([]);
    }
}

respond([]);
