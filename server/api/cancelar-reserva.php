<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');
require_once __DIR__ . '/require-admin.php';

$input = json_decode(file_get_contents('php://input'), true);
$referencia = $input['referencia'] ?? '';

if (!$referencia) {
    echo json_encode(['error' => 'Referencia requerida']);
    exit;
}

$db = new SQLite3(__DIR__ . '/reservas.db');
$stmt = $db->prepare("UPDATE reservas SET estado = 3 WHERE referencia = ? AND estado IN (1, 2)");
$stmt->bindValue(1, $referencia);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'No se pudo cancelar la reserva']);
}
?>