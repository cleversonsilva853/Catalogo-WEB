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

    // 4. Adicionar user_type e user_identifier em push_subscriptions
    if (!columnExists($db, 'push_subscriptions', 'user_type')) {
        $db->exec("ALTER TABLE push_subscriptions ADD user_type VARCHAR(20) DEFAULT 'admin'");
        echo "Coluna user_type adicionada em push_subscriptions.\n";
    }
    if (!columnExists($db, 'push_subscriptions', 'user_identifier')) {
        $db->exec("ALTER TABLE push_subscriptions ADD user_identifier VARCHAR(100) DEFAULT NULL");
        echo "Coluna user_identifier adicionada em push_subscriptions.\n";
    }

    echo "\nAtualização concluída com sucesso!";
}
catch (Exception $e) {

    echo "\nERRO na atualização: " . $e->getMessage();
}
