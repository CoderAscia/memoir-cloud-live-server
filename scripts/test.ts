import WebSocket from 'ws';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { DeltaData } from '../src/types';
import { CharacterDocument, MemoryDocument } from '../src/interface_types';

dotenv.config();
const ws = new WebSocket(process.env.WS_URL!);
const url = process.env.HTTP_URL!;

ws.on('open', async () => {
    console.log('Connected to WebSocket Server at', process.env.WS_URL);
    console.log('---- Tests Started ----');

    let deltaUpdates: DeltaData = {
        deltaCharacters: [],
        deltaConversations: [],
        deltaMessages: [],
        deltaMemories: [],
        deltaVersion: "0.0.0"
    };
    const userId = "test_user_id";
    const characterId = uuidv4();
    let conversationId = "";

    try {
        let res: any;
        let p: Promise<any>;

        // 1. Testing getLatestUserData
        console.log("1. Testing getLatestUserData...");
        p = waitForResponse("syncResponse");
        ws.send(JSON.stringify({ type: "getLatestUserData", lastSyncVersion: deltaUpdates.deltaVersion }));
        res = await p;
        console.log("✅ getLatestUserData response:");

        if (res.delta_updates != null) {
            deltaUpdates = res.delta_updates;
            Object.entries(res.delta_updates).forEach(([key, value]) => {
                console.log(`=== ${key.toUpperCase()} ===`);
                console.table(value);
            });
        } else {
            console.log(`   Already up to date (timestampVersion: ${res.timestampVersion})`);
        }


        //2. Create Character
        const character: CharacterDocument = {
            uid: userId,
            characterId: characterId,
            characterName: "Test Character",
            characterImagePath: "test_image_path",
            characterMetaData: {
                characterStickers: ["test_sticker"],
                chatBackgroundImage: "test_background_image",
                relationship: "test_relationship",
                characterPersonality: "test_personality",
                characterBackstory: "test_backstory"
            },
            lastModified: new Date().toISOString()
        };

        console.log('\nTesting POST /characters (Auth Bypass)...');
        await fetch(`${url}/characters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            },
            body: JSON.stringify(character)
        }).then((res) => {
            console.log('✅ Character POST Status:', res.status);
            console.log('✅ Character POST Response:', res.json());
        }).catch((err) => {
            throw new Error('❌ Error Character POST Response:' + err);
        });

        //3. Update Character
        const updatedCharacter: CharacterDocument = {
            uid: userId,
            characterId: characterId,
            characterName: "Ms. Violet",
            characterImagePath: "updated_test_image_path",
            characterMetaData: {
                characterStickers: ["updated_test_sticker"],
                chatBackgroundImage: "updated_test_background_image",
                relationship: "updated_test_relationship",
                characterPersonality: "updated_test_personality",
                characterBackstory: "updated_test_backstory"
            },
            lastModified: new Date().toISOString()
        };

        console.log('\nTesting PUT /characters (Auth Bypass)...');
        const updateCharRes = await fetch(`${url}/characters`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            },
            body: JSON.stringify(updatedCharacter)
        }).catch((err) => {
            throw new Error('❌ Error Character PUT Response:' + err);
        });
        console.log('✅ Character PUT Status:', updateCharRes.status);
        console.log('✅ Character PUT Response:', await updateCharRes.json());



        //4. Get Character
        console.log('\nTesting GET /characters (Auth Bypass)...');
        const getCharRes = await fetch(`${url}/characters`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            }
        });
        const parseData = await getCharRes.json(); // already parsed
        console.log('✅ Character GET Status:', getCharRes.status);
        console.log('✅ Character GET Response:', parseData);
        if (getCharRes.status !== 200) {
            throw new Error('Character GET request failed');
        }

        try {
            const rawData: any[] = parseData["data"]["characters"];
            const characters: CharacterDocument[] = rawData.map((d) => d as CharacterDocument);
            console.log('✅ Character GET Response:', characters);
        } catch (err) {
            throw new Error('❌ Error Character GET Response:' + err);
        }



        //5. Have new conversation with Character
        console.log("\n2. Testing new conversation chat...");
        p = waitForResponse("chatResponse");
        ws.send(JSON.stringify({
            type: "chat",
            uid: userId,
            characterId,
            messageId: uuidv4(),
            message: "Hello! This is a test message. Please reply with short message."
        }));
        res = await p;
        console.log("✅ new conversation chat response:", res.message);

        // 6. Testing existing conversation chat...
        console.log("\n6. Testing existing conversation chat...");
        p = waitForResponse("chatResponse");
        conversationId = res.conversationId; // cache the conversation id
        ws.send(JSON.stringify({
            type: "chat",
            uid: userId,
            conversationId: res.conversationId,
            characterId,
            messageId: uuidv4(),
            message: "Hello! This is a test message. Please reply with short message."
        }));
        res = await p;
        console.log("✅ existing conversation chat response:", res.message);

        //7. Add Memory Note
        const memory: MemoryDocument = {
            uid: userId,
            memoryId: uuidv4(),
            characterId,
            memoryTitle: "Test Memory",
            memoryContent: "Test Memory Content",
            memorySplashArts: ["test_splash_art"],
            lastModified: new Date().toISOString()
        };
        console.log('\nTesting POST /memories (Auth Bypass)...');
        await fetch(`${url}/memories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            },
            body: JSON.stringify(memory)
        }).then((res) => {
            console.log('✅ Memory POST Status:', res.status);
            console.log('✅ Memory POST Response:', res.json());
        }).catch((err) => {
            throw new Error('❌ Error Memory POST Response:' + err);
        });

        //8. Update Memory Note
        const updatedMemory: MemoryDocument = {
            uid: userId,
            memoryId: memory.memoryId,
            characterId,
            memoryTitle: "Updated Test Memory",
            memoryContent: "Updated Test Memory Content",
            memorySplashArts: ["updated_test_splash_art"],
            lastModified: new Date().toISOString()
        };
        console.log('\nTesting PUT /memories (Auth Bypass)...');
        await fetch(`${url}/memories`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            },
            body: JSON.stringify(updatedMemory)
        }).then((res) => {
            console.log('✅ Memory PUT Status:', res.status);
            console.log('✅ Memory PUT Response:', res.json());
        }).catch((err) => {
            throw new Error('❌ Error Memory PUT Response:' + err);
        });

        // Delete Memory Note
        console.log('\nTesting DELETE /memories (Auth Bypass)...');
        await fetch(`${url}/memories/${memory.memoryId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            }
        }).then((res) => {
            console.log('✅ Memory DELETE Status:', res.status);
            console.log('✅ Memory DELETE Response:', res.json());
        }).catch((err) => {
            throw new Error('❌ Error Memory DELETE Response:' + err);
        });

        //9. Delete messages from conversation id
        console.log("\n9. Testing delete messages from conversation id...");
        const deleteMessages = await fetch(`${url}/allMessages/${conversationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            }
        });
        if (deleteMessages.status !== 200) {
            throw new Error('❌ Delete messages from conversation id request failed');
        }
        console.log('✅ Delete messages from conversation id Status:', deleteMessages.status);
        console.log('✅ Delete messages from conversation id Response:', await deleteMessages.json());

        //8. Delete conversation
        console.log("\n8. Testing delete conversation...");
        const deleteConvo = await fetch(`${url}/conversation/${conversationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            }
        });
        if (deleteConvo.status !== 200) {
            throw new Error('❌ Delete conversation request failed');
        }
        console.log('✅ Delete conversation Status:', deleteConvo.status);
        console.log('✅ Delete conversation Response:', await deleteConvo.json());

        //9. Delete character
        console.log("\n9. Testing delete character...");
        const deleteCharacter = await fetch(`${url}/characters/${characterId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-test-uid': userId
            }
        });
        if (deleteCharacter.status !== 200) {
            throw new Error('❌ Delete character request failed');
        }
        console.log('✅ Delete character Status:', deleteCharacter.status);
        console.log('✅ Delete character Response:', await deleteCharacter.json());

        console.log("\n🎉 ---- All Endpoints Tested Successfully ---- 🎉");

    } catch (error) {
        console.error("\n❌ Test Failed:", error);
    } finally {
        ws.close();
    }
});

ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
});

function waitForResponse(expectedType: string): Promise<any> {
    return new Promise((resolve) => {
        const listener = (data: any) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === expectedType) {
                ws.removeListener('message', listener);
                resolve(msg);
            }
        };
        ws.on('message', listener);
    });
}