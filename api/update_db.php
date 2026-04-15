<?php
require_once __DIR__ . '/config.php';
$db = getDB();

try {
    echo "Iniciando atualização do banco de dados...\n";

    // Função auxiliar para verificar se coluna existe
    function columnExists($db, $table, $column)
    {
        $stmt = $db->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return in_array($column, $columns);
    }

    // 1. Adicionar pdv_password em store_config
    if (!columnExists($db, 'store_config', 'pdv_password')) {
        $db->exec("ALTER TABLE store_config ADD pdv_password VARCHAR(100) DEFAULT NULL");
        echo "Coluna pdv_password adicionada em store_config.\n";
    }
    else {
        echo "Coluna pdv_password já existe em store_config.\n";
    }

    // 2. Adicionar status em order_items
    if (!columnExists($db, 'order_items', 'status')) {
        $db->exec("ALTER TABLE order_items ADD status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        echo "Coluna status adicionada em order_items.\n";
    }
    else {
        echo "Coluna status já existe em order_items.\n";
    }

    // 5. Adicionar stock_enabled e product_stock_enabled em store_config
    if (!columnExists($db, 'store_config', 'stock_enabled')) {
        $db->exec("ALTER TABLE store_config ADD stock_enabled TINYINT(1) DEFAULT 1");
        echo "Coluna stock_enabled adicionada em store_config.\n";
    }
    if (!columnExists($db, 'store_config', 'product_stock_enabled')) {
        $db->exec("ALTER TABLE store_config ADD product_stock_enabled TINYINT(1) DEFAULT 1");
        echo "Coluna product_stock_enabled adicionada em store_config.\n";
    }

    echo "\nAtualização concluída com sucesso!";
}
catch (Exception $e) {

    echo "\nERRO na atualização: " . $e->getMessage();
}
