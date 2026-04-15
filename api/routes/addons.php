<?php
// ============================================================
// routes/addons.php — Grupos e opções de acréscimos
// ============================================================
$db = getDB();

// Auxiliar para UUID
function gen_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
}

// ─── GET ─────────────────────────────────────────────────────
if ($method === 'GET') {
    // 1. Grupos vinculados a um produto
    if ($id === 'product' && $sub) {
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

    // 2. Todos os grupos com opções (OTIMIZADO)
    if ($id === 'groups' || !$id) {
        $stmt = $db->query('SELECT * FROM addon_groups ORDER BY sort_order ASC');
        $groups = $stmt->fetchAll();
        
        $stmt = $db->query('SELECT * FROM addon_options ORDER BY sort_order');
        $allOptions = $stmt->fetchAll();
        
        $optionsByGroup = [];
        foreach ($allOptions as $opt) {
            $optionsByGroup[$opt['group_id']][] = $opt;
        }
        
        foreach ($groups as &$g) {
            $g['options'] = $optionsByGroup[$g['id']] ?? [];
            $g['is_required'] = (bool)$g['is_required'];
            $g['max_selections'] = (int)$g['max_selections'];
        }
        respond($groups);
    }

    // 3. Todas as opções
    if ($id === 'options' && !$sub) {
        $stmt = $db->query('SELECT * FROM addon_options ORDER BY sort_order');
        respond($stmt->fetchAll());
    }

    // 4. Grupo ou Opção específica
    if ($id && $sub) {
        if ($id === 'groups') {
            $stmt = $db->prepare('SELECT * FROM addon_groups WHERE id = ?');
            $stmt->execute([$sub]);
            $res = $stmt->fetch();
        } elseif ($id === 'options') {
            $stmt = $db->prepare('SELECT * FROM addon_options WHERE id = ?');
            $stmt->execute([$sub]);
            $res = $stmt->fetch();
        }
        if (!$res) respond_error('Não encontrado', 404);
        respond($res);
    }
}

// ─── POST ────────────────────────────────────────────────────
if ($method === 'POST') {
    require_auth();
    $b = get_body();
    
    // Criar Grupo (POST /addons ou POST /addons/groups)
    if (!$id || $id === 'groups') {
        if (empty($b['name'])) respond_error('Nome é obrigatório', 422);
        $uuid = gen_uuid();
        $db->prepare('INSERT INTO addon_groups (id,name,title,subtitle,is_required,max_selections,sort_order) VALUES (?,?,?,?,?,?,?)')
           ->execute([$uuid, $b['name'], $b['title'] ?? $b['name'], $b['subtitle'] ?? null,
                      isset($b['is_required']) ? (int)$b['is_required'] : 0,
                      $b['max_selections'] ?? 1, $b['sort_order'] ?? 0]);
        $stmt = $db->prepare('SELECT * FROM addon_groups WHERE id = ?');
        $stmt->execute([$uuid]);
        respond($stmt->fetch(), 201);
    }

    // Criar Opção (POST /addons/options ou POST /addons/{id}/options)
    if ($id === 'options' || ($id && $sub === 'options')) {
        if (empty($b['name'])) respond_error('Nome é obrigatório', 422);
        $groupId = ($id === 'options') ? ($b['group_id'] ?? null) : $id;
        if (!$groupId) respond_error('ID do grupo é obrigatório', 422);
        
        $uuid = gen_uuid();
        $db->prepare('INSERT INTO addon_options (id,group_id,name,price,is_available,sort_order) VALUES (?,?,?,?,?,?)')
           ->execute([$uuid, $groupId, $b['name'], $b['price'] ?? 0,
                      isset($b['is_available']) ? (int)$b['is_available'] : 1,
                      $b['sort_order'] ?? 0]);
        $stmt = $db->prepare('SELECT * FROM addon_options WHERE id = ?');
        $stmt->execute([$uuid]);
        respond($stmt->fetch(), 201);
    }
}

// ─── PUT ─────────────────────────────────────────────────────
if ($method === 'PUT' && $id && $sub) {
    require_auth();
    $b = get_body();
    $fields = []; $params = [];
    $table = ($id === 'groups') ? 'addon_groups' : (($id === 'options') ? 'addon_options' : null);
    
    if (!$table) respond_error('Tabela inválida', 400);

    $allowed = ($table === 'addon_groups') 
        ? ['name','title','subtitle','is_required','max_selections','sort_order']
        : ['name','price','is_available','sort_order','group_id'];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $params[] = in_array($f, ['is_required', 'is_available']) ? (int)$b[$f] : $b[$f];
        }
    }
    
    if ($fields) {
        $params[] = $sub;
        $db->prepare("UPDATE $table SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    }
    
    $stmt = $db->prepare("SELECT * FROM $table WHERE id = ?");
    $stmt->execute([$sub]);
    respond($stmt->fetch());
}

// ─── DELETE ──────────────────────────────────────────────────
if ($method === 'DELETE' && $id && $sub) {
    require_auth();
    $table = ($id === 'groups') ? 'addon_groups' : (($id === 'options') ? 'addon_options' : null);
    if (!$table) respond_error('Tabela inválida', 400);
    
    $db->prepare("DELETE FROM $table WHERE id = ?")->execute([$sub]);
    respond(['message' => 'Removido com sucesso']);
}

respond_error('Método não permitido ou rota inválida', 405);
