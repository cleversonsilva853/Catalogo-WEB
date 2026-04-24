<?php
// ============================================================
// routes/products.php — CRUD de produtos
// ============================================================

$db = getDB();

// GET /products ou GET /products/{id} ou GET /products/addons
if ($method === 'GET' && !$sub) {
    // Caso especial: acréscimos de produtos (chamado por useProductAddons)
    if ($id === 'addons') {
        $productId = $_GET['product_id'] ?? null;
        if (!$productId) respond_error('product_id é obrigatório', 422);

        // Buscar grupos vinculados ao produto
        $stmt = $db->prepare('
            SELECT ag.*
            FROM product_addon_groups pag
            JOIN addon_groups ag ON ag.id = pag.addon_group_id
            WHERE pag.product_id = ?
            ORDER BY ag.sort_order ASC
        ');
        $stmt->execute([$productId]);
        $groups = $stmt->fetchAll();

        if ($groups) {
            $groupIds = array_map(fn($g) => $g['id'], $groups);
            $placeholders = implode(',', array_fill(0, count($groupIds), '?'));
            
            // Buscar opções para estes grupos
            $stmt = $db->prepare("SELECT * FROM addon_options WHERE group_id IN ($placeholders) AND is_available = 1 ORDER BY sort_order ASC");
            $stmt->execute($groupIds);
            $allOptions = $stmt->fetchAll();

            $optionsByGroup = [];
            foreach ($allOptions as $opt) {
                $optionsByGroup[$opt['group_id']][] = $opt;
            }

            foreach ($groups as &$g) {
                $g['options'] = $optionsByGroup[$g['id']] ?? [];
                $g['is_required'] = (bool)($g['is_required'] ?? false);
                $g['max_selections'] = (int)($g['max_selections'] ?? 1);
            }
        }

        respond($groups);
    }

    if ($id) {
        $stmt = $db->prepare('
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = ?
        ');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) respond_error('Produto não encontrado', 404);
        respond($product);
    }

    // Listar com filtros opcionais
    $where  = [];
    $params = [];

    if (isset($_GET['category_id'])) {
        $where[]  = 'p.category_id = ?';
        $params[] = $_GET['category_id'];
    }
    if (isset($_GET['is_available'])) {
        $where[]  = 'p.is_available = ?';
        $params[] = $_GET['is_available'] === 'true' ? 1 : 0;
    }
    if (isset($_GET['search'])) {
        $where[]  = 'p.name LIKE ?';
        $params[] = '%' . $_GET['search'] . '%';
    }

    $sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY p.name ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

// POST /products
if ($method === 'POST') {
    require_auth();
    $b = get_body();

    $required = ['name', 'price'];
    foreach ($required as $field) {
        if (!isset($b[$field]) || $b[$field] === '') {
            respond_error("Campo obrigatório: $field", 422);
        }
    }

    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));

    $db->prepare('
        INSERT INTO products (id, category_id, name, description, price, image_url, is_available, stock_type, unit, stock_quantity, min_stock, promo_price, is_promo_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ')->execute([
        $uuid,
        $b['category_id']    ?? null,
        $b['name'],
        $b['description']    ?? null,
        $b['price'],
        $b['image_url']      ?? null,
        isset($b['is_available']) ? (int)(bool)$b['is_available'] : 1,
        $b['stock_type']     ?? 'unit',
        $b['unit']           ?? 'un',
        $b['stock_quantity'] ?? 0,
        $b['min_stock']      ?? 0,
        $b['promo_price']    ?? null,
        isset($b['is_promo_active']) ? (int)(bool)$b['is_promo_active'] : 0,
    ]);

    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// PUT /products/{id}
if ($method === 'PUT' && $id && !$sub) {
    require_auth();
    $b = get_body();

    $fields = [];
    $params = [];
    $allowed = ['category_id','name','description','price','image_url','is_available','stock_type','unit','stock_quantity','min_stock', 'promo_price', 'is_promo_active'];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[] = "$f = ?";
            $params[] = ($f === 'is_available') ? (int)(bool)$b[$f] : $b[$f];
        }
    }

    if (!$fields) respond_error('Nenhum campo para atualizar', 422);

    $params[] = $id;
    $db->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// DELETE /products/{id}
if ($method === 'DELETE' && $id && !$sub) {
    require_auth();
    $db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    respond(['message' => 'Produto removido']);
}

// GET /products/{id}/ingredients
if ($method === 'GET' && $id && $sub === 'ingredients') {
    require_auth();
    $stmt = $db->prepare('
        SELECT pi.*, i.name as ingredient_name, i.unit as ingredient_unit
        FROM product_ingredients pi
        JOIN ingredients i ON i.id = pi.ingredient_id
        WHERE pi.product_id = ?
    ');
    $stmt->execute([$id]);
    respond($stmt->fetchAll());
}

// PUT /products/{id}/ingredients — Sincronizar composição
if ($method === 'PUT' && $id && $sub === 'ingredients') {
    require_auth();
    $b = get_body();
    $ingredients = $b['ingredients'] ?? null;
    
    if ($ingredients === null) respond_error('Campo ingredients é obrigatório', 422);

    $db->beginTransaction();
    try {
        // Remover atuais
        $db->prepare('DELETE FROM product_ingredients WHERE product_id = ?')->execute([$id]);

        // Inserir novos
        $stmt = $db->prepare('
            INSERT INTO product_ingredients (id, product_id, ingredient_id, quantity_used, unit)
            VALUES (?, ?, ?, ?, ?)
        ');

        foreach ($ingredients as $ing) {
            $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
            
            $stmt->execute([
                $uuid,
                $id,
                $ing['ingredient_id'],
                $ing['quantity_used'],
                $ing['unit'] ?? 'un'
            ]);
        }

        $db->commit();
        respond(['message' => 'Composição atualizada com sucesso']);
    } catch (Exception $e) {
        $db->rollBack();
        respond_error('Erro ao salvar composição: ' . $e->getMessage(), 500);
    }
}

respond_error('Método não permitido ou rota inválida', 405);
