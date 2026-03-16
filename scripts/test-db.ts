import Database from '../src/database';
import DBHandler from '../src/dbHandler';

interface TestUser {
    name: string;
    email: string;
    age: number;
}

async function testCRUD() {
    console.log('Starting CRUD tests...');
    const userHandler = new DBHandler<TestUser>('test_users');

    try {
        // 1. Create
        const newUser = { name: 'Test User', email: 'test@example.com', age: 30 };
        const createResult = await userHandler.create(newUser);
        console.log('Create Result:', createResult.insertedId);

        // 2. Read (findOne)
        const user = await userHandler.findOne({ email: 'test@example.com' } as any);
        console.log('Read Result:', user);

        // 3. Update
        const updateResult = await userHandler.update(
            { email: 'test@example.com' } as any,
            { $set: { age: 31 } } as any
        );
        console.log('Update Result:', updateResult.modifiedCount);

        // 4. Delete
        const deleteResult = await userHandler.delete({ email: 'test@example.com' } as any);
        console.log('Delete Result:', deleteResult.deletedCount);

        console.log('All CRUD tests passed!');
    } catch (error) {
        console.error('CRUD tests failed:', error);
    } finally {
        const db = await Database.getInstance();
        await db.close();
    }
}

testCRUD();
