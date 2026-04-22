<?php
// api/push_helper.php — Sistema de notificações centralizado
require_once __DIR__ . '/web_push.php';

/**
 * Verifica se um ingrediente atingiu nível crítico e notifica via push real
 */
function check_ingredient_alert(string $ingredientId): void {
    $db   = getDB();
    $stmt = $db->prepare('SELECT name, stock_quantity, min_stock, unit FROM ingredients WHERE id = ?');
    $stmt->execute([$ingredientId]);
    $ing  = $stmt->fetch();

    if (!$ing || $ing['min_stock'] <= 0) return;
    if ($ing['stock_quantity'] <= $ing['min_stock'] * 0.5) {
        send_push_to_all(
            '⚠️ Estoque Crítico: ' . $ing['name'],
            'Restam ' . $ing['stock_quantity'] . ' ' . $ing['unit'] . ' (abaixo de 50% do mínimo).',
            '/admin/ingredients'
        );
    }
}
