import * as THREE from 'three';
import AsciiEffect from 'three-asciieffect';
import { LevelHelper, CameraHelper } from './helper.js';
import { Input } from './inputs.js';
import { MiniMap } from './minimap.js';

export function maze() {
    let width = window.innerWidth * 0.995;
    let height = window.innerHeight * 0.995;
    let canvasContainer = document.getElementById("canvasContainer");
    let renderer, camera, scene;
    let input, miniMap, levelHelper, cameraHelper;
    let map = new Array();
    let running = true;
    let ascii = ' ▁▂▃▄▅▆▇█';
    // ascii = '|"“”‘’;:π*+•—-_,.';

    function initializeEngine() {
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer = new AsciiEffect(renderer, ascii, { invert: false });

        renderer.setSize(width, height);
        // renderer.clear();


        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x777777, 0, 500);

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        camera.position.y = 50;
        camera.position.x = 180;

        var light = new THREE.PointLight(0xffffff, 10);
        light.position.set(500, 500, 500);
        scene.add(light);


        document.getElementById("canvasContainer").appendChild(renderer.domElement);

        input = new Input();
        levelHelper = new LevelHelper();
        cameraHelper = new CameraHelper(camera);

        window.addEventListener("resize", function () {
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        let messageContainer = document.createElement("div");
        messageContainer.style.position = "absolute";
        messageContainer.style.backgroundColor = "white";
        messageContainer.style.border = "1px solid black";

        let message = document.createElement("p");
        message.innerHTML = "<b>Search for the exit! </b><br> Use W / A / S / D or the buttons to move around";
        message.style.textAlign = "center";
        message.style.color = "#000";
        message.style.padding = "15px";
        messageContainer.appendChild(message);

        document.body.appendChild(messageContainer);

        messageContainer.style.left = (window.innerWidth / 2 - messageContainer.offsetWidth / 2) + "px";
        messageContainer.style.top = (window.innerHeight / 2 - messageContainer.offsetHeight / 2) + "px";

        let timer = setTimeout(function () {
            clearTimeout(timer);
            document.body.removeChild(messageContainer);
        }, 10000);
    }

    function initializeScene() {
        miniMap = new MiniMap(map[0].length, map.length, "canvasContainer");
        miniMap.create();

        let loader = new THREE.TextureLoader();
        let platformWidth = map[0].length * 100;
        let platformHeight = map.length * 100;

        let floorGeometry = new THREE.BoxGeometry(platformWidth, 10, platformHeight);
        let ground = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({
            map: loader.load("./src/assets/images/textures/ground_diffuse.jpg"),
        }));

        repeatTexture(ground.material.map, 2);

        ground.position.set(-50, 1, -50);
        scene.add(ground);

        let topMesh = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({
            map: loader.load("./src/assets/images/textures/roof_diffuse.jpg")
        }));

        repeatTexture(topMesh.material.map, 16);

        topMesh.position.set(-50, 100, -50);
        scene.add(topMesh);

        let size = {
            x: 100,
            y: 100,
            z: 100
        };

        let position = {
            x: 0,
            y: 0,
            z: 0
        };

        let wallGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        let wallMaterial = new THREE.MeshPhongMaterial({
            map: loader.load("./src/assets/images/textures/wall_diffuse.jpg")
        });

        let endMaterial = new THREE.MeshPhongMaterial({
            map: loader.load("./src/assets/images/textures/end.jpg")
        });

        repeatTexture(wallMaterial.map, 2);

        // Map generation
        for (let y = 0, ly = map.length; y < ly; y++) {
            for (let x = 0, lx = map[x].length; x < lx; x++) {
                position.x = -platformWidth / 2 + size.x * x;
                position.y = 50;
                position.z = -platformHeight / 2 + size.z * y;

                if (x == 0 && y == 0) {
                    cameraHelper.origin.x = position.x;
                    cameraHelper.origin.y = position.y;
                    cameraHelper.origin.z = position.z;
                }

                if (map[y][x] > 1) {
                    let wall3D = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall3D.position.set(position.x, position.y, position.z);
                    scene.add(wall3D);
                }

                if (map[y][x] == "A") {
                    let endWall = new THREE.Mesh(wallGeometry, endMaterial);
                    endWall.position.set(position.x, position.y, position.z);
                    scene.add(endWall);
                }

                miniMap.draw(x, y, map[y][x]);
            }
        }

        // Lights
        let directionalLight = new THREE.HemisphereLight(0x192F3F, 0x28343A, 2);
        directionalLight.position.set(1, 1, 0);
        scene.add(directionalLight);
    }

    function update() {
        if (input.keys.up || input.keys.w) {
            moveCamera("up");
        } else if (input.keys.down || input.keys.s) {
            moveCamera("down");
        }

        if (input.keys.left || input.keys.a) {
            moveCamera("left");
        } else if (input.keys.right || input.keys.d) {
            moveCamera("right");
        }
          // Virtual pad
          var params = {
            rotation: 0.05,
            translation: 5
        };

        if (input.joykeys.up) {
            moveCamera("up", params);
        } else if (input.joykeys.down) {
            moveCamera("down", params);
        }

        if (input.joykeys.left) {
            moveCamera("left", params);
        } else if (input.joykeys.right) {
            moveCamera("right", params);
        }
    }

    function draw() {
        renderer.render(scene, camera);
    }

    function moveCamera(direction, delta) {
        let collides = false;
        let position = {
            x: camera.position.x,
            z: camera.position.z
        };
        let rotation = camera.rotation.y;
        let offset = 50;

        let moveParamaters = {
            translation: (typeof delta != "undefined") ? delta.translation : cameraHelper.translation,
            rotation: (typeof delta != "undefined") ? delta.rotation : cameraHelper.rotation
        };

        switch (direction) {
            case "up":
                position.x -= Math.sin(-camera.rotation.y) * -moveParamaters.translation;
                position.z -= Math.cos(-camera.rotation.y) * moveParamaters.translation;
                break;
            case "down":
                position.x -= Math.sin(camera.rotation.y) * -moveParamaters.translation;
                position.z += Math.cos(camera.rotation.y) * moveParamaters.translation;
                break;
            case "left":
                rotation += moveParamaters.rotation;
                break;
            case "right":
                rotation -= moveParamaters.rotation;
                break;
        }

        // Current position on the map
        let tx = Math.abs(Math.floor(((cameraHelper.origin.x + (camera.position.x * -1)) / 100)));
        let ty = Math.abs(Math.floor(((cameraHelper.origin.z + (camera.position.z * -1)) / 100)));

        // next position
        let newTx = Math.abs(Math.floor(((cameraHelper.origin.x + (position.x * -1) + (offset)) / 100)));
        let newTy = Math.abs(Math.floor(((cameraHelper.origin.z + (position.z * -1) + (offset)) / 100)));

        // Stay on the map
        if (newTx >= map[0].length) {
            newTx = map[0].length;
        }
        if (newTx < 0) {
            newTx = 0;
        }
        if (newTy >= map.length) {
            newTy = map.length;
        }
        if (newTy < 0) {
            newTy = 0;
        }

        if (map[newTy][newTx] != 1 && !isNaN(map[newTy][newTx])) {
            collides = true;
        } else if (map[newTy][newTx] == "A") {
            // Game is over
            running = false;
        }

        if (collides == false) {
            camera.rotation.y = rotation;
            camera.position.x = position.x;
            camera.position.z = position.z;

            miniMap.update({
                x: newTx,
                y: newTy
            });
        }
    }

    function mainLoop(time) {
        if (running) {
            update();
            draw();
            window.requestAnimationFrame(mainLoop, renderer.domElement);
        } else {
            endScreen();
        }
    }

    function endScreen() {
        if (levelHelper.isFinished) {
            document.location.href = "mailto:hello@giacomonanni.info?body=I LOVE YOUUU";
            document.location.href = "/";
        } else {
            // Remove all childrens.
            for (let i = 0, l = scene.children.length; i < l; i++) {
                scene.remove(scene.children[i]);
            }
            scene = new THREE.Scene();
            loadLevel(levelHelper.getNext());
            running = true;
        }
    }

    // Level loading
    function loadLevel(level) {
        let ajax = new XMLHttpRequest();
        ajax.open("GET", "./src/assets/maps/maze3d-" + level + ".json", true);
        ajax.onreadystatechange = function () {
            if (ajax.readyState == 4) {
                map = JSON.parse(ajax.responseText);
                launch();
            }
        }
        ajax.send(null);
    }

    function repeatTexture(texture, size) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.x = size;
        texture.repeat.y = size;
        return texture;
    }

    // Game starting
    function launch() {
        initializeScene();
        mainLoop();
    }

    window.onload = function () {
        initializeEngine();

        let level = 1; // Get parameter
        if (level > 0 || level <= levelHelper.count) {
            levelHelper.current = level;
            levelHelper.next = level + 1;
            loadLevel(level);
        } else {
            levelHelper.current = 1;
            levelHelper.next = 2;
            loadLevel(1);
        }
    };
};