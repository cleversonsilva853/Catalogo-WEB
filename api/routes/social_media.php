<?php
// routes/social_media.php — CRUD de redes sociais
$db = getDB();

if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM social_media ORDER BY display_order ASC, name ASC');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    require_auth();
    $b = get_body();
    if (empty($b['name']) || empty($b['link'])) respond_error('Nome e link são obrigatórios', 422);

    $id = gen_uuid();
    $stmt = $db->prepare('INSERT INTO social_media (id, name, link, icon_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $id,
        $b['name'],
        $b['link'],
        $b['icon_url'] ?? null,
        isset($b['is_active']) ? (int)$b['is_active'] : 1,
        isset($b['display_order']) ? (int)$b['display_order'] : 0
    ]);

    $stmt = $db->prepare('SELECT * FROM social_media WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();
    $fields = [];
    $params = [];

    $allowed = ['name', 'link', 'icon_url', 'is_active', 'display_order'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $params[] = $f === 'is_active' ? (int)$b[$f] : $b[$f];
        }
    }

    if (!$fields) respond_error('Nenhum campo para atualizar', 422);

    $params[] = $id;
    $db->prepare('UPDATE social_media SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = $db->prepare('SELECT * FROM social_media WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM social_media WHERE id = ?')->execute([$id]);
    respond(['message' => 'Rede social removida']);
}

respond_error('Método não permitido', 405);

function gen_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
}
