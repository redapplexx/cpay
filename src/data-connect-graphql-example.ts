const ENDPOINT = 'https://redapplex-ai-platform.dataconnect.asia-east1.firebasedatabase.app/graphql';

async function graphqlRequest(query: string, variables?: any) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer <YOUR_ID_TOKEN>', // Uncomment and set if needed
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function main() {
  // 1. Query all users
  const usersQuery = `
    query {
      User {
        email
        displayName
        createdAt
      }
    }
  `;
  const users = await graphqlRequest(usersQuery);
  console.log('All users:', users);

  // 2. Insert a new user
  const insertUserMutation = `
    mutation InsertUser($input: UserInput!) {
      insert_User(object: $input) {
        email
        displayName
      }
    }
  `;
  const newUser = {
    email: 'graphqluser@example.com',
    phoneNumber: '+11234567890',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    displayName: 'GraphQL User',
    photoUrl: '',
    role: 'user',
  };
  const inserted = await graphqlRequest(insertUserMutation, { input: newUser });
  console.log('Inserted user:', inserted);

  // 3. Update a user
  const updateUserMutation = `
    mutation UpdateUser($email: String!, $displayName: String!) {
      update_User(
        where: { email: { _eq: $email } }
        _set: { displayName: $displayName }
      ) {
        affected_rows
      }
    }
  `;
  const updated = await graphqlRequest(updateUserMutation, {
    email: newUser.email,
    displayName: 'Updated GraphQL User',
  });
  console.log('Updated user:', updated);

  // 4. Delete a user
  const deleteUserMutation = `
    mutation DeleteUser($email: String!) {
      delete_User(where: { email: { _eq: $email } }) {
        affected_rows
      }
    }
  `;
  const deleted = await graphqlRequest(deleteUserMutation, { email: newUser.email });
  console.log('Deleted user:', deleted);

  // 5. Join wallets with user info
  const joinQuery = `
    query {
      Wallet {
        currency
        balance
        user {
          email
          displayName
        }
      }
    }
  `;
  const wallets = await graphqlRequest(joinQuery);
  console.log('Wallets with user info:', wallets);
}

// main().catch(console.error); 