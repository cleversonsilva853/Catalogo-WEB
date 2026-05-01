<?php
require_once __DIR__ . '/api/config.php';
$db = getDB();
$stmt = $db->query('SELECT id, customer_name, address_street, address_number, table_number, created_at FROM orders ORDER BY created_at DESC LIMIT 5');
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($orders, JSON_PRETTY_PRINT);
