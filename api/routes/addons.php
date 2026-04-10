<?php
// ============================================================
// routes/addons.php — Grupos e opções de acréscimos
// ============================================================
$db = getDB();

// GET /addons — listar grupos com opções
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM addon_groups WHERE id = ?');
        $stmt->execute([$id]);
        $group = $stmt->fetch();
        if (!$group) respond_error('Grupo não encontrado', 404);

        $opts = $db->prepare('SELECT * FROM addon_options WHERE group_id = ? ORDER BY sort_order');
        $opts->execute([$id]);
        $group['options'] = $opts->fetchAll();
        respond($group);
    }

    $stmt  = $db->query('SELECT * FROM addon_groups ORDER BY sort_order ASC');
    $groups = $stmt->fetchAll();
    foreach ($groups as &$g) {
        $opts = $db->prepare('SELECT * FROM addon_options WHERE group_id = ? ORDER BY sort_order');
        $opts->execute([$g['id']]);
        $g['options'] = $opts->fetchAll();
    }
    respond($groups);
}

// POST /addons — criar grupo
if ($method === 'POST' && !$id) {
    require_auth();
    $b = get_body();
    if (empty($b['name'])) respond_error('Nome é obrigatório', 422);

    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));

    $db->prepare('INSERT INTO addon_groups (id,name,title,subtitle,is_required,max_selections,sort_order) VALUES (?,?,?,?,?,?,?)')
       ->execute([$uuid, $b['name'], $b['title'] ?? $b['name'], $b['subtitle'] ?? null,
                  isset($b['is_required']) ? (int)(bool)$b['is_required'] : 0,
                  $b['max_selections'] ?? 1, $b['sort_order'] ?? 0]);

    $stmt = $db->prepare('SELECT * FROM addon_groups WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// POST /addons/{id}/options — adicionar opção a um grupo
if ($method === 'POST' && $id && $sub === 'options') {
    require_auth();
    $b = get_body();
    if (empty($b['name'])) respond_error('Nome é obrigatório', 422);

    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));

    $db->prepare('INSERT INTO addon_options (id,group_id,name,price,is_available,sort_order) VALUES (?,?,?,?,?,?)')
       ->execute([$uuid, $id, $b['name'], $b['price'] ?? 0,
                  isset($b['is_available']) ? (int)(bool)$b['is_available'] : 1,
                  $b['sort_order'] ?? 0]);

    $stmt = $db->prepare('SELECT * FROM addon_options WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// PUT /addons/{id}
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();
    $fields = []; $params = [];
    foreach (['name','title','subtitle','is_required','max_selections','sort_order'] as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $params[] = in_array($f, ['is_required']) ? (int)(bool)$b[$f] : $b[$f];
        }
    }
    if ($fields) {
        $params[] = $id;
        $db->prepare('UPDATE addon_groups SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    $stmt = $db->prepare('SELECT * FROM addon_groups WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// DELETE /addons/{id}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM addon_groups WHERE id = ?')->execute([$id]);
    respond(['message' => 'Grupo removido']);
}

// GET /addons/product/{product_id} — buscar grupos vinculados a um produto
if ($method === 'GET' && $id === 'product' && $sub) {
    $stmt = $db->prepare('
        SELECT ag.*, ao.id as opt_id, ao.name as opt_name, ao.price, ao.is_available
        FROM product_addon_groups pag
        JOIN addon_groups ag ON ag.id = pag.addon_group_id
        LEFT JOIN addon_options ao ON ao.group_id = ag.id
        WHERE pag.product_id = ?
        ORDER BY ag.sort_order, ao.sort_order
    ');
    $stmt->execute([$sub]);
    respond($stmt->fetchAll());
}

respond_error('Método não permitido', 405);
