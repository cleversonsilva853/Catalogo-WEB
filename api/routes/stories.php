<?php
// ============================================================
// routes/stories.php — Gerenciamento de Stories
// ============================================================
$db = getDB();

// GET /stories/debug-push — Diagnóstico: mostra o que seria enviado na notificação (sem enviar)
if ($method === 'GET' && $id === 'debug-push') {
    $store     = $db->query('SELECT id, name FROM store_config LIMIT 1')->fetch();
    $stories   = $db->query('SELECT id, title, subtitle, media_type, is_active, notification_sent, scheduled_at FROM stories ORDER BY display_order ASC')->fetchAll();
    $subs      = $db->query('SELECT COUNT(*) FROM push_subscriptions')->fetchColumn();

    respond([
        'store_name'         => $store['name'] ?? null,
        'store_id'           => $store['id']   ?? null,
        'total_subscriptions'=> (int)$subs,
        'stories'            => $stories,
        'notification_preview' => array_map(fn($s) => [
            'story_id'    => $s['id'],
            'notif_title' => $store['name'] ?? 'Delivery',
            'notif_body'  => $s['title'] ?: ($s['subtitle'] ?: 'Novo story disponível! Toque para ver.'),
        ], $stories),
    ]);
}

// GET /stories/check-notifications — chamado pelo cron do HostGator (a cada minuto)
// Verifica stories com scheduled_at <= NOW() e envia push para todos os dispositivos
if ($method === 'GET' && $id === 'check-notifications') {
    require_once __DIR__ . '/../web_push.php';

    // Busca o nome do restaurante para usar como título da notificação
    $store = $db->query('SELECT name FROM store_config LIMIT 1')->fetch();
    $storeName = $store['name'] ?? 'Delivery';

    $stmt = $db->prepare("
        SELECT * FROM stories
        WHERE scheduled_at IS NOT NULL
          AND scheduled_at <= NOW()
          AND notification_sent = 0
          AND is_active = 1
    ");
    $stmt->execute();
    $pending = $stmt->fetchAll();

    $results = [];
    foreach ($pending as $story) {
        // Título da notificação = Nome do Restaurante
        // Corpo da notificação  = Título do story (o que o usuário criou)
        $notifTitle = $storeName;
        $notifBody  = $story['title'] ?: ($story['subtitle'] ?: 'Novo story disponível! Toque para ver.');
        $url        = '/?open_stories=1';
        $icon       = $story['media_type'] === 'image'
                        ? $story['media_url']
                        : (defined('BASE_URL') ? BASE_URL . '/icon-192.png' : '/icon-192.png');

        $sent = send_push_to_all($notifTitle, $notifBody, $url, $icon);

        // Marca como enviado (evita reenvios infinitos)
        $db->prepare('UPDATE stories SET notification_sent = 1 WHERE id = ?')
           ->execute([$story['id']]);

        $results[] = ['id' => $story['id'], 'title' => $notifTitle, 'body' => $notifBody, 'push_sent' => $sent];
    }

    // Conta subscriptions para diagnóstico
    $total_subs = $db->query('SELECT COUNT(*) FROM push_subscriptions')->fetchColumn();

    respond(['processed' => count($pending), 'results' => $results, 'total_subscriptions' => (int)$total_subs]);
}



// GET /stories — Listar todos (público: acesso livre, sem autenticação necessária)
if ($method === 'GET' && !$id) {
    $stmt = $db->query('SELECT * FROM stories ORDER BY display_order ASC, created_at DESC');
    respond($stmt->fetchAll());
}

// GET /stories/{id}
if ($method === 'GET' && $id) {
    $stmt = $db->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt->execute([$id]);
    $story = $stmt->fetch();
    if (!$story) respond_error('Story não encontrado', 404);
    respond($story);
}

// POST /stories — Criar novo story
if ($method === 'POST' && !$id) {
    require_auth();
    $b = get_body();

    if (empty($b['media_url'])) respond_error('URL da mídia é obrigatória', 422);

    // Limite: máximo de 10 stories
    $total = $db->query('SELECT COUNT(*) FROM stories')->fetchColumn();
    if ($total >= 10) {
        respond_error('Limite de 10 stories atingido. Remova um story antes de criar um novo.', 422);
    }
    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));

    $maxOrder = $db->query('SELECT COALESCE(MAX(display_order), -1) + 1 FROM stories')->fetchColumn();

    // Normaliza scheduled_at: converte datetime-local (sem timezone) para formato MySQL
    $scheduled = null;
    if (!empty($b['scheduled_at'])) {
        $dt = DateTime::createFromFormat('Y-m-d\TH:i', $b['scheduled_at'], new DateTimeZone('America/Sao_Paulo'));
        if ($dt) $scheduled = $dt->format('Y-m-d H:i:s');
    }

    $stmt = $db->prepare('
        INSERT INTO stories (id, title, subtitle, description, media_url, media_type, is_active, display_order, scheduled_at, notification_sent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ');
    $stmt->execute([
        $uuid,
        $b['title']      ?? null,
        $b['subtitle']   ?? null,
        $b['description'] ?? null,
        $b['media_url'],
        $b['media_type'] ?? 'image',
        isset($b['is_active']) ? (int)$b['is_active'] : 1,
        $maxOrder,
        $scheduled,
    ]);

    $stmt2 = $db->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt2->execute([$uuid]);
    respond($stmt2->fetch(), 201);
}

// PUT /stories/reorder
if ($method === 'PUT' && $id === 'reorder') {
    require_auth();
    $b = get_body();
    $updates = $b['updates'] ?? [];
    $stmt = $db->prepare('UPDATE stories SET display_order = ? WHERE id = ?');
    foreach ($updates as $upd) {
        $stmt->execute([(int)$upd['display_order'], $upd['id']]);
    }
    respond(['message' => 'Ordem atualizada']);
}

// PUT /stories/{id}
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();
    $fields = []; $params = [];

    $allowed = ['title', 'subtitle', 'description', 'media_url', 'media_type', 'is_active', 'display_order', 'notification_sent'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) { 
            $fields[] = "$f = ?"; 
            $params[] = ($f === 'is_active' || $f === 'notification_sent' || $f === 'display_order') ? (int)$b[$f] : $b[$f]; 
        }
    }

    // Trata scheduled_at separadamente (converte datetime-local → MySQL)
    if (array_key_exists('scheduled_at', $b)) {
        if (empty($b['scheduled_at'])) {
            $fields[] = 'scheduled_at = ?'; $params[] = null;
            $fields[] = 'notification_sent = ?'; $params[] = 0;
        } else {
            $dt = DateTime::createFromFormat('Y-m-d\TH:i', $b['scheduled_at'], new DateTimeZone('America/Sao_Paulo'));
            $fields[] = 'scheduled_at = ?'; $params[] = $dt ? $dt->format('Y-m-d H:i:s') : null;
            $fields[] = 'notification_sent = ?'; $params[] = 0; // resetar ao regendar
        }
    }

    if (!$fields) respond_error('Nenhum campo para atualizar', 422);
    $params[] = $id;
    $db->prepare('UPDATE stories SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = $db->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// POST /stories/{id}/send-notification — Reenvio manual de notificação push para um story
if ($method === 'POST' && $sub === 'send-notification') {
    require_auth();
    require_once __DIR__ . '/../web_push.php';

    $stmt = $db->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt->execute([$id]);
    $story = $stmt->fetch();
    if (!$story) respond_error('Story não encontrado', 404);

    // Busca o nome do restaurante
    $store     = $db->query('SELECT name FROM store_config LIMIT 1')->fetch();
    $storeName = $store['name'] ?? 'Delivery';

    $notifTitle = $storeName;
    $notifBody  = $story['title'] ?: ($story['subtitle'] ?: 'Novo story disponível! Toque para ver.');
    $url        = '/?open_stories=1';
    $icon       = $story['media_type'] === 'image'
                    ? $story['media_url']
                    : (defined('BASE_URL') ? BASE_URL . '/icon-192.png' : '/icon-192.png');

    $sent = send_push_to_all($notifTitle, $notifBody, $url, $icon);

    // Marca como enviado
    $db->prepare('UPDATE stories SET notification_sent = 1 WHERE id = ?')->execute([$id]);

    respond([
        'message'     => $sent > 0 ? "Notificação enviada para $sent dispositivo(s)" : 'Nenhum dispositivo recebeu (verifique as subscriptions)',
        'sent'        => $sent,
        'notif_title' => $notifTitle,
        'notif_body'  => $notifBody,
    ]);
}

// DELETE /stories/{id}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM stories WHERE id = ?')->execute([$id]);
    respond(['message' => 'Story removido']);
}

respond_error('Método não permitido', 405);
