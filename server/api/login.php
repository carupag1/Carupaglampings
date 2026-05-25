<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');
require_once __DIR__ . '/auth.php';

// Log raw input for debugging
$rawInput = file_get_contents('php://input');
error_log("Raw login input: " . $rawInput);

// Fallback for cases where input might not be in php://input but passed via stdin
if (empty($rawInput)) {
    $rawInput = stream_get_contents(STDIN);
    error_log("Raw login input from STDIN: " . $rawInput);
}

$input = json_decode($rawInput, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    error_log("Attempting login for email: " . $email);
    
    $user = authenticateUser($email, $password);
    
    if ($user) {
        error_log("Login successful for: " . $email);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['rol'] = $user['rol'];
        
        echo json_encode([
            'success' => true, 
            'user' => $user
        ]);
    } else {
        error_log("Login failed for: " . $email);
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
    }
} else {
    echo json_encode(['error' => 'Método no permitido']);
}
?>