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

// GET /comandas ou sub-rotas
if ($method === 'GET') {
    require_auth();

    // 1. GET /comandas/pedidos?comanda_id=...
    if ($id === 'pedidos') {
        $comandaId = $_GET['comanda_id'] ?? null;
        if (!$comandaId)
            respond([]);
        $stmt = $db->prepare('SELECT * FROM comanda_pedidos WHERE comanda_id = ?');
        $stmt->execute([$comandaId]);
        respond($stmt->fetchAll());
    }

    // 2. GET /comandas/order-details?comanda_id=...
    if ($id === 'order-details') {
        $comandaId = $_GET['comanda_id'] ?? null;
        if (!$comandaId)
            respond([]);
        $stmt = $db->prepare('
            SELECT o.*, 
            (SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = o.id) as total_price
            FROM orders o
            INNER JOIN comanda_pedidos cp ON cp.pedido_id = o.id
            WHERE cp.comanda_id = ?
            ORDER BY o.created_at ASC
        ');
        $stmt->execute([$comandaId]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$o) {
            $stmtI = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
            $stmtI->execute([$o['id']]);
            $o['items'] = $stmtI->fetchAll();
        }
        respond($orders);
    }

    // 3. GET /comandas/{id}
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM comandas WHERE id = ?');
        $stmt->execute([$id]);
        $comanda = $stmt->fetch();
        if (!$comanda)
            respond_error('Comanda não encontrada', 404);
        respond($comanda);
    }

    // 4. GET /comandas (listar todas - livre e ocupada)
    if (isset($_GET['status'])) {
        $stmt = $db->prepare("SELECT * FROM comandas WHERE status = ? ORDER BY numero_comanda ASC");
        $stmt->execute([$_GET['status']]);
    }
    else {
        $stmt = $db->query("SELECT * FROM comandas WHERE status IN ('livre', 'ocupada') ORDER BY numero_comanda ASC");
    }
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    require_auth();
    $b = get_body();

    // 1. POST /comandas/orders (Adicionar pedido e itens)
    if ($id === 'orders') {
        $comandaId = $b['comanda_id'] ?? null;
        $items = $b['items'] ?? [];
        if (!$comandaId || !$items)
            respond_error('Dados incompletos', 422);

        $db->beginTransaction();
        try {
            $total = 0;
            foreach ($items as $item) {
                $total += $item['quantity'] * $item['unit_price'];
            }

            $stmtO = $db->prepare("INSERT INTO orders (customer_name, status, total_amount, payment_method) VALUES ('Comanda Local', 'pending', ?, 'dinheiro')");
            $stmtO->execute([$total]);
            $orderId = $db->lastInsertId();

            $stmtI = $db->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
            foreach ($items as $item) {
                $stmtI->execute([$orderId, $item['product_id'], $item['product_name'] ?? 'Item', $item['quantity'], $item['unit_price']]);
            }

            $uuidC = comanda_uuid();
            $db->prepare("INSERT INTO comanda_pedidos (id, comanda_id, pedido_id) VALUES (?, ?, ?)")
                ->execute([$uuidC, $comandaId, $orderId]);

            $db->prepare("UPDATE comandas SET status = 'ocupada' WHERE id = ?")
                ->execute([$comandaId]);

            $db->commit();
            respond(['message' => 'Pedido adicionado']);
        }
        catch (Exception $e) {
            $db->rollBack();
            respond_error('Erro: ' . $e->getMessage(), 500);
        }
    }

    // 2. POST /comandas/close (Fechar venda)
    if ($id === 'close') {
        $comandaId = $b['comanda_id'] ?? null;
        $vTotal = $b['valor_total'] ?? 0;
        $formaPagamento = $b['forma_pagamento'] ?? 'dinheiro';

        if (!$comandaId)
            respond_error('comanda_id requerido', 422);

        $vId = comanda_uuid();
        $db->prepare("INSERT INTO comanda_vendas (id, comanda_id, forma_pagamento, valor_total, data_venda) VALUES (?,?,?,?,CURDATE())")
            ->execute([$vId, $comandaId, $formaPagamento, $vTotal]);

        $db->prepare("UPDATE comandas SET status = 'livre' WHERE id = ?")
            ->execute([$comandaId]);

        $db->prepare("DELETE FROM comanda_pedidos WHERE comanda_id = ?")->execute([$comandaId]);

        respond(['message' => 'Comanda fechada com sucesso']);
    }

    // 3. POST /comandas/transfer (Transferir pedidos)
    if ($id === 'transfer') {
        $source = $b['source_comanda_id'] ?? null;
        $target = $b['target_comanda_id'] ?? null;

        if (!$source || !$target)
            respond_error('As comandas (origem e destino) são necessárias', 422);

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE comanda_pedidos SET comanda_id = ? WHERE comanda_id = ?")->execute([$target, $source]);
            $db->prepare("UPDATE comandas SET status = 'livre' WHERE id = ?")->execute([$source]);
            $db->prepare("UPDATE comandas SET status = 'ocupada' WHERE id = ?")->execute([$target]);
            $db->commit();
            respond(['message' => 'Transferido com sucesso']);
        }
        catch (Exception $e) {
            $db->rollBack();
            respond_error('Erro: ' . $e->getMessage(), 500);
        }
    }

    // 4. POST /comandas (Criar Nova Comanda)
    if (!$id) {
        if (empty($b['numero_comanda']))
            respond_error('numero_comanda é obrigatório', 422);

        $uuid = comanda_uuid();
        $status = $b['status'] ?? 'livre';
        $db->prepare("INSERT INTO comandas (id, numero_comanda, status) VALUES (?, ?, ?)")
            ->execute([$uuid, (int)$b['numero_comanda'], $status]);

        $stmt = $db->prepare('SELECT * FROM comandas WHERE id = ?');
        $stmt->execute([$uuid]);
        respond($stmt->fetch(), 201);
    }
}

// PUT /comandas/{id}
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();

    if (!empty($b['status'])) {
        $db->prepare('UPDATE comandas SET status = ? WHERE id = ?')->execute([$b['status'], $id]);
        $stmt = $db->prepare('SELECT * FROM comandas WHERE id = ?');
        $stmt->execute([$id]);
        respond($stmt->fetch());
    }
    respond_error('Nenhum campo validado', 422);
}

// DELETE /comandas/{id}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM comandas WHERE id = ?')->execute([$id]);
    respond(['message' => 'Comanda removida']);
}

respond_error('Método não permitido', 405);
