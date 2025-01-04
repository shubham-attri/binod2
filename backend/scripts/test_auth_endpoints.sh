#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="http://localhost:8000/api/v1/auth"

echo "Testing auth endpoints..."

# 1. Login and get token
echo -e "\n${GREEN}1. Testing login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=shubham21354@iiitd.ac.in" \
  -d "password=agentbinod")

echo "Login response:"
echo $LOGIN_RESPONSE | jq .

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r .access_token)

# 2. Get user info
echo -e "\n${GREEN}2. Testing /me endpoint${NC}"
ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/me")
echo "User info:"
echo $ME_RESPONSE | jq .

# 3. Check server time
echo -e "\n${GREEN}3. Testing /time endpoint${NC}"
TIME_RESPONSE=$(curl -s "$BASE_URL/time")
echo "Server time:"
echo $TIME_RESPONSE | jq .

# 4. Refresh token
echo -e "\n${GREEN}4. Testing token refresh${NC}"
REFRESH_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/refresh")
echo "Refresh response:"
echo $REFRESH_RESPONSE | jq .

# Extract new token
NEW_TOKEN=$(echo $REFRESH_RESPONSE | jq -r .access_token)

# 5. Verify new token works
echo -e "\n${GREEN}5. Testing new token${NC}"
NEW_ME_RESPONSE=$(curl -s -H "Authorization: Bearer $NEW_TOKEN" "$BASE_URL/me")
echo "User info with new token:"
echo $NEW_ME_RESPONSE | jq . 