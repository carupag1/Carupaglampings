<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');
require_once __DIR__ . '/auth.php';

echo json_encode([
    'logged_in' => isset($_SESSION['user_id']),
    'user' => isset($_SESSION['user_id']) ? [
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['email'],
        'rol' => $_SESSION['rol']
    ] : null
]);
?>