<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

// Handle CLI testing or actual web requests
if (php_sapi_name() === 'cli') {
    $method = 'POST';
    $input = file_get_contents('php://stdin');
} else {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = file_get_contents('php://input');
}

if ($method !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$db = new SQLite3(__DIR__ . '/reservas.db');

$total = $data['total'];
$abono = $data['abono'] ?? ($total * 0.5);
$saldo = $data['saldo'] ?? ($total - $abono);
$estado = 1; // PENDIENTE

// Generate reference: AURA-YYYYMMDD-XXXX
$prefix = strtoupper(explode(' ', $data['unidad'])[0]);
$referencia = $prefix . '-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 4));

$stmt = $db->prepare("INSERT INTO reservas (
    plan, camping, unidad, fecha_inicio, fecha_fin, adicionales, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->bindValue(1, $data['plan']);
$stmt->bindValue(2, $data['camping']);
$stmt->bindValue(3, $data['unidad']);
$stmt->bindValue(4, $data['fecha_inicio']);
$stmt->bindValue(5, $data['fecha_fin']);
$stmt->bindValue(6, json_encode($data['adicionales']));
$stmt->bindValue(7, $total);
$stmt->bindValue(8, $abono);
$stmt->bindValue(9, $saldo);
$stmt->bindValue(10, $data['nombre']);
$stmt->bindValue(11, $data['telefono']);
$stmt->bindValue(12, $data['email']);
$stmt->bindValue(13, $estado);
$stmt->bindValue(14, $referencia);
$stmt->bindValue(15, date('Y-m-d H:i:s'));

$result = $stmt->execute();

if ($result) {
    echo json_encode([
        'success' => true,
        'referencia' => $referencia,
        'abono' => $abono,
        'saldo' => $saldo
    ]);
} else {
    echo json_encode(['error' => 'Failed to create reservation']);
}
?>