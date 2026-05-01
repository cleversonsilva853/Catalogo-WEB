<?php
// ============================================================
// routes/orders.php — Pedidos de delivery
// ============================================================
$db = getDB();

// GET /orders/driver/{driverId} — todos os pedidos de um entregador (histórico completo)
if ($method === 'GET' && $id === 'driver' && $sub) {
    // Não exigimos auth restrito aqui pois o driver_id já serve como token de acesso simples para este portal
    $stmt = $db->prepare('SELECT * FROM orders WHERE driver_id = ? ORDER BY created_at DESC LIMIT 500');
    $stmt->execute([$sub]);
    respond($stmt->fetchAll());
}

// GET /orders/all — todos os pedidos (unificado para Dashboard)
if ($method === 'GET' && $id === 'all') {
    require_auth();
    $stmt = $db->query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500');
    respond($stmt->fetchAll());
}

// GET /orders/by-phone — busca pública de histórico por telefone
if ($method === 'GET' && $id === 'by-phone') {
    $phone = $_GET['phone'] ?? null;
    if (!$phone) respond_error('Telefone obrigatório', 422);

    // Normaliza para apenas números para busca resiliente
    $cleanPhone = preg_replace('/\D/', '', $phone);
    
    // Busca comparando o formato exato OU a versão limpa (apenas números)
    $stmt = $db->prepare("
        SELECT * FROM orders 
        WHERE customer_phone = ? 
           OR REPLACE(REPLACE(REPLACE(REPLACE(customer_phone, '(', ''), ')', ''), '-', ''), ' ', '') = ?
        ORDER BY created_at DESC 
        LIMIT 50
    ");
    $stmt->execute([$phone, $cleanPhone]);
    respond($stmt->fetchAll());
}

// GET /orders/kitchen — Itens para a cozinha
if ($method === 'GET' && $id === 'kitchen') {
    require_auth();
    $stmt = $db->prepare("
        SELECT 
            oi.*, 
            o.customer_name, 
            o.table_number,
            o.created_at as ordered_at,
            c.numero_comanda,
            (CASE WHEN c.id IS NOT NULL OR o.table_number IS NOT NULL THEN 'table' ELSE 'delivery' END) as order_type
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN comanda_pedidos cp ON o.id = cp.pedido_id
        LEFT JOIN comandas c ON cp.comanda_id = c.id
        WHERE oi.status IN ('pending', 'accepted', 'preparing', 'ready')
          AND o.status != 'cancelled'
          AND DATE(o.created_at) = CURDATE()
        ORDER BY oi.created_at ASC
    ");
    $stmt->execute();
    respond($stmt->fetchAll());
}

// PUT /orders/kitchen/{itemId} — Atualizar status do item na cozinha
if ($method === 'PUT' && $id === 'kitchen' && $sub) {
    require_auth();
    $b = get_body();
    if (empty($b['status'])) respond_error('Status obrigatório', 422);

    // 1. Atualizar o item
    $stmt = $db->prepare("UPDATE order_items SET status = ? WHERE id = ?");
    $stmt->execute([$b['status'], $sub]);

    // 2. Buscar o order_id deste item
    $stmt = $db->prepare("SELECT order_id FROM order_items WHERE id = ?");
    $stmt->execute([$sub]);
    $orderData = $stmt->fetch();

    if ($orderData) {
        $orderId = $orderData['order_id'];

        // 3. Buscar status de todos os itens deste pedido
        $stmt = $db->prepare("SELECT status FROM order_items WHERE order_id = ?");
        $stmt->execute([$orderId]);
        $items = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // 4. Determinar novo status do pedido mestre
        // Regras:
        // - Se todos 'ready' -> pronto
        // - Se algum 'preparing' -> preparando
        // - Se algum 'accepted' (e nenhum preparação/pronto) -> aceito
        
        $newOrderStatus = null;
        $allReady = true;
        $anyPreparing = false;
        $anyAccepted = false;

        foreach ($items as $s) {
            if ($s !== 'ready') $allReady = false;
            if ($s === 'preparing') $anyPreparing = true;
            if ($s === 'accepted') $anyAccepted = true;
        }

        if ($allReady) {
            $newOrderStatus = 'ready';
        } elseif ($anyPreparing) {
            $newOrderStatus = 'preparing';
        } elseif ($anyAccepted) {
            $newOrderStatus = 'accepted';
        }

        // 5. Atualizar o pedido mestre se necessário
        if ($newOrderStatus) {
            $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ? AND status NOT IN ('delivery', 'completed', 'cancelled')");
            $stmt->execute([$newOrderStatus, $orderId]);
        }
    }

    respond(['message' => 'Status atualizado', 'id' => $sub, 'status' => $b['status']]);
}

// GET /orders  |  GET /orders/{id}
if ($method === 'GET') {
    if ($id) {
        // Suporte a busca pública por telefone (substitui RPC get_order_with_items_public)
        $phone = $_GET['phone'] ?? null;
        $stmt  = $db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) respond_error('Pedido não encontrado', 404);

        // Se vier telefone, valida que pertence ao cliente
        if ($phone && $order['customer_phone'] !== $phone) {
            respond_error('Acesso negado', 403);
        }

        $stmtItems = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll();

        respond(['order' => $order, 'items' => $items]);
    }

    // Admin: listar pedidos (todos ou só ativos + últimas 24h)
    require_auth();
    $last24h = date('Y-m-d H:i:s', strtotime('-24 hours'));
    $stmt = $db->prepare('
        SELECT * FROM orders
        WHERE status NOT IN ("completed","cancelled")
           OR created_at >= ?
        ORDER BY created_at DESC
    ');
    $stmt->execute([$last24h]);
    respond($stmt->fetchAll());
}


// PUT /orders/unified-status/{id} — Atualização unificada (delivery ou mesa)
if ($method === 'PUT' && $id === 'unified-status' && $sub) {
    require_auth();
    $b = get_body();
    $status = $b['status'] ?? null;
    $orderType = $b['order_type'] ?? 'delivery';

    if (!$status) respond_error('Status obrigatório', 422);

    if ($orderType === 'table') {
        // Para mesas, atualizamos comanda_pedidos ou mesa direta dependendo da arquitetura
        // No momento usamos a tabela 'orders' para o Kanban unificado
        $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $sub]);
    } else {
        $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $sub]);
    }

    respond(['message' => 'Status unificado atualizado', 'id' => $sub, 'status' => $status]);
}

// POST /orders — Criar pedido (substitui RPC create_order_with_items)
if ($method === 'POST' && !$id) {
    $b = get_body();

    $required = ['customer_name','customer_phone','address_street','address_number','address_neighborhood','payment_method','items'];
    foreach ($required as $f) {
        if (empty($b[$f])) respond_error("Campo obrigatório: $f", 422);
    }

    $db->beginTransaction();
    try {
        $table_num = $b['table_number'] ?? null;
        if ($b['address_street'] === 'Consumir no Local' && !$table_num) {
            $table_num = (int)$b['address_number'];
        }

        $db->prepare('
            INSERT INTO orders
                (customer_name, customer_phone, address_street, address_number,
                 address_neighborhood, address_complement, address_reference,
                 total_amount, payment_method, change_for,
                 latitude, longitude, delivery_zone_id, delivery_fee,
                 coupon_code, discount_amount, table_number, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ')->execute([
            $b['customer_name'],
            $b['customer_phone'],
            $b['address_street'],
            $b['address_number'],
            $b['address_neighborhood'],
            $b['address_complement']  ?? null,
            $b['address_reference']   ?? null,
            $b['total_amount']        ?? 0,
            $b['payment_method'],
            $b['change_for']          ?? null,
            $b['latitude']            ?? null,
            $b['longitude']           ?? null,
            $b['delivery_zone_id']    ?? null,
            $b['delivery_fee']        ?? 0,
            $b['coupon_code']         ?? null,
            $b['discount_amount']     ?? 0,
            $table_num,
            'pending',
        ]);

        $orderId = (int)$db->lastInsertId();

        $stmtItem = $db->prepare('
            INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, observation, addons)
            VALUES (?,?,?,?,?,?,?,?)
        ');

        foreach ($b['items'] as $item) {
            $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
                mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
                mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));

            $stmtItem->execute([
                $uuid,
                $orderId,
                $item['product_id']  ?? null,
                $item['product_name'],
                $item['quantity']    ?? 1,
                $item['unit_price']  ?? 0,
                $item['observation'] ?? null,
                isset($item['addons']) ? json_encode($item['addons']) : null,
            ]);

            // --- Gerenciamento de Estoque ---
            if (!empty($item['product_id'])) {
                // 1. Verificar tipo de estoque do produto
                $stmtProd = $db->prepare('SELECT stock_type, stock_quantity FROM products WHERE id = ?');
                $stmtProd->execute([$item['product_id']]);
                $prod = $stmtProd->fetch();

                if ($prod) {
                    $qty = $item['quantity'] ?? 1;
                    
                    if ($prod['stock_type'] === 'unit') {
                        // Baixa de estoque simples (unidade)
                        $db->prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
                           ->execute([$qty, $item['product_id']]);
                        
                        // Nota: Alerta de produto unitário (opcional, foco em ingredientes conforme pedido)
                    } else {
                        // Baixa de ingredientes (composição)
                        $stmtPI = $db->prepare('SELECT ingredient_id, quantity_used FROM product_ingredients WHERE product_id = ?');
                        $stmtPI->execute([$item['product_id']]);
                        $ingredients = $stmtPI->fetchAll();

                        require_once __DIR__ . '/../push_helper.php';
                        foreach ($ingredients as $ing) {
                            $totalUsed = $ing['quantity_used'] * $qty;
                            $db->prepare('UPDATE ingredients SET stock_quantity = stock_quantity - ? WHERE id = ?')
                               ->execute([$totalUsed, $ing['ingredient_id']]);
                            
                            // Verificar alerta crítico (50%)
                            check_ingredient_alert($ing['ingredient_id']);
                        }
                    }
                }
            }
            // --------------------------------
        }

        // Incrementar uso do cupom se houver
        if (!empty($b['coupon_code'])) {
            $db->prepare('UPDATE coupons SET current_uses = current_uses + 1 WHERE code = ?')
               ->execute([$b['coupon_code']]);
        }

        $db->commit();
        respond(['id' => $orderId], 201);
    } catch (Exception $e) {
        $db->rollBack();
        respond_error('Erro ao criar pedido: ' . $e->getMessage(), 500);
    }
}

// PUT /orders/{id} — Atualizar status ou dados
if ($method === 'PUT' && $id) {
    // Status pode ser atualizado sem auth (cozinha, entregador)
    // Dados sensíveis exigem auth
    $b = get_body();

    $fields = []; $params = [];
    $allowed = ['status','driver_id','driver_name','payment_method','total_amount','table_number'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
    }
    if (!$fields) respond_error('Nenhum campo para atualizar', 422);

    $params[] = $id;
    $db->prepare('UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// DELETE /orders/{id}
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM orders WHERE id = ?')->execute([$id]);
    respond(['message' => 'Pedido removido']);
}

respond_error('Método não permitido', 405);
