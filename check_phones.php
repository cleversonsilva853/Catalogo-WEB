<?php
require_once __DIR__ . '/api/config.php';
$db = getDB();

try {
    $stmt = $db->query("SELECT DISTINCT customer_phone FROM orders");
    $phones = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Total de telefones únicos encontrados na tabela orders: " . count($phones) . "\n";
    foreach ($phones as $phone) {
        echo "- " . $phone . "\n";
    }
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
