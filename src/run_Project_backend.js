// @ts-nocheck

const fs = require('fs');
const path = require('path');
const VM = require('scratch-vm');
const Storage = require('scratch-storage').default;

const PROJECT_PATH = path.join(
  __dirname,
  '../Project_backend/Project_backend.sb3'
);

const vm = new VM();

const storage = new Storage();
storage.addWebSource([Storage.AssetType.Project]);
storage.addWebSource([Storage.AssetType.ImageVector]);
storage.addWebSource([Storage.AssetType.ImageBitmap]);
storage.addWebSource([Storage.AssetType.Sound]);

vm.attachStorage(storage);

(async () => {
  const projectData = fs.readFileSync(PROJECT_PATH);
  await vm.loadProject(projectData);

  vm.start();
  vm.greenFlag();

  console.log('Project_backend.sb3 is running');
})();
