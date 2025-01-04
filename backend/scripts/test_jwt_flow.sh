#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:8000/api/v1"

# Function to format date for both Linux and macOS
format_date() {
    local timestamp=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        date -j -f "%s" "$timestamp" "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null
    else
        # Linux
        date -u -d "@$timestamp" "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null
    fi
}

# Function to decode JWT with detailed info
decode_jwt() {
    local token=$1
    
    # Split token parts with proper padding
    local header=$(echo -n $token | cut -d"." -f1 | tr '_-' '/+' | base64 -d 2>/dev/null)
    local payload_raw=$(echo -n $token | cut -d"." -f2)
    # Add padding if needed
    local pad=$(( 4 - ( ${#payload_raw} % 4 ) ))
    if [ $pad -ne 4 ]; then
        payload_raw="$payload_raw$(printf '=%.0s' $(seq 1 $pad))"
    fi
    local payload=$(echo -n $payload_raw | tr '_-' '/+' | base64 -d 2>/dev/null)
    
    echo -e "\n${YELLOW}Token Analysis:${NC}"
    echo -e "Header: $header"
    echo -e "Payload: $payload"
    
    # Extract claims with proper JSON parsing
    local exp=$(echo $payload | jq -r '.exp // empty')
    local sub=$(echo $payload | jq -r '.sub // empty')
    local email=$(echo $payload | jq -r '.email // empty')
    
    echo -e "\n${YELLOW}Claims Analysis:${NC}"
    echo "Subject: $sub"
    echo "Email: $email"
    echo "Expiration: $(format_date $exp)"
    
    # Time calculations
    local current_time=$(date +%s)
    local time_left=$((exp - current_time))
    
    echo -e "\n${YELLOW}Time Analysis:${NC}"
    echo "Current Time: $(format_date $current_time)"
    echo "Time Left: $time_left seconds"
    
    # Validation checks
    echo -e "\n${YELLOW}Validation Checks:${NC}"
    if [ $time_left -lt 0 ]; then
        echo -e "${RED}❌ Token has expired${NC}"
    else
        echo -e "${GREEN}✓ Token is valid for $time_left seconds${NC}"
    fi
}

# Function to test endpoint with token
test_endpoint() {
    local endpoint=$1
    local token=$2
    local method=${3:-GET}
    local data=$4
    
    echo -e "\n${YELLOW}Testing $method $endpoint${NC}"
    
    if [ "$method" = "POST" ] && [ ! -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "Status: $status"
    echo -e "Response: $body"
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}Success!${NC}"
    elif [ "$status" -eq 401 ]; then
        echo -e "${RED}Unauthorized - Token might be expired${NC}"
        return 1
    else
        echo -e "${RED}Failed with status $status${NC}"
        return 1
    fi
}

# Step 1: Login and get token
echo -e "\n${YELLOW}Step 1: Login${NC}"
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=shubham21354@iiitd.ac.in" \
    -d "password=agentbinod")

TOKEN=$(echo $login_response | jq -r .access_token)
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Failed to get token${NC}"
    exit 1
fi

# Step 2: Decode and analyze token
decode_jwt "$TOKEN"

# Step 3: Test protected endpoint
test_endpoint "/auth/me" "$TOKEN"

# Step 4: Test token refresh
echo -e "\n${YELLOW}Step 4: Testing token refresh${NC}"
refresh_response=$(curl -s -X POST "$BASE_URL/auth/refresh" \
    -H "Authorization: Bearer $TOKEN")

NEW_TOKEN=$(echo $refresh_response | jq -r .access_token)
if [ ! -z "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
    echo -e "${GREEN}Token refresh successful!${NC}"
    decode_jwt "$NEW_TOKEN"
    
    # Test with new token
    test_endpoint "/auth/me" "$NEW_TOKEN"
else
    echo -e "${RED}Token refresh failed${NC}"
fi

# Step 5: Simulate expired token scenario
echo -e "\n${YELLOW}Step 5: Testing with manipulated expiration${NC}"
EXPIRED_TOKEN=$(echo $TOKEN | awk -F'.' '{print $1 "." "'$(echo '{"exp": 1577836800}' | base64)'" "." $3}')
test_endpoint "/auth/me" "$EXPIRED_TOKEN"

# Summary
echo -e "\n${YELLOW}Test Summary:${NC}"
echo "1. Initial token acquisition"
echo "2. Token validation and decoding"
echo "3. Protected endpoint access"
echo "4. Token refresh mechanism"
echo "5. Expired token handling" 