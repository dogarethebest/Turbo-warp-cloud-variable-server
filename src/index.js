const http = require('http');
const fs = require('fs');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

const logger = require('./logger');
const config = require('./config');
const wss = require('./server');
const VirtualMachine = require('./virtual-machine');

const enabled_Project_backend = false; // Set to true to enable running Project_backend.sb3

if(enabled_Project_backend){
  // Automatically run the SB3 project in the background
  (async () => {
    try {
      // Replace this with the path to your SB3 project
      const path = require('path');
      const fs = require('fs');

      const PROJECT_PATH = path.join(__dirname, '../Project_backend/Project_backend.sb3');

      // Ensure the file exists
      if (fs.existsSync(PROJECT_PATH)) {
        const projectData = fs.readFileSync(PROJECT_PATH);

        // Create and run VM
        const vm = new VirtualMachine();
        await vm.loadProject(projectData);
        vm.start();
        vm.greenFlag();

        console.log('Project_backend.sb3 is running in the background.');
      } else {
        console.warn(`SB3 project not found at ${PROJECT_PATH}`);
      }
    } catch (err) {
      console.error('Error running SB3 project:', err);
    }
  })();
}
// Export VirtualMachine as before
module.exports = VirtualMachine;


// We serve static files over HTTP
const serve = serveStatic('public');
const server = http.createServer(function handler(req, res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
  // @ts-ignore
  serve(req, res, finalhandler(req, res));
});

server.on('upgrade', function upgrade(request, socket, head) {
  // Forward these requests to the WebSocket server.
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  });
});

server.on('close', function() {
  // TODO: this code never seems to actually run
  logger.info('Server closing');
  wss.close();
});

const port = config.port;
server.listen(port, function() {
  // Update permissions of unix sockets
  if (typeof port === 'string' && port.startsWith('/') && config.unixSocketPermissions >= 0) {
    fs.chmod(port, config.unixSocketPermissions, function(err) {
      if (err) {
        logger.error('could not chmod unix socket: ' + err);
        process.exit(1);
      }
    });
  }
  logger.info('Server started on port: ' + port);
});
