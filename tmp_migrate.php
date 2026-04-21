<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/api/config.php';
try {
    $db = getDB();
    echo "Connected successfully to " . DB_NAME . "\n";
    
    try {
        $db->exec("ALTER TABLE admin_users ADD COLUMN perm_redes_sociais TINYINT(1) DEFAULT 0 AFTER perm_consumir_local");
        echo "Column perm_redes_sociais added.\n";
    } catch (Exception $e) {
        echo "Info (Users): " . $e->getMessage() . "\n";
    }

    try {
        $db->exec("CREATE TABLE IF NOT EXISTS social_media (
            id CHAR(36) NOT NULL DEFAULT (UUID()),
            name VARCHAR(100) NOT NULL,
            link TEXT NOT NULL,
            icon_url TEXT DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            display_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        echo "Table social_media created.\n";
    } catch (Exception $e) {
        echo "Info (Social): " . $e->getMessage() . "\n";
    }
} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
}
