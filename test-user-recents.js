import { getUserRecents, addUserRecent, createCharacterRecent } from './src/lib/db/recents.js';
import { getUserById } from './src/lib/db/users.js';

// Simple test script to verify user_recents functionality
async function testUserRecents() {
	try {
		// Replace this with an actual user ID from your database
		// You can get this from visiting /api/user-db-test while logged in
		const userId = 'test-user-id'; // Replace with real user ID
		
		console.log('Testing user_recents functionality...');
		
		// Test 1: Check if user exists
		console.log('1. Checking if user exists...');
		const user = await getUserById(userId);
		if (!user) {
			console.log('❌ User not found. Please login first and get your user ID from /api/user-db-test');
			return;
		}
		console.log('✅ User found:', user.battletag);
		
		// Test 2: Get existing recents
		console.log('2. Getting existing recents...');
		const existingRecents = await getUserRecents(userId);
		console.log(`✅ Found ${existingRecents.length} existing recents`);
		
		// Test 3: Add a test recent
		console.log('3. Adding test recent...');
		const testRecent = createCharacterRecent(
			'TestPaladin',
			'TestRealm',
			'us',
			{ class: 'Paladin', level: 80, spec: 'Holy' }
		);
		await addUserRecent(userId, testRecent);
		console.log('✅ Test recent added successfully');
		
		// Test 4: Verify the recent was added
		console.log('4. Verifying recent was added...');
		const newRecents = await getUserRecents(userId);
		console.log(`✅ Now have ${newRecents.length} recents total`);
		
		if (newRecents.length > existingRecents.length) {
			console.log('🎉 user_recents is working correctly!');
			console.log('Latest recent:', newRecents[0]);
		}
		
	} catch (error) {
		console.error('❌ Test failed:', error);
		console.error('Error details:', error.message);
	}
}

// Uncomment and run this if you want to test manually
// testUserRecents();

console.log('To test user_recents:');
console.log('1. Login to your app first');  
console.log('2. Visit /api/user-db-test to see your user data and test recents');
console.log('3. Or uncomment testUserRecents() above and run: node test-user-recents.js');