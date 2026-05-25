<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');
require_once __DIR__ . '/auth.php';
session_destroy();
echo json_encode(['success' => true]);
?>