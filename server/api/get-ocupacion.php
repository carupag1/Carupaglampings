<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

$db = new SQLite3(__DIR__ . '/reservas.db');

$unidadId = isset($_GET['unidadId']) ? (int)$_GET['unidadId'] : 0;

if ($unidadId > 0) {
    // Solo mostramos reservas que están confirmadas (estado 2)
    $stmt = $db->prepare("SELECT fecha_inicio, fecha_fin FROM reservas WHERE unidad = (SELECT name FROM campings WHERE id = ?) AND estado = 2");
    $stmt->bindValue(1, $unidadId);
    $result = $stmt->execute();
} else {
    // Si no hay unidadId, devolvemos todas las reservas confirmadas para bloqueo global si fuera necesario
    $result = $db->query("SELECT fecha_inicio, fecha_fin, unidad FROM reservas WHERE estado = 2");
}

$ocupacion = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $ocupacion[] = $row;
}

echo json_encode($ocupacion);
?>