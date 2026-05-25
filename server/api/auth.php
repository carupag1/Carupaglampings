<?php
session_save_path(__DIR__ . "/../sessions");
if (!is_dir(session_save_path())) mkdir(session_save_path(), 0777, true);
session_start();

function registerUser($email, $password, $rol) {
    $db = new SQLite3(__DIR__ . '/reservas.db');
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (email, password_hash, rol) VALUES (?, ?, ?)");
    $stmt->bindValue(1, $email);
    $stmt->bindValue(2, $hash);
    $stmt->bindValue(3, $rol);
    return $stmt->execute();
}

function authenticateUser($email, $password) {
    $db = new SQLite3(__DIR__ . '/reservas.db');
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->bindValue(1, $email);
    $result = $stmt->execute();
    $user = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($user && password_verify($password, $user['password_hash'])) {
        unset($user['password_hash']);
        return $user;
    }
    return false;
}

function getUserById($id) {
    $db = new SQLite3(__DIR__ . '/reservas.db');
    $stmt = $db->prepare("SELECT id, email, rol FROM users WHERE id = ?");
    $stmt->bindValue(1, $id);
    $result = $stmt->execute();
    return $result->fetchArray(SQLITE3_ASSOC);
}
?>