<?php
// ============================================================
// routes/caixa.php — Caixa: sessões e movimentações
// ============================================================
$db = getDB();

// Helper UUID
function caixa_uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
}

// GET /caixa — sessão aberta e movimentações
if ($method === 'GET') {
    require_auth();

    if ($sub === 'movimentacoes' && $id) {
        // GET /caixa/{session_id}/movimentacoes
        $stmt = $db->prepare('SELECT * FROM caixa_movimentacoes WHERE session_id = ? ORDER BY created_at ASC');
        $stmt->execute([$id]);
        respond($stmt->fetchAll());
    }

    if ($id) {
        // GET /caixa/{id}
        $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
        $stmt->execute([$id]);
        $session = $stmt->fetch();
        if (!$session) respond_error('Sessão não encontrada', 404);
        respond($session);
    }

    // Retorna a sessão aberta mais recente
    $stmt = $db->prepare("SELECT * FROM caixa_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1");
    $stmt->execute();
    $session = $stmt->fetch();
    respond($session ?: null);
}

// POST /caixa — abrir sessão ou registrar movimentação
if ($method === 'POST') {
    require_auth();
    $b = get_body();

    if ($sub === 'movimentacoes' && $id) {
        // POST /caixa/{session_id}/movimentacoes
        if (empty($b['type']) || !isset($b['amount'])) {
            respond_error('Campos obrigatórios: type, amount', 422);
        }
        $uuid = caixa_uuid();
        $db->prepare('INSERT INTO caixa_movimentacoes (id, session_id, type, amount, description) VALUES (?,?,?,?,?)')
           ->execute([$uuid, $id, $b['type'], $b['amount'], $b['description'] ?? null]);
        $stmt = $db->prepare('SELECT * FROM caixa_movimentacoes WHERE id = ?');
        $stmt->execute([$uuid]);
        respond($stmt->fetch(), 201);
    }

    // Abrir nova sessão
    $uuid = caixa_uuid();
    $db->prepare("INSERT INTO caixa_sessions (id, initial_balance, status, opened_at) VALUES (?,?,'open', NOW())")
       ->execute([$uuid, $b['initial_balance'] ?? 0]);
    $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
    $stmt->execute([$uuid]);
    respond($stmt->fetch(), 201);
}

// PUT /caixa/{id} — fechar sessão
if ($method === 'PUT' && $id) {
    require_auth();
    $b = get_body();
    $db->prepare("UPDATE caixa_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?")
       ->execute([$id]);
    $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

respond_error('Método não permitido', 405);
