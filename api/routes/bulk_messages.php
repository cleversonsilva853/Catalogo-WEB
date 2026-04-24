<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function handleBulkMessages($db, $method) {
    if ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM bulk_messages ORDER BY scheduled_at DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['message']) || empty($data['scheduled_at'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Mensagem e data são obrigatórios']);
            return;
        }

        $stmt = $db->prepare("INSERT INTO bulk_messages (scheduled_at, media_url, message, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([
            $data['scheduled_at'],
            $data['media_url'] ?? null,
            $data['message']
        ]);

        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            return;
        }

        $stmt = $db->prepare("DELETE FROM bulk_messages WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}

try {
    handleBulkMessages($db, $method);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
