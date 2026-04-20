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

    if ($id === 'active') {
        $stmt = $db->prepare("SELECT * FROM caixa_sessions WHERE status = 'open' AND DATE(opened_at) = CURDATE() ORDER BY opened_at DESC LIMIT 1");
        $stmt->execute();
        $session = $stmt->fetch();
        respond($session ?: null);
    }

    if ($id === 'balance') {
        $sessionId = $_GET['session_id'] ?? null;
        if (!$sessionId) respond(['initial' => 0, 'entradas' => 0, 'saidas' => 0, 'current' => 0]);

        $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();
        if (!$session) respond(['initial' => 0, 'entradas' => 0, 'saidas' => 0, 'current' => 0]);

        $stmtM = $db->prepare('SELECT type, amount FROM caixa_movimentacoes WHERE session_id = ?');
        $stmtM->execute([$sessionId]);
        $movs = $stmtM->fetchAll();

        $entradas = 0;
        $saidas = 0;
        foreach ($movs as $m) {
            if ($m['type'] === 'entrada') $entradas += $m['amount'];
            else $saidas += $m['amount']; // sangria or saida
        }

        respond([
            'initial' => (float)$session['initial_balance'],
            'entradas' => $entradas,
            'saidas' => $saidas,
            'current' => (float)$session['initial_balance'] + $entradas - $saidas
        ]);
    }

    if ($id === 'movimentacoes') {
        $sessionId = $_GET['session_id'] ?? null;
        $stmt = $db->prepare('SELECT * FROM caixa_movimentacoes WHERE session_id = ? ORDER BY created_at ASC');
        $stmt->execute([$sessionId]);
        respond($stmt->fetchAll());
    }

    if ($id) {
        $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
        $stmt->execute([$id]);
        $session = $stmt->fetch();
        if (!$session) respond_error('Sessão não encontrada', 404);
        respond($session);
    }

    // Retorna todas as sessões se não houver ID
    $stmt = $db->prepare("SELECT * FROM caixa_sessions ORDER BY opened_at DESC");
    $stmt->execute();
    respond($stmt->fetchAll());
}

// POST /caixa — abrir sessão ou registrar movimentação
if ($method === 'POST') {
    require_auth();
    $b = get_body();

    if ($id === 'movimentacoes') {
        if (empty($b['type']) || !isset($b['amount']) || empty($b['session_id'])) {
            respond_error('Campos obrigatórios: session_id, type, amount', 422);
        }
        $uuid = caixa_uuid();
        $db->prepare('INSERT INTO caixa_movimentacoes (id, session_id, type, amount, description) VALUES (?,?,?,?,?)')
           ->execute([$uuid, $b['session_id'], $b['type'], $b['amount'], $b['description'] ?? null]);
        $stmt = $db->prepare('SELECT * FROM caixa_movimentacoes WHERE id = ?');
        $stmt->execute([$uuid]);
        respond($stmt->fetch(), 201);
    }

    if ($id === 'open') {
        // Encerra qualquer caixa que tenha ficado aberto (segurança para novos dias)
        $db->prepare("UPDATE caixa_sessions SET status = 'closed', closed_at = NOW() WHERE status = 'open'")
           ->execute();

        $uuid = caixa_uuid();
        $openedAt = !empty($b['opened_at']) ? $b['opened_at'] . ' ' . date('H:i:s') : date('Y-m-d H:i:s');
        
        $db->prepare("INSERT INTO caixa_sessions (id, initial_balance, status, opened_at) VALUES (?,?,'open', ?)")
           ->execute([$uuid, $b['initial_balance'] ?? 0, $openedAt]);
        $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
        $stmt->execute([$uuid]);
        respond($stmt->fetch(), 201);
    }

    if ($id === 'close') {
        $sessionId = $b['session_id'] ?? null;
        if (!$sessionId) respond_error('session_id obrigatório', 422);

        $db->prepare("UPDATE caixa_sessions SET status = 'closed', closed_at = NOW() WHERE id = ?")
           ->execute([$sessionId]);
        $stmt = $db->prepare('SELECT * FROM caixa_sessions WHERE id = ?');
        $stmt->execute([$sessionId]);
        respond($stmt->fetch());
    }

    respond_error('Ação não reconhecida (use open, close ou movimentacoes)', 404);
}

respond_error('Método não permitido', 405);
