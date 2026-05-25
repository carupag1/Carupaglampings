<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');
require_once __DIR__ . '/require-admin.php';

$db = new SQLite3(__DIR__ . '/reservas.db');
$result = $db->query("SELECT * FROM reservas ORDER BY created_at DESC");

$reservas = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    // Ensure adicionales is parsed if it's a string
    if (isset($row['adicionales']) && is_string($row['adicionales'])) {
        $row['adicionales'] = json_decode($row['adicionales'], true);
    }
    $reservas[] = $row;
}

echo json_encode($reservas);
?>