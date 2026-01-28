#!/usr/bin/env node

/**
 * DIAGNOSTIC TEST
 * Check if backend is running correctly
 * Run with: node test-backend.js
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000';
const TEST_EMAIL = 'teacher@example.com'; // Change if needed
const TEST_PASSWORD = 'password123'; // Change if needed

console.log('\n========== BACKEND DIAGNOSTIC TEST ==========\n');

let token = null;

async function test(name, fn) {
  try {
    console.log(`\n✓ Testing: ${name}`);
    await fn();
  } catch (error) {
    console.error(`✗ FAILED: ${name}`);
    if (error.response?.data) {
      console.error('  Error:', error.response.data);
    } else {
      console.error('  Error:', error.message);
    }
  }
}

async function runTests() {
  // Test 1: Health Check
  await test('Health Check - Server Running?', async () => {
    const res = await axios.get(`${API_URL}/health`);
    console.log('  Response:', res.data.message);
  });

  // Test 2: Login
  await test('Login - Can authenticate?', async () => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    token = res.data.data.token;
    console.log(`  ✓ Login successful`);
    console.log(`  Token: ${token.substring(0, 20)}...`);
    console.log(`  Role: ${res.data.data.role}`);
    console.log(`  Name: ${res.data.data.name}`);
  });

  // Test 3: Decode Token
  if (token) {
    await test('Decode Token - Check contents', async () => {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString()
        );
        console.log('  Token Contents:');
        console.log(`    - id: ${payload.id}`);
        console.log(`    - role: ${payload.role}`);
        console.log(`    - exp: ${new Date(payload.exp * 1000).toLocaleString()}`);
      }
    });
  }

  // Test 4: Get Teacher Profile
  if (token) {
    await test('Get Teacher Profile - Fetch /api/teacher/me', async () => {
      const res = await axios.get(`${API_URL}/api/teacher/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('  ✓ Teacher found!');
      console.log(`  - ID: ${res.data.data._id}`);
      console.log(`  - User: ${res.data.data.userId?.name || 'N/A'}`);
    });
  }

  // Test 5: Invalid Route
  await test('Invalid Route - Should return JSON 404', async () => {
    try {
      await axios.get(`${API_URL}/api/invalid-route`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('  ✓ Returns JSON error (not HTML)');
        console.log(`  Message: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
  });

  console.log('\n========== TEST COMPLETE ==========\n');
}

runTests();
