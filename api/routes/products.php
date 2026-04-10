<?php
// ============================================================
// routes/products.php — CRUD de produtos
// ============================================================

$db = getDB();

// GET /products ou GET /products/{id}
if ($method === 'GET') {
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
        INSERT INTO products (id, category_id, name, description, price, image_url, is_available, stock_type, unit, stock_quantity, min_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ]);

    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// PUT /products/{id}
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();

    $fields = [];
    $params = [];
    $allowed = ['category_id','name','description','price','image_url','is_available','stock_type','unit','stock_quantity','min_stock'];

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
if ($method === 'DELETE' && $id) {
    require_auth();
    $db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    respond(['message' => 'Produto removido']);
}

respond_error('Método não permitido', 405);
