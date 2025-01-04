#!/bin/bash

# Login
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=shubham21354@iiitd.ac.in" \
  -d "password=agentbinod" \
  | jq -r .access_token)

echo "Token: $TOKEN"

# Test /me endpoint
echo -e "\nTesting /me endpoint..."
curl -s http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test chat endpoint
echo -e "\nTesting chat endpoint..."
curl -s -X POST http://localhost:8000/api/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello", "mode": "research"}' | jq . 