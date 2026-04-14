<?php
// ============================================================
// routes/comandas.php — Comandas de consumo local
// ============================================================
$db = getDB();

function comanda_uuid(): string
{
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
}

// GET /comandas ou GET /comandas/{id}
if ($method === 'GET') {
    require_auth();

    if ($id) {
        $stmt = $db->prepare('SELECT * FROM comandas WHERE id = ?');
        $stmt->execute([$id]);
        $comanda = $stmt->fetch();
        if (!$comanda)
            respond_error('Comanda não encontrada', 404);

        // Pedidos vinculados
        $stmtP = $db->prepare('
            SELECT o.* FROM orders o
            INNER JOIN comanda_pedidos cp ON cp.pedido_id = o.id
            WHERE cp.comanda_id = ?
            ORDER BY o.created_at ASC
        ');
        $stmtP->execute([$id]);
        $pedidos = $stmtP->fetchAll();

        // Vendas
        $stmtV = $db->prepare('SELECT * FROM comanda_vendas WHERE comanda_id = ?');
        $stmtV->execute([$id]);
        $vendas = $stmtV->fetchAll();

        respond(['comanda' => $comanda, 'pedidos' => $pedidos, 'vendas' => $vendas]);
    }

    // Listar todas (abertas por padrão)
    $status = $_GET['status'] ?? 'open';
    $stmt = $db->prepare("SELECT * FROM comandas WHERE status = ? ORDER BY numero_comanda ASC");
    $stmt->execute([$status]);
    respond($stmt->fetchAll());
}

// POST /comandas — abrir nova comanda
if ($method === 'POST') {
    require_auth();
    $b = get_body();

    if (empty($b['numero_comanda']))
        respond_error('numero_comanda é obrigatório', 422);

    $uuid = comanda_uuid();
    $db->prepare("INSERT INTO comandas (id, numero_comanda, status) VALUES (?, ?, 'open')")
        ->execute([$uuid, (int)$b['numero_comanda']]);

    $stmt = $db->prepare('SELECT * FROM comandas WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// PUT /comandas/{id} — atualizar status ou vincular pedido/venda
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();

    // Vincular pedido: PUT /comandas/{id} com { pedido_id }
    if (!empty($b['pedido_id'])) {
        $uuid = comanda_uuid();
        $db->prepare('INSERT IGNORE INTO comanda_pedidos (id, comanda_id, pedido_id) VALUES (?,?,?)')
            ->execute([$uuid, $id, (int)$b['pedido_id']]);
        respond(['message' => 'Pedido vinculado à comanda']);
    }

    // Registrar venda/fechamento: PUT /comandas/{id} com { forma_pagamento, valor_total }
    if (!empty($b['forma_pagamento'])) {
        $vId = comanda_uuid();
        $db->prepare("INSERT INTO comanda_vendas (id, comanda_id, forma_pagamento, valor_total, data_venda) VALUES (?,?,?,?,CURDATE())")
            ->execute([$vId, $id, $b['forma_pagamento'], $b['valor_total'] ?? 0]);
        $db->prepare("UPDATE comandas SET status = 'closed' WHERE id = ?")
            ->execute([$id]);
        respond(['message' => 'Comanda fechada com sucesso']);
    }

    // Atualizar status simples
    if (!empty($b['status'])) {
        $db->prepare('UPDATE comandas SET status = ? WHERE id = ?')->execute([$b['status'], $id]);
        $stmt = $db->prepare('SELECT * FROM comandas WHERE id = ?');
        $stmt->execute([$id]);
        respond($stmt->fetch());
    }

    respond_error('Nenhum campo reconhecido para atualizar', 422);
}

// DELETE /comandas/{id}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM comandas WHERE id = ?')->execute([$id]);
    respond(['message' => 'Comanda removida']);
}

respond_error('Método não permitido', 405);
