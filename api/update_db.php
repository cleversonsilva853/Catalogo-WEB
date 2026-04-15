<?php
require_once __DIR__ . '/config.php';
$db = getDB();

try {
    echo "Iniciando atualização do banco de dados...\n";

    // 1. Adicionar pdv_password em store_config
    $db->exec("ALTER TABLE store_config ADD COLUMN IF NOT EXISTS pdv_password VARCHAR(100) DEFAULT NULL");
    echo "Coluna pdv_password verificada/adicionada em store_config.\n";

    // 2. Adicionar status em order_items
    $db->exec("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'");
    echo "Coluna status verificada/adicionada em order_items.\n";

    // 3. Adicionar índice para performance na cozinha
    $db->exec("CREATE INDEX IF NOT EXISTS idx_oi_status ON order_items(status)");
    echo "Índice idx_oi_status verificado/criado.\n";

    echo "\nAtualização concluída com sucesso!";
} catch (Exception $e) {
    echo "\nERRO na atualização: " . $e->getMessage();
}
