<?php
// ============================================================
// routes/tables.php — Mesas (mapeia para tables_list)
// ============================================================
$db = getDB();

if ($method === 'GET') {
    try {
        $stmt = $db->query('SELECT * FROM tables_list ORDER BY number ASC');
        respond($stmt->fetchAll());
    } catch (Exception $e) {
        respond([]);
    }
}

if ($method === 'POST') {
    require_auth();
    $b = get_body();
    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
    $db->prepare('INSERT INTO tables_list (id, number, name, capacity, status) VALUES (?,?,?,?,?)')
       ->execute([$uuid, $b['number'] ?? 1, $b['name'] ?? null, $b['capacity'] ?? 4, 'available']);
    $stmt = $db->prepare('SELECT * FROM tables_list WHERE id = ?'); $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body(); $fields = []; $params = [];
    foreach (['number','name','capacity','status'] as $f)
        if (array_key_exists($f, $b)) { $fields[] = "$f=?"; $params[] = $b[$f]; }
    if ($fields) {
        $params[] = $id;
        $db->prepare('UPDATE tables_list SET '.implode(',',$fields).' WHERE id=?')->execute($params);
    }
    $stmt = $db->prepare('SELECT * FROM tables_list WHERE id=?'); $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM tables_list WHERE id=?')->execute([$id]);
    respond(['message' => 'Mesa removida']);
}

respond([]);
