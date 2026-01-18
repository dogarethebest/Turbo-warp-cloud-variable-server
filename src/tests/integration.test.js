const Room = require('../Room');
const RoomList = require('../RoomList');
const Client = require('../Client');

jest.mock('../Client.js');

/**
 * Integration tests for Room and RoomList functionality
 * Tests real-world scenarios with multiple clients and variable changes
 */

describe('Room Integration Tests', () => {
  describe('Single Room Operations', () => {
    test('create room and add variables', () => {
      const room = new Room('test-room-1');
      
      // Create initial variables
      room.create('☁ score', '0');
      room.create('☁ players', '1');
      room.create('☁ status', 'waiting');
      
      expect(room.has('☁ score')).toBe(true);
      expect(room.has('☁ players')).toBe(true);
      expect(room.has('☁ status')).toBe(true);
      expect(room.getAllVariables().size).toBe(3);
    });

    test('update variable values multiple times', () => {
      const room = new Room('test-room-2');
      
      room.create('☁ counter', '0');
      expect(room.get('☁ counter')).toBe('0');
      
      // Update multiple times
      room.set('☁ counter', '1');
      expect(room.get('☁ counter')).toBe('1');
      
      room.set('☁ counter', '5');
      expect(room.get('☁ counter')).toBe('5');
      
      room.set('☁ counter', '10');
      expect(room.get('☁ counter')).toBe('10');
    });

    test('delete and recreate variables', () => {
      const room = new Room('test-room-3');
      
      room.create('☁ temp', 'value1');
      expect(room.has('☁ temp')).toBe(true);
      
      room.delete('☁ temp');
      expect(room.has('☁ temp')).toBe(false);
      
      // Can recreate the same variable
      room.create('☁ temp', 'value2');
      expect(room.has('☁ temp')).toBe(true);
      expect(room.get('☁ temp')).toBe('value2');
    });

    test('mixed variable types (strings and numbers as strings)', () => {
      const room = new Room('test-room-4');
      
      room.create('☁ name', 'player1');
      room.create('☁ score', '100');
      room.create('☁ health', '50');
      room.create('☁ message', 'hello');
      
      expect(room.get('☁ name')).toBe('player1');
      expect(room.get('☁ score')).toBe('100');
      expect(room.get('☁ health')).toBe('50');
      expect(room.get('☁ message')).toBe('hello');
    });
  });

  describe('Multi-Client Room Operations', () => {
    test('multiple clients in same room share variables', () => {
      const room = new Room('multiplayer-room');
      
      const client1 = new Client(null, null);
      const client2 = new Client(null, null);
      const client3 = new Client(null, null);
      
      room.addClient(client1);
      room.addClient(client2);
      room.addClient(client3);
      
      expect(room.getClients().length).toBe(3);
      
      // Create variables - should be shared
      room.create('☁ game_state', 'started');
      room.create('☁ round', '1');
      
      // All clients see the same variables
      expect(room.get('☁ game_state')).toBe('started');
      expect(room.get('☁ round')).toBe('1');
    });

    test('variable changes are visible to all clients', () => {
      const room = new Room('shared-variables-room');
      
      const client1 = new Client(null, null);
      const client2 = new Client(null, null);
      
      room.addClient(client1);
      room.addClient(client2);
      
      room.create('☁ shared_value', '10');
      
      // Client 1 updates
      room.set('☁ shared_value', '20');
      
      // Both clients see the update
      expect(room.get('☁ shared_value')).toBe('20');
      expect(room.getClients().length).toBe(2);
    });

    test('client disconnection does not affect room variables', () => {
      const room = new Room('disconnect-test-room');
      
      const client1 = new Client(null, null);
      const client2 = new Client(null, null);
      
      room.addClient(client1);
      room.addClient(client2);
      room.create('☁ persistent', 'data');
      
      expect(room.getClients().length).toBe(2);
      
      // Client disconnects
      room.removeClient(client1);
      
      expect(room.getClients().length).toBe(1);
      expect(room.get('☁ persistent')).toBe('data'); // Data still there
    });

    test('room with no clients still maintains variables', () => {
      const room = new Room('empty-room');
      
      const client = new Client(null, null);
      room.addClient(client);
      
      room.create('☁ empty_room_var', 'test');
      
      room.removeClient(client);
      
      expect(room.getClients().length).toBe(0);
      expect(room.has('☁ empty_room_var')).toBe(true);
      expect(room.get('☁ empty_room_var')).toBe('test');
    });
  });

  describe('RoomList with Multiple Rooms', () => {
    test('create multiple isolated rooms', () => {
      const roomList = new RoomList();
      
      const room1 = roomList.create('game-1');
      const room2 = roomList.create('game-2');
      const room3 = roomList.create('game-3');
      
      expect(roomList.has('game-1')).toBe(true);
      expect(roomList.has('game-2')).toBe(true);
      expect(roomList.has('game-3')).toBe(true);
      
      expect(room1.id).toBe('game-1');
      expect(room2.id).toBe('game-2');
      expect(room3.id).toBe('game-3');
    });

    test('variables in different rooms are isolated', () => {
      const roomList = new RoomList();
      
      const room1 = roomList.create('isolated-1');
      const room2 = roomList.create('isolated-2');
      
      room1.create('☁ value', '100');
      room2.create('☁ value', '200');
      
      // Each room has its own variable
      expect(room1.get('☁ value')).toBe('100');
      expect(room2.get('☁ value')).toBe('200');
    });

    test('clients in different rooms do not share variables', () => {
      const roomList = new RoomList();
      
      const room1 = roomList.create('room-a');
      const room2 = roomList.create('room-b');
      
      const client1 = new Client(null, null);
      const client2 = new Client(null, null);
      
      room1.addClient(client1);
      room2.addClient(client2);
      
      room1.create('☁ secret', 'room1-data');
      room2.create('☁ secret', 'room2-data');
      
      // Different rooms can have different values for same variable name
      expect(room1.get('☁ secret')).toBe('room1-data');
      expect(room2.get('☁ secret')).toBe('room2-data');
    });

    test('remove and recreate rooms', () => {
      const roomList = new RoomList();
      
      const room = roomList.create('temporary');
      room.create('☁ temp_data', 'value');
      
      expect(roomList.has('temporary')).toBe(true);
      
      roomList.remove('temporary');
      
      expect(roomList.has('temporary')).toBe(false);
      
      // Can recreate with same name
      const newRoom = roomList.create('temporary');
      expect(roomList.has('temporary')).toBe(true);
      expect(newRoom.getAllVariables().size).toBe(0); // Fresh room
    });
  });

  describe('Configuration Limits Applied', () => {
    test('respect maxVariablesPerRoom limit', () => {
      const room = new Room('limit-test');
      
      // Create up to the max
      for (let i = 0; i < room.maxVariables; i++) {
        room.create(`☁ var${i}`, String(i));
      }
      
      expect(room.getAllVariables().size).toBe(room.maxVariables);
      
      // Adding one more should fail
      expect(() => room.create('☁ overflow', 'too many')).toThrow();
    });

    test('respect maxClientsPerRoom limit', () => {
      const room = new Room('client-limit-test');
      
      const clients = [];
      
      // Add up to the max
      for (let i = 0; i < room.maxClients; i++) {
        const client = new Client(null, null);
        room.addClient(client);
        clients.push(client);
      }
      
      expect(room.getClients().length).toBe(room.maxClients);
      
      // Adding one more should fail
      const extraClient = new Client(null, null);
      expect(() => room.addClient(extraClient)).toThrow();
    });

    test('RoomList respects maxRooms limit', () => {
      const roomList = new RoomList();
      roomList.maxRooms = 5; // Set a small limit for testing
      
      // Create up to the max
      for (let i = 0; i < roomList.maxRooms; i++) {
        roomList.create(`room-${i}`);
      }
      
      expect(roomList.maxRooms).toBe(5);
      
      // Adding one more should fail
      expect(() => roomList.create('overflow-room')).toThrow();
    });
  });

  describe('Complex Scenarios', () => {
    test('game session with score updates', () => {
      const roomList = new RoomList();
      const gameRoom = roomList.create('game-session-123');
      
      const player1 = new Client(null, null);
      const player2 = new Client(null, null);
      
      gameRoom.addClient(player1);
      gameRoom.addClient(player2);
      
      // Initialize game
      gameRoom.create('☁ player1_score', '0');
      gameRoom.create('☁ player2_score', '0');
      gameRoom.create('☁ game_status', 'running');
      gameRoom.create('☁ round', '1');
      
      // Simulate gameplay
      gameRoom.set('☁ player1_score', '10');
      gameRoom.set('☁ player2_score', '15');
      gameRoom.set('☁ round', '2');
      
      expect(gameRoom.get('☁ player1_score')).toBe('10');
      expect(gameRoom.get('☁ player2_score')).toBe('15');
      expect(gameRoom.get('☁ round')).toBe('2');
      expect(gameRoom.getClients().length).toBe(2);
    });

    test('multiplayer room with team scores', () => {
      const roomList = new RoomList();
      const teamRoom = roomList.create('team-battle');
      
      // Create team
      const players = [];
      for (let i = 0; i < 4; i++) {
        const client = new Client(null, null);
        teamRoom.addClient(client);
        players.push(client);
      }
      
      // Setup game variables
      teamRoom.create('☁ team_a_score', '0');
      teamRoom.create('☁ team_b_score', '0');
      teamRoom.create('☁ team_a_players', '2');
      teamRoom.create('☁ team_b_players', '2');
      
      // Update scores
      teamRoom.set('☁ team_a_score', '50');
      teamRoom.set('☁ team_b_score', '45');
      
      expect(teamRoom.getClients().length).toBe(4);
      expect(teamRoom.get('☁ team_a_score')).toBe('50');
      expect(teamRoom.get('☁ team_b_score')).toBe('45');
    });

    test('room persistence across client changes', () => {
      const roomList = new RoomList();
      const persistentRoom = roomList.create('persistent');
      
      // First client joins and creates data
      const client1 = new Client(null, null);
      persistentRoom.addClient(client1);
      persistentRoom.create('☁ game_data', 'important');
      persistentRoom.create('☁ state', 'initialized');
      
      // First client leaves
      persistentRoom.removeClient(client1);
      
      // Second client joins - should see the same data
      const client2 = new Client(null, null);
      persistentRoom.addClient(client2);
      
      expect(persistentRoom.get('☁ game_data')).toBe('important');
      expect(persistentRoom.get('☁ state')).toBe('initialized');
      expect(persistentRoom.getClients().length).toBe(1);
    });
  });
});

describe('Variable Handling Stress Tests', () => {
  describe('Comprehensive Variable Operations Load Test', () => {
    test('variable operations with 15-20 rooms, 5-10 users per room, 20 variables per room over 45 seconds', (done) => {
      // Test configuration
      const DURATION_MS = 45 * 1000; // 45 seconds - middle of 30-60 second range
      const NUM_ROOMS = 15 + Math.floor(Math.random() * 6); // 15-20 rooms
      const MIN_USERS_PER_ROOM = 5;
      const MAX_USERS_PER_ROOM = 10;
      const VARIABLES_PER_ROOM = 20;

      // Track metrics
      const metrics = {
        startTime: Date.now(),
        totalUpdates: 0,
        totalReads: 0,
        totalErrors: 0,
        roomsCreated: 0,
        clientsCreated: 0,
        variablesCreated: 0,
      };
      
      // Initialize arrays separately for proper type inference
      const operationTimes = [];
      const errorLog = [];

      const roomList = new RoomList();
      const rooms = [];
      const roomVariableNames = {};
      let updateInterval;

      try {
        // Setup: Create all rooms, clients, and variables
        console.log(`\n========== VARIABLE HANDLING STRESS TEST ==========`);
        console.log(`Setting up ${NUM_ROOMS} rooms with 5-10 users and 20 variables each...\n`);

        for (let r = 0; r < NUM_ROOMS; r++) {
          const roomId = `variable-test-room-${r}`;
          const room = roomList.create(roomId);
          rooms.push(room);
          roomVariableNames[r] = [];
          metrics.roomsCreated++;

          // Add random number of clients to each room
          const userCount = MIN_USERS_PER_ROOM + 
            Math.floor(Math.random() * (MAX_USERS_PER_ROOM - MIN_USERS_PER_ROOM + 1));

          for (let c = 0; c < userCount; c++) {
            const client = new Client(null, null);
            room.addClient(client);
            metrics.clientsCreated++;
          }

          // Create exactly 20 variables per room
          for (let v = 0; v < VARIABLES_PER_ROOM; v++) {
            const varName = `☁ var_${r}_${v}`;
            room.create(varName, String(v));
            roomVariableNames[r].push(varName);
            metrics.variablesCreated++;
          }
        }

        console.log(`Setup complete: ${metrics.roomsCreated} rooms, ${metrics.clientsCreated} clients, ${metrics.variablesCreated} variables\n`);

        // Start: Perform continuous variable updates and reads
        updateInterval = setInterval(() => {
          const operationStartTime = Date.now();

          try {
            // Randomly select a room and perform operations
            const roomIdx = Math.floor(Math.random() * NUM_ROOMS);
            const room = rooms[roomIdx];
            
            // Pick 2-4 random variables from this room to update
            const numOpsThisInterval = 2 + Math.floor(Math.random() * 3);
            
            for (let op = 0; op < numOpsThisInterval; op++) {
              const varIdx = Math.floor(Math.random() * VARIABLES_PER_ROOM);
              const varName = roomVariableNames[roomIdx][varIdx];
              
              // Perform operations: 70% update, 30% read
              if (Math.random() < 0.7) {
                // Update operation
                const newValue = String(Math.floor(Math.random() * 10000));
                room.set(varName, newValue);
                metrics.totalUpdates++;
              } else {
                // Read operation
                room.get(varName);
                metrics.totalReads++;
              }
            }
          } catch (error) {
            metrics.totalErrors++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            errorLog.push({
              timestamp: new Date().toISOString(),
              error: errorMessage,
            });
          }

          const operationTime = Date.now() - operationStartTime;
          operationTimes.push(operationTime);
        }, 10); // Operation every 10ms for continuous load

        // Stop after duration and report results
        setTimeout(() => {
          clearInterval(updateInterval);

          const totalTime = Date.now() - metrics.startTime;
          const totalOperations = metrics.totalUpdates + metrics.totalReads;
          const opsPerSecond = (totalOperations / totalTime) * 1000;
          const avgOpTime = operationTimes.length > 0
            ? operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length
            : 0;
          const maxOpTime = operationTimes.length > 0
            ? Math.max(...operationTimes)
            : 0;
          const minOpTime = operationTimes.length > 0
            ? Math.min(...operationTimes)
            : 0;

          // Log results
          console.log('\n========== VARIABLE HANDLING TEST RESULTS ==========');
          console.log(`\nTest Duration: ${(totalTime / 1000).toFixed(2)} seconds`);
          console.log(`\nResources Created:`);
          console.log(`  Rooms: ${metrics.roomsCreated}`);
          console.log(`  Clients: ${metrics.clientsCreated}`);
          console.log(`  Variables: ${metrics.variablesCreated}`);
          console.log(`\nOperation Results:`);
          console.log(`  Total Operations: ${totalOperations}`);
          console.log(`  Updates: ${metrics.totalUpdates}`);
          console.log(`  Reads: ${metrics.totalReads}`);
          console.log(`  Operations/Second: ${opsPerSecond.toFixed(2)}`);
          console.log(`\nPerformance Metrics:`);
          console.log(`  Avg Operation Time: ${avgOpTime.toFixed(2)}ms`);
          console.log(`  Min Operation Time: ${minOpTime.toFixed(2)}ms`);
          console.log(`  Max Operation Time: ${maxOpTime.toFixed(2)}ms`);
          console.log(`  Total Errors: ${metrics.totalErrors}`);

          // Verify final state of all rooms
          console.log(`\nFinal Room States:`);
          let totalRoomVariables = 0;
          let totalRoomClients = 0;
          rooms.forEach((room, idx) => {
            const varCount = room.getAllVariables().size;
            const clientCount = room.getClients().length;
            totalRoomVariables += varCount;
            totalRoomClients += clientCount;
            console.log(`  Room ${idx}: ${clientCount} clients, ${varCount}/${VARIABLES_PER_ROOM} variables`);
          });

          console.log(`\nTotals:`);
          console.log(`  Total Room Clients: ${totalRoomClients}`);
          console.log(`  Total Room Variables: ${totalRoomVariables}`);
          if (errorLog.length > 0) {
            console.log(`\nErrors Encountered: ${errorLog.length}`);
            errorLog.slice(0, 10).forEach((err) => {
              console.log(`  - ${err.error}`);
            });
          }

          console.log('===================================================\n');

          // Assertions
          expect(metrics.roomsCreated).toBe(NUM_ROOMS);
          expect(metrics.clientsCreated).toBeGreaterThanOrEqual(NUM_ROOMS * MIN_USERS_PER_ROOM);
          expect(metrics.variablesCreated).toBe(NUM_ROOMS * VARIABLES_PER_ROOM);
          expect(totalOperations).toBeGreaterThan(0);
          expect(opsPerSecond).toBeGreaterThan(0);
          expect(metrics.totalErrors).toBe(0);
          expect(totalRoomClients).toBe(metrics.clientsCreated);
          expect(totalRoomVariables).toBe(metrics.variablesCreated);

          done();
        }, DURATION_MS);
      } catch (error) {
        if (updateInterval) {
          clearInterval(updateInterval);
        }
        done(error);
      }
    }, 120000); // 2 minute Jest timeout
  });
});
