<?php
// ============================================================
// routes/customer_addresses.php — Endereços de clientes
// ============================================================
$db = getDB();

function addr_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

// GET /customer-addresses?phone={phone}
if ($method === 'GET') {
    $phone = $_GET['phone'] ?? '';
    if (!$phone) respond_error('Parâmetro phone é obrigatório', 422);

    $stmt = $db->prepare('SELECT * FROM customer_addresses WHERE customer_phone = ? ORDER BY is_default DESC, label ASC');
    $stmt->execute([$phone]);
    respond($stmt->fetchAll());
}

// POST /customer-addresses — criar endereço
if ($method === 'POST') {
    $b = get_body();
    $required = ['customer_phone','street','number','neighborhood'];
    foreach ($required as $f) {
        if (empty($b[$f])) respond_error("Campo obrigatório: $f", 422);
    }

    $uuid = addr_uuid();

    // Se for padrão, remove default dos outros
    if (!empty($b['is_default'])) {
        $db->prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_phone = ?')
           ->execute([$b['customer_phone']]);
    }

    $db->prepare('INSERT INTO customer_addresses (id, customer_phone, label, street, number, neighborhood, complement, reference, is_default) VALUES (?,?,?,?,?,?,?,?,?)')
       ->execute([
           $uuid,
           $b['customer_phone'],
           $b['label']       ?? 'Casa',
           $b['street'],
           $b['number'],
           $b['neighborhood'],
           $b['complement']  ?? null,
           $b['reference']   ?? null,
           !empty($b['is_default']) ? 1 : 0,
       ]);

    $stmt = $db->prepare('SELECT * FROM customer_addresses WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// PUT /customer-addresses/{id}
if ($method === 'PUT' && $id) {
    $b = get_body();

    if (!empty($b['is_default'])) {
        // Primeiro pega o phone do endereço
        $stmtPhone = $db->prepare('SELECT customer_phone FROM customer_addresses WHERE id = ?');
        $stmtPhone->execute([$id]);
        $row = $stmtPhone->fetch();
        if ($row) {
            $db->prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_phone = ?')
               ->execute([$row['customer_phone']]);
        }
    }

    $fields = []; $params = [];
    $allowed = ['label','street','number','neighborhood','complement','reference','is_default'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $params[] = ($f === 'is_default') ? (int)(bool)$b[$f] : $b[$f];
        }
    }
    if (!$fields) respond_error('Nenhum campo para atualizar', 422);
    $params[] = $id;
    $db->prepare('UPDATE customer_addresses SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = $db->prepare('SELECT * FROM customer_addresses WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// DELETE /customer-addresses/{id}
if ($method === 'DELETE' && $id) {
    $db->prepare('DELETE FROM customer_addresses WHERE id = ?')->execute([$id]);
    respond(['message' => 'Endereço removido']);
}

respond_error('Método não permitido', 405);
