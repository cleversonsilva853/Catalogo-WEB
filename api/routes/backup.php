<?php
// ============================================================
// routes/backup.php — Exportação de dados para backup
// ============================================================

require_auth();
$db = getDB();

if ($method !== 'GET') {
    respond_error('Apenas GET é permitido', 405);
}

// GET /backup — exporta todas as tabelas principais em JSON
$tables = [
    'store_config',
    'admin_users',
    'categories',
    'products',
    'addon_groups',
    'addon_options',
    'product_addon_groups',
    'ingredients',
    'product_ingredients',
    'orders',
    'order_items',
    'drivers',
    'delivery_zones',
    'business_hours',
    'coupons',
    'customer_addresses',
    'caixa_sessions',
    'caixa_movimentacoes',
    'comandas',
    'comanda_pedidos',
    'comanda_vendas',
];

$backup = [
    'exported_at' => date('Y-m-d H:i:s'),
    'version'     => '1.0.0',
    'tables'      => [],
];

foreach ($tables as $table) {
    try {
        $stmt = $db->query("SELECT * FROM `$table`");
        $rows = $stmt->fetchAll();
        // Oculta senhas do backup
        if ($table === 'admin_users') {
            foreach ($rows as &$row) { unset($row['senha']); }
        }
        $backup['tables'][$table] = $rows;
    } catch (\Throwable $e) {
        $backup['tables'][$table] = ['error' => $e->getMessage()];
    }
}

// Força download como arquivo JSON
header('Content-Disposition: attachment; filename="backup_' . date('Y-m-d_H-i-s') . '.json"');
header('Content-Type: application/json; charset=utf-8');
echo json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit;
