<?php
// ============================================================
// routes/stories.php — Gerenciamento de Stories
// ============================================================
$db = getDB();

// GET /stories — Listar todos (público: só ativos; admin: todos)
if ($method === 'GET' && !$id) {
    $isAuthd = false;
    try { require_auth(); $isAuthd = true; } catch (Exception $e) {}

    if ($isAuthd) {
        $stmt = $db->query('SELECT * FROM stories ORDER BY display_order ASC, created_at DESC');
    } else {
        $stmt = $db->prepare('SELECT * FROM stories WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC');
        $stmt->execute();
    }
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

    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,
        mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));

    // get next order
    $maxOrder = $db->query('SELECT COALESCE(MAX(display_order), -1) + 1 FROM stories')->fetchColumn();

    $stmt = $db->prepare('
        INSERT INTO stories (id, title, subtitle, description, media_url, media_type, is_active, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $uuid,
        $b['title'] ?? null,
        $b['subtitle'] ?? null,
        $b['description'] ?? null,
        $b['media_url'],
        $b['media_type'] ?? 'image',
        isset($b['is_active']) ? (int)$b['is_active'] : 1,
        $maxOrder,
    ]);

    $stmt2 = $db->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt2->execute([$uuid]);
    respond($stmt2->fetch(), 201);
}

// PUT /stories/reorder — Reordenar stories
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

// PUT /stories/{id} — Atualizar story
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();
    $fields = []; $params = [];
    $allowed = ['title', 'subtitle', 'description', 'media_url', 'media_type', 'is_active', 'display_order'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    }
    if (!$fields) respond_error('Nenhum campo para atualizar', 422);
    $params[] = $id;
    $db->prepare('UPDATE stories SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    $stmt = $db->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// DELETE /stories/{id}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM stories WHERE id = ?')->execute([$id]);
    respond(['message' => 'Story removido']);
}

respond_error('Método não permitido', 405);
