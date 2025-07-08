import { getDataConnect } from '@firebase/data-connect';

async function main() {
  // Commented out for build - requires Firebase Data Connect configuration
  // const dc = getDataConnect();

  // Query all users
  // const users = await dc.query('SELECT * FROM User');
  // console.log('All users:', users);

  // Insert a new user
  const newUser = {
    email: 'testuser@example.com',
    phoneNumber: '+1234567890',
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
    displayName: 'Test User',
    photoUrl: '',
    role: 'user',
  };
  // const insertResult = await dc.query(
  //   `INSERT INTO User (email, phoneNumber, passwordHash, createdAt, displayName, photoUrl, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  //   [
  //     newUser.email,
  //     newUser.phoneNumber,
  //     newUser.passwordHash,
  //     newUser.createdAt,
  //     newUser.displayName,
  //     newUser.photoUrl,
  //     newUser.role,
  //   ]
  // );
  // console.log('Inserted user:', insertResult);
}

// main().catch(console.error); 