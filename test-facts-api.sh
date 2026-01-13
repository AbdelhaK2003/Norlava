#!/bin/bash
# Integration test for Visitor Fact Approval System

echo "🧪 Testing Visitor Fact Approval System"
echo "========================================"

# Assuming backend is running on localhost:3000

# Test 1: Login/get token (you need valid credentials)
echo ""
echo "Test 1: Fetching statistics (requires authenticated user)"
curl -X GET http://localhost:3000/api/facts/statistics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 2: Get pending facts
echo ""
echo "Test 2: Fetching pending facts"
curl -X GET http://localhost:3000/api/facts/pending-facts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 3: Approve a fact (factIndex 0)
echo ""
echo "Test 3: Approving first pending fact"
curl -X POST http://localhost:3000/api/facts/approve-fact \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"factIndex": 0}' \
  -w "\nStatus: %{http_code}\n"

# Test 4: Reject a fact (factIndex 1)
echo ""
echo "Test 4: Rejecting a pending fact"
curl -X POST http://localhost:3000/api/facts/reject-fact \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"factIndex": 0}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "✅ Tests complete! Replace YOUR_TOKEN_HERE with actual JWT token from login"
