#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Function to decode JWT payload
decode_jwt() {
    local token=$1
    # Add padding to base64 string if needed
    local payload=$(echo -n $token | cut -d"." -f2 | tr '_-' '/+' | base64 -d -w0 2>/dev/null || echo -n $token | cut -d"." -f2 | tr '_-' '/+' | base64 -D 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Pretty print JSON with proper escaping
        echo $payload | python3 -m json.tool 2>/dev/null || echo "Failed to parse JSON"
    else
        echo "Failed to decode base64"
    fi
}

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local token=$2
    echo -e "\nTesting ${endpoint}..."
    
    response=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/v1${endpoint} \
      -H "Authorization: Bearer ${token}")
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}Success!${NC}"
        echo "$body" | jq .
    else
        echo -e "${RED}Failed with status $status${NC}"
        echo "$body"
    fi
}

# Function to print JWT info
print_token_info() {
    local token=$1
    local label=$2
    
    echo -e "\n${label} Token Details:"
    echo -e "Token: ${token:0:50}..."
    echo -e "\nPayload:"
    decode_jwt "$token"
}

# Login and get token
echo "Getting new token..."
login_response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=shubham21354@iiitd.ac.in" \
  -d "password=agentbinod")

TOKEN=$(echo $login_response | jq -r .access_token)
EXPIRES_IN=$(echo $login_response | jq -r .expires_in)

echo -e "\n${GREEN}Login successful!${NC}"
echo "Token expires in: $EXPIRES_IN seconds"

# Print initial token info
print_token_info "$TOKEN" "Initial"

# Test endpoints
test_endpoint "/auth/me" "$TOKEN"

# Try to refresh token
echo -e "\nTrying to refresh token..."
refresh_response=$(curl -s -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Authorization: Bearer $TOKEN")

# Check if refresh was successful
if echo "$refresh_response" | jq -e .access_token > /dev/null; then
    echo -e "${GREEN}Token refresh successful!${NC}"
    NEW_TOKEN=$(echo $refresh_response | jq -r .access_token)
    
    # Print refreshed token info
    print_token_info "$NEW_TOKEN" "Refreshed"
    
    echo -e "\nTesting with new token:"
    test_endpoint "/auth/me" "$NEW_TOKEN"
else
    echo -e "${RED}Token refresh failed:${NC}"
    echo "$refresh_response" | jq .
fi 