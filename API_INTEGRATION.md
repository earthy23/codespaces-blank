# UEC Server List API Integration Guide

The UEC Server List provides a public API for external integrations, allowing developers to display server information in their own applications, websites, or tools.

## Public API Endpoints

### Base URL
```
https://your-domain.com/api/public
```

All public API endpoints are **CORS-enabled** and require **no authentication**.

## Endpoints

### 1. Get All Servers
```http
GET /api/public/servers
```

Retrieve a list of all public servers with optional filtering and sorting.

**Query Parameters:**
- `limit` (number, optional): Maximum number of servers to return
- `category` (string, optional): Filter by category (`survival`, `creative`, `pvp`, `minigames`, `roleplay`, `modded`)
- `sort` (string, optional): Sort by `likes`, `name`, `newest`, or `players` (default: `likes`)
- `status` (string, optional): Filter by `online` or `offline`

**Example:**
```bash
curl "https://your-domain.com/api/public/servers?limit=10&category=survival&sort=players&status=online"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "server-1234567890-abcdefghi",
        "name": "Epic Survival Server",
        "description": "The best survival experience with custom features!",
        "ip": "play.epicserver.com",
        "port": 25565,
        "category": "survival",
        "version": "1.8.8",
        "isOnline": true,
        "playerCount": 45,
        "maxPlayers": 100,
        "likes": 127,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "lastChecked": "2024-01-15T15:45:00.000Z",
        "features": ["Economy", "PvP", "Custom Items"],
        "banner": "https://your-domain.com/api/servers/banners/banner-123456.jpg",
        "ownerName": "ServerOwner123"
      }
    ],
    "total": 1,
    "filters": {
      "category": "survival",
      "status": "online",
      "sort": "players",
      "limit": 10
    }
  },
  "meta": {
    "endpoint": "public/servers",
    "version": "1.0",
    "documentation": "https://your-domain.com/api/public/docs"
  }
}
```

### 2. Get Server by ID
```http
GET /api/public/servers/{id}
```

Get detailed information about a specific server.

**Example:**
```bash
curl "https://your-domain.com/api/public/servers/server-1234567890-abcdefghi"
```

### 3. Get Categories
```http
GET /api/public/categories
```

Get available server categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "survival",
        "name": "Survival",
        "description": "Classic Minecraft survival mode"
      },
      {
        "id": "creative",
        "name": "Creative", 
        "description": "Creative building mode"
      }
    ]
  }
}
```

### 4. Get Statistics
```http
GET /api/public/stats
```

Get general statistics about the server list.

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalServers": 156,
      "onlineServers": 98,
      "offlineServers": 58,
      "totalPlayers": 2347,
      "totalLikes": 5672,
      "categories": {
        "survival": 45,
        "creative": 23,
        "pvp": 34,
        "minigames": 28,
        "roleplay": 15,
        "modded": 11
      }
    },
    "lastUpdated": "2024-01-15T15:45:00.000Z"
  }
}
```

### 5. API Documentation
```http
GET /api/public/docs
```

Get comprehensive API documentation with examples.

## Usage Examples

### JavaScript/TypeScript
```javascript
// Fetch all online survival servers
async function getOnlineSurvivalServers() {
  try {
    const response = await fetch('https://your-domain.com/api/public/servers?category=survival&status=online');
    const data = await response.json();
    
    if (data.success) {
      return data.data.servers;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    return [];
  }
}

// Get server statistics
async function getServerStats() {
  const response = await fetch('https://your-domain.com/api/public/stats');
  const data = await response.json();
  return data.data.statistics;
}
```

### Python
```python
import requests

def get_servers(category=None, status=None, limit=None):
    """Fetch servers from UEC API"""
    url = "https://your-domain.com/api/public/servers"
    params = {}
    
    if category:
        params['category'] = category
    if status:
        params['status'] = status  
    if limit:
        params['limit'] = limit
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['success']:
        return data['data']['servers']
    else:
        raise Exception(data['error'])

# Example usage
online_servers = get_servers(status='online', limit=20)
for server in online_servers:
    print(f"{server['name']} - {server['playerCount']}/{server['maxPlayers']} players")
```

### PHP
```php
<?php
function getServers($category = null, $status = null, $limit = null) {
    $url = 'https://your-domain.com/api/public/servers';
    $params = [];
    
    if ($category) $params['category'] = $category;
    if ($status) $params['status'] = $status;
    if ($limit) $params['limit'] = $limit;
    
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }
    
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    if ($data['success']) {
        return $data['data']['servers'];
    } else {
        throw new Exception($data['error']);
    }
}

// Example usage
$servers = getServers('pvp', 'online', 10);
foreach ($servers as $server) {
    echo $server['name'] . " - " . $server['ip'] . "\n";
}
?>
```

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": object,
  "error": string (only present when success is false),
  "message": string (optional),
  "meta": {
    "endpoint": string,
    "version": string,
    "documentation": string
  }
}
```

## Rate Limiting

Currently, there are no rate limits on public API endpoints, but this may change in the future. Please be respectful and don't abuse the API.

## CORS Support

All public endpoints support CORS and can be called from web browsers without restrictions.

## Data Freshness

- Server statuses are updated automatically every 15 minutes
- Player counts are simulated for demonstration purposes
- Server information is updated when owners modify their server details

## Integration Ideas

- **Discord Bots**: Display server lists and player counts
- **Websites**: Show featured servers or server directories
- **Mobile Apps**: Create server browsers and monitoring tools
- **Analytics Tools**: Track server popularity and growth
- **Server Monitors**: Monitor server uptime and player activity

## Support

For API support or questions about integrations:
- Check the full documentation at `/api/public/docs`
- Review the server list at your UEC instance
- Contact the UEC team for technical assistance

## Changelog

### Version 1.0
- Initial public API release
- Basic server listing and filtering
- Statistics endpoint
- Documentation endpoint
- CORS support for all endpoints
