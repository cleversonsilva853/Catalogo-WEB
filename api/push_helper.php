<?php
// api/push_helper.php — Sistema de notificações centralizado

/**
 * Dispara notificações push para todos os administradores cadastrados
 */
function notify_admins($title, $body, $url = '/admin/ingredients') {
    $db = getDB();
    
    // Busca todas as assinaturas de administradores
    $stmt = $db->prepare('SELECT * FROM push_subscriptions WHERE user_type = "admin"');
    $stmt->execute();
    $subs = $stmt->fetchAll();
    
    if (empty($subs)) return;

    // TODO: No futuro, integrar com biblioteca de Web Push minimalista para envio via PHP
    // Por enquanto, registramos no log e preparamos o campo para polling/realtime
    foreach ($subs as $sub) {
        // Simulando disparo ou logging para debug imediato
        error_log("PUSH NOTIFICATION: [$title] $body -> to " . $sub['endpoint']);
    }
}

/**
 * Verifica se um ingrediente atingiu o nível crítico (50% do mínimo) e notifica
 */
function check_ingredient_alert($ingredientId) {
    $db = getDB();
    $stmt = $db->prepare('SELECT name, stock_quantity, min_stock, unit FROM ingredients WHERE id = ?');
    $stmt->execute([$ingredientId]);
    $ing = $stmt->fetch();
    
    if (!$ing || $ing['min_stock'] <= 0) return;
    
    $limit = $ing['min_stock'] * 0.5;
    if ($ing['stock_quantity'] <= $limit) {
        notify_admins(
            "⚠️ Estoque Crítico: " . $ing['name'],
            "O item atingiu " . $ing['stock_quantity'] . " " . $ing['unit'] . " (abaixo de 50% do recomendado).",
            "/admin/ingredients"
        );
    }
}
