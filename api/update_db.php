<?php
require_once __DIR__ . '/config.php';
$db = getDB();

// Proteção simples para evitar execução acidental por terceiros
if (($_GET['key'] ?? '') !== 'infornexa2024') {
    die("Acesso negado. Por favor, forneça a chave de segurança correta.");
}

try {
    echo "Iniciando atualização do banco de dados...\n";

    // Função auxiliar para verificar se coluna existe
    function columnExists($db, $table, $column)
    {
        try {
            $stmt = $db->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return in_array($column, $columns);
        } catch (Exception $e) {
            return false;
        }
    }

    // 1. Criar tabela stories se não existir
    $db->exec("CREATE TABLE IF NOT EXISTS stories (
        id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) DEFAULT NULL,
        subtitle VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        media_url TEXT NOT NULL,
        media_type VARCHAR(20) DEFAULT 'image',
        is_active TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        scheduled_at DATETIME DEFAULT NULL,
        notification_sent TINYINT(1) DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "Tabela stories verificada/criada.\n";

    // 2. Colunas em store_config
    $store_columns = [
        'pdv_password' => "VARCHAR(100) DEFAULT NULL",
        'mode_delivery_enabled' => "TINYINT(1) DEFAULT 1",
        'mode_pickup_enabled' => "TINYINT(1) DEFAULT 1",
        'hero_banner_enabled' => "TINYINT(1) DEFAULT 1",
        'floating_image_enabled' => "TINYINT(1) DEFAULT 1",
        'cover_url_mobile' => "TEXT DEFAULT NULL",
        'pickup_time_min' => "INT DEFAULT 30",
        'pickup_time_max' => "INT DEFAULT 45",
        'menu_layout' => "VARCHAR(20) DEFAULT 'list'",
        'hero_text_1' => "VARCHAR(255) DEFAULT NULL",
        'hero_text_2' => "VARCHAR(255) DEFAULT NULL",
        'hero_text_3' => "VARCHAR(255) DEFAULT NULL",
        'hero_text_4' => "VARCHAR(255) DEFAULT NULL",
        'hero_slogan' => "VARCHAR(255) DEFAULT NULL",
        'floating_image_url' => "TEXT DEFAULT NULL",
        'menu_color' => "VARCHAR(50) DEFAULT NULL",
        'floating_image_size' => "INT DEFAULT 300",
        'floating_image_position' => "INT DEFAULT 50",
        'floating_image_vertical_position' => "INT DEFAULT 50",
        'floating_image_size_mobile' => "INT DEFAULT 300",
        'floating_image_position_mobile' => "INT DEFAULT 0",
        'floating_image_vertical_position_mobile' => "INT DEFAULT 0",
        'stock_enabled' => "TINYINT(1) DEFAULT 1",
        'product_stock_enabled' => "TINYINT(1) DEFAULT 1"
    ];

    foreach ($store_columns as $col => $definition) {
        if (!columnExists($db, 'store_config', $col)) {
            $db->exec("ALTER TABLE store_config ADD $col $definition");
            echo "Coluna $col adicionada em store_config.\n";
        }
    }

    // 3. Colunas em order_items
    if (!columnExists($db, 'order_items', 'status')) {
        $db->exec("ALTER TABLE order_items ADD status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        echo "Coluna status adicionada em order_items.\n";
    }

    // 4. Colunas em push_subscriptions
    if (!columnExists($db, 'push_subscriptions', 'user_type')) {
        $db->exec("ALTER TABLE push_subscriptions ADD user_type VARCHAR(20) DEFAULT 'admin'");
        echo "Coluna user_type adicionada em push_subscriptions.\n";
    }

    if (!columnExists($db, 'push_subscriptions', 'user_identifier')) {
        $db->exec("ALTER TABLE push_subscriptions ADD user_identifier VARCHAR(100) DEFAULT NULL");
        echo "Coluna user_identifier adicionada em push_subscriptions.\n";
    }
    
    // 5. Colunas em products (Promoções)
    $product_columns = [
        'promo_price' => "DECIMAL(10,2) DEFAULT NULL",
        'is_promo_active' => "TINYINT(1) DEFAULT 0"
    ];

    foreach ($product_columns as $col => $definition) {
        if (!columnExists($db, 'products', $col)) {
            $db->exec("ALTER TABLE products ADD $col $definition");
            echo "Coluna $col adicionada em products.\n";
        }
    }

    // 6. Criar tabela bulk_messages se não existir
    $db->exec("CREATE TABLE IF NOT EXISTS bulk_messages (
        id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        scheduled_at DATETIME NOT NULL,
        media_url TEXT DEFAULT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "Tabela bulk_messages verificada/criada.\n";

    // 7. Forçar conversão de charset para garantir emojis
    echo "Convertendo tabelas para utf8mb4...\n";
    $tables = ['store_config', 'products', 'orders', 'order_items', 'categories', 'addons', 'comandas', 'ingredients'];
    foreach ($tables as $t) {
        try {
            $db->exec("ALTER TABLE $t CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            echo "Tabela $t convertida.\n";
        } catch (Exception $e) {
            // Ignorar erro se a tabela não existir
        }
    }

    echo "\nAtualização concluída com sucesso!";
} catch (Exception $e) {
    echo "\nERRO na atualização: " . $e->getMessage();
}
