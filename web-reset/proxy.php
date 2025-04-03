<?php
// Allow from any origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Get the URL from the query parameter
$url = isset($_GET['url']) ? $_GET['url'] : null;

if (!$url) {
    header("HTTP/1.1 400 Bad Request");
    echo json_encode(['error' => 'Missing URL parameter']);
    exit;
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    header("HTTP/1.1 400 Bad Request");
    echo json_encode(['error' => 'Invalid URL format']);
    exit;
}

// Only allow certain domains for security
$allowedDomains = [
    'captive.apple.com',
    'kpsfqfntcfxejipieres.supabase.co',
    'supabase.co',
    'cdn.jsdelivr.net'
];

$parsedUrl = parse_url($url);
$domain = isset($parsedUrl['host']) ? $parsedUrl['host'] : '';

$isAllowed = false;
foreach ($allowedDomains as $allowedDomain) {
    if (strpos($domain, $allowedDomain) !== false) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
    header("HTTP/1.1 403 Forbidden");
    echo json_encode(['error' => 'Domain not allowed']);
    exit;
}

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Get the original request headers and forward them
$headers = getallheaders();
$curlHeaders = [];
foreach ($headers as $key => $value) {
    if (strtolower($key) !== 'host' && strtolower($key) !== 'content-length') {
        $curlHeaders[] = "$key: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);

// Forward the request method
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Forward POST data if present
if ($method === 'POST') {
    $postData = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
}

// Execute the request
$response = curl_exec($ch);
$info = curl_getinfo($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode(['error' => $error]);
    exit;
}

// Forward the status code
http_response_code($info['http_code']);

// Forward the content type header
if (isset($info['content_type'])) {
    header("Content-Type: " . $info['content_type']);
}

// Send the response
echo $response;
?> 