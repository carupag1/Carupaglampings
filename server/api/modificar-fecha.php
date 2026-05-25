<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');
require_once __DIR__ . '/require-admin.php';

$input = json_decode(file_get_contents('php://input'), true);
$referencia = $input['referencia'] ?? '';
$nueva_fecha_inicio = $input['fecha_inicio'] ?? '';
$nueva_fecha_fin = $input['fecha_fin'] ?? '';

if (!$referencia || !$nueva_fecha_inicio || !$nueva_fecha_fin) {
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$db = new SQLite3(__DIR__ . '/reservas.db');
$stmt = $db->prepare("UPDATE reservas SET fecha_inicio = ?, fecha_fin = ? WHERE referencia = ? AND estado IN (1, 2)");
$stmt->bindValue(1, $nueva_fecha_inicio);
$stmt->bindValue(2, $nueva_fecha_fin);
$stmt->bindValue(3, $referencia);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'No se pudo actualizar la fecha']);
}
?>