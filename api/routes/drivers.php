<?php
// routes/drivers.php — Entregadores
$db = getDB();

if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM drivers WHERE id = ?');
        $stmt->execute([$id]);
        respond($stmt->fetch() ?: respond_error('Não encontrado', 404));
    }
    $active = $_GET['active'] ?? null;
    $sql = 'SELECT * FROM drivers';
    $params = [];
    if ($active !== null) { $sql .= ' WHERE is_active = ?'; $params[] = $active === 'true' ? 1 : 0; }
    $sql .= ' ORDER BY name ASC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

function gen_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

if ($method === 'POST') {
    require_auth();
    $b = get_body();
    if (empty($b['name'])) respond_error('Nome é obrigatório', 422);
    $uuid = gen_uuid();
    $db->prepare('INSERT INTO drivers (id,name,phone,commission_percentage,is_active) VALUES (?,?,?,?,?)')
       ->execute([$uuid, $b['name'], $b['phone'] ?? null, $b['commission_percentage'] ?? 0, isset($b['is_active']) ? (int)(bool)$b['is_active'] : 1]);
    $stmt = $db->prepare('SELECT * FROM drivers WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body(); $fields = []; $params = [];
    foreach (['name','phone','commission_percentage','is_active'] as $f) {
        if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $f === 'is_active' ? (int)(bool)$b[$f] : $b[$f]; }
    }
    $params[] = $id;
    $db->prepare('UPDATE drivers SET '.implode(', ',$fields).' WHERE id = ?')->execute($params);
    $stmt = $db->prepare('SELECT * FROM drivers WHERE id = ?'); $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM drivers WHERE id = ?')->execute([$id]);
    respond(['message' => 'Entregador removido']);
}

respond_error('Método não permitido', 405);
