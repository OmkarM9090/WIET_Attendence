/**
 * TEST FILE FOR DATE VALIDATOR
 * Run this to test the date validation logic
 */

import {
  validateAttendanceDate,
  getAllowedDateRange,
  isToday,
  isYesterday
} from "./src/utils/dateValidator.js";

console.log("=".repeat(60));
console.log("TESTING DATE VALIDATOR UTILITY");
console.log("=".repeat(60));

// Get allowed date range
const range = getAllowedDateRange();
console.log("\n📅 Allowed Date Range:");
console.log("  Yesterday:", range.yesterday);
console.log("  Today:", range.today);

// Test 1: Today's date (should pass)
console.log("\n✅ Test 1: Today's date");
try {
  const result = validateAttendanceDate(new Date());
  console.log("  Result:", result ? "VALID ✓" : "INVALID ✗");
} catch (error) {
  console.log("  Error:", error.message);
}

// Test 2: Yesterday's date (should pass)
console.log("\n✅ Test 2: Yesterday's date");
try {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const result = validateAttendanceDate(yesterday);
  console.log("  Result:", result ? "VALID ✓" : "INVALID ✗");
} catch (error) {
  console.log("  Error:", error.message);
}

// Test 3: Tomorrow's date (should fail)
console.log("\n❌ Test 3: Tomorrow's date (should fail)");
try {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const result = validateAttendanceDate(tomorrow);
  console.log("  Result:", result ? "VALID ✓" : "INVALID ✗");
} catch (error) {
  console.log("  Error:", error.message);
}

// Test 4: 2 days ago (should fail)
console.log("\n❌ Test 4: 2 days ago (should fail)");
try {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const result = validateAttendanceDate(twoDaysAgo);
  console.log("  Result:", result ? "VALID ✓" : "INVALID ✗");
} catch (error) {
  console.log("  Error:", error.message);
}

// Test 5: isToday function
console.log("\n🔍 Test 5: isToday() function");
console.log("  Today:", isToday(new Date()));
const yesterday2 = new Date();
yesterday2.setDate(yesterday2.getDate() - 1);
console.log("  Yesterday:", isToday(yesterday2));

// Test 6: isYesterday function
console.log("\n🔍 Test 6: isYesterday() function");
console.log("  Today:", isYesterday(new Date()));
console.log("  Yesterday:", isYesterday(yesterday2));

console.log("\n" + "=".repeat(60));
console.log("TESTS COMPLETED");
console.log("=".repeat(60) + "\n");
