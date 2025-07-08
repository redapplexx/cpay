import { getDataConnect } from '@firebase/data-connect';

// TypeScript type for User (optional, for type safety)
export interface User {
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  createdAt: Date;
  displayName?: string;
  photoUrl?: string;
  role?: string;
}

async function main() {
  // Commented out for build - requires Firebase Data Connect configuration
  // const dc = getDataConnect();

  // 1. Query all users
  // const users: User[] = await dc.query('SELECT * FROM User');
  // console.log('All users:', users);

  // 2. Insert a new user
  const newUser: User = {
    email: 'advanceduser@example.com',
    phoneNumber: '+1987654321',
    passwordHash: 'anotherhash',
    createdAt: new Date(),
    displayName: 'Advanced User',
    photoUrl: '',
    role: 'admin',
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

  // 3. Update a user
  // const updateResult = await dc.query(
  //   `UPDATE User SET displayName = ? WHERE email = ?`,
  //   ['Updated Name', newUser.email]
  // );
  // console.log('Updated user:', updateResult);

  // 4. Delete a user
  // const deleteResult = await dc.query(
  //   `DELETE FROM User WHERE email = ?`,
  //   [newUser.email]
  // );
  // console.log('Deleted user:', deleteResult);

  // 5. Join: Get all wallets with user info
  // const walletsWithUsers = await dc.query(
  //   `SELECT Wallet.*, User.displayName, User.email FROM Wallet JOIN User ON Wallet.user = User.email`
  // );
  // console.log('Wallets with user info:', walletsWithUsers);
}

// main().catch(console.error); 