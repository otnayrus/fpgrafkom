(function() {
    var width = window.innerWidth * 0.995;
    var height = window.innerHeight * 0.995;
    var canvasContainer = document.getElementById("canvasContainer");
    var renderer, camera, scene;
    var input, miniMap, levelHelper, CameraHelper;
    var map = new Array();
    var running = true;
    var scale = 1;
    var ai = [];
    bullets = [];
    var aix = 1,aiz = 0;
    var mouse = { x: 0, y: 0 };
    var projector = new THREE.Projector();

    function launch() {
        initializeScene();
        mainLoop();
    }

    window.onload = function() {
        initializeEngine();

        var level = 1; // Get parameter
        if (level > 0 || level <= levelHelper.count) {
            levelHelper.current = level;
            levelHelper.next = level + 1;
            loadLevel(level);
        } else {
            levelHelper.current = 1;
            levelHelper.next = 2;
            loadLevel();
        }
    };

    function initializeEngine() {
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.setSize(width, height);
        renderer.clear();

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x777777, 25, 1000);

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        camera.position.y = 50;
        camera.rotation.order = "YXZ"; // this is not the default

        document.getElementById("canvasContainer").appendChild(renderer.domElement);

        input = new game.Input();
        levelHelper = new game.GameHelper.LevelHelper();
        cameraHelper = new game.GameHelper.CameraHelper(camera);

        window.addEventListener("resize", function() {
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        canvasContainer.requestPointerLock = canvasContainer.requestPointerLock || canvasContainer.mozRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
        canvasContainer.onclick = function() {
          canvasContainer.requestPointerLock();
        };
        document.addEventListener('pointerlockchange', lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
        function lockChangeAlert() {
        if (document.pointerLockElement === canvasContainer || document.mozPointerLockElement === canvasContainer) {
            console.log('The pointer lock status is now locked');
            document.addEventListener("mousemove", moveCamera, false);
          } else {
            console.log('The pointer lock status is now unlocked');  
            document.removeEventListener("mousemove", moveCamera, false);
          }
        }

		document.addEventListener("click", function(e){
		    e.preventDefault;
		    if (e.which === 1) { // Left click only
			createBullet();
		}
		}); 

        showMessage();
    }

    function showMessage(){
        var messageContainer = document.createElement("div");
        messageContainer.style.position = "absolute";
        messageContainer.style.backgroundColor = "#666";
        messageContainer.style.border = "1px solid #333";

        var message = document.createElement("h1");
        message.innerHTML = "Use W/A/S/D to move and arrow left/right rotate the camera. Click to enter fps mode";
        message.style.textAlign = "center";
        message.style.color = "#ddd";
        message.style.padding = "15px";
        messageContainer.appendChild(message);

        document.body.appendChild(messageContainer);

        messageContainer.style.left = (window.innerWidth / 2 - messageContainer.offsetWidth / 2) + "px";
        messageContainer.style.top = (window.innerHeight / 2 - messageContainer.offsetHeight / 2) + "px";

        var timer = setTimeout(function() {
            clearTimeout(timer);
            document.body.removeChild(messageContainer);
        }, 3500);
    }

    function initializeScene() {
        miniMap = new game.Gui.MiniMap(map[0].length, map.length, "canvasContainer");
        miniMap.create();

        var loader = new THREE.TextureLoader();
        var platformWidth = map[0].length * 100;
        var platformHeight = map.length * 100;

        var floorGeometry = new THREE.BoxGeometry(platformWidth, 5, platformHeight);
        var ground = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({
            map: loader.load("assets/images/textures/ground_diffuse.jpg"),
        }));

        repeatTexture(ground.material.map, 2);

        ground.position.set(-50, 1, -50);
        scene.add(ground);

        var topMesh = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({
            map: loader.load("assets/images/textures/roof_diffuse.jpg")
        }));

        repeatTexture(topMesh.material.map, 16);

        topMesh.position.set(-50, 100, -50);
        scene.add(topMesh);

        var size = {
            x: 100,
            y: 100,
            z: 100
        };

        var position = { 
            x: 0, 
            y: 0, 
            z: 0 
        };

        var wallGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        var wallMaterial = new THREE.MeshPhongMaterial({
            map: loader.load("assets/images/textures/wall_diffuse.jpg")
        });

        repeatTexture(wallMaterial.map, 2);

        // Map generation
        for (var y = 0, ly = map.length; y < ly; y++) {
            for (var x = 0, lx = map[x].length; x < lx; x++) {
                position.x = -platformWidth / 2 + size.x * x;
                position.y = 50;
                position.z = -platformHeight / 2 + size.z * y;

                if (x == 0 && y == 0) {
                    cameraHelper.origin.x = position.x;
                    cameraHelper.origin.y = position.y;
                    cameraHelper.origin.z = position.z;
                }

                if (map[y][x] > 1) {
                    var wall3D = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall3D.position.set(position.x, position.y, position.z);
                    scene.add(wall3D);
                }

                if (map[y][x] === "D") {
                    camera.position.set(position.x, position.y, position.z);
                    cameraHelper.origin.position.x = position.x;
                    cameraHelper.origin.position.y = position.y;
                    cameraHelper.origin.position.z = position.z;
                    cameraHelper.origin.position.mapX = x;
                    cameraHelper.origin.position.mapY = y;
                    cameraHelper.origin.position.mapZ = 0;
                }

                if (map[y][x] === "E") {
                	var aiMaterial = new THREE.MeshBasicMaterial({/*color: 0xEE3333,*/map: THREE.ImageUtils.loadTexture('assets/images/textures/face.png')});
					var aiGeo = new THREE.CubeGeometry(40, 40, 40);
					var o = new THREE.Mesh(aiGeo, aiMaterial);
					o.position.set(position.x, position.y, position.z);
					ai.push(o);
					scene.add(o);
                }

                miniMap.draw(x, y, map[y][x]);
            }
        }

        // Lights
        var directionalLight = new THREE.HemisphereLight(0x192F3F, 0x28343A, 2);
        directionalLight.position.set(1, 1, 0);
        scene.add(directionalLight);
    }

    function update() {
        
        if(input.keys.shift)
        {
        	if (input.keys.w) {
            	moveCamera("up",1);
	        } 
	        else if (input.keys.s) {
	            moveCamera("down",1);
	        }
	     	else if (input.keys.a) {
            moveCamera("left",1);
	        } 
	        else if (input.keys.d) {
	            moveCamera("right",1);
	        }
        }

        if (input.keys.w) {
            moveCamera("up");
        } else if (input.keys.s) {
            moveCamera("down");
        }

        if (input.keys.a) {
            moveCamera("left");
        } else if (input.keys.d) {
            moveCamera("right");
        }

        if (input.keys.left) {
            moveCamera("cameraleft");
        } else if (input.keys.right) {
            moveCamera("cameraright");
        }

    }
    function draw() {

    for (var i = bullets.length-1; i >= 0; i--) {
		var b = bullets[i], p = b.position, d = b.ray.direction;

		var tx = Math.abs(Math.floor(((cameraHelper.origin.x + (b.position.x * -1) + 50) / 100)));
        var ty = Math.abs(Math.floor(((cameraHelper.origin.z + (b.position.z * -1) + 50) / 100)));

		if (map[ty][tx] == 2) {
			bullets.splice(i, 1);
			scene.remove(b);
			continue;
		}
		// Collide with AI
		var hit = false;
		for (var j = ai.length-1; j >= 0; j--) {
			var a = ai[j];
			var v = a.geometry.vertices[0];
			var c = a.position;
			var x = Math.abs(v.x), z = Math.abs(v.z);
			//console.log(Math.round(p.x), Math.round(p.z), c.x, c.z, x, z);
			if (p.x < c.x + x && p.x > c.x - x &&
					p.z < c.z + z && p.z > c.z - z &&
					b.owner != a) {
				bullets.splice(i, 1);
				scene.remove(b);
				ai.splice(j,1);
				scene.remove(a);
				hit = true;
				break;
			}
		}
		if (!hit) {
			b.translateX(2 * d.x);
			//bullets[i].translateY(speed * bullets[i].direction.y);
			b.translateZ(2 * d.z);
		}
	}

    for (var i = ai.length-1; i >= 0; i--) {
        var collides = false;
		var a = ai[i];
		// Move AI
        var position = {
            x: a.position.x + 1 * aix,
            z: a.position.z + 1 * aiz
        };
         // Current position on the map
        var tx = Math.abs(Math.floor(((cameraHelper.origin.x + (a.position.x * -1)) / 100)));
        var ty = Math.abs(Math.floor(((cameraHelper.origin.z + (a.position.z * -1)) / 100)));

        // next position
        var newTx = Math.abs(Math.floor(((cameraHelper.origin.x + (position.x * -1) + (10)) / 100)));
        var newTy = Math.abs(Math.floor(((cameraHelper.origin.z + (position.z * -1) + (10)) / 100)));

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
            var r = Math.floor(Math.random() * (4 - 0) + 0);
            switch(r){
                case 1 :
                    aix = 1;
                    aiz = 0;
                    break;
                case 2 :
                    aix = -1;
                    aiz = 0;
                    break;
                case 3 :
                    aix = 0;
                    aiz = 1;
                    break;
                case 4 :
                    aix = 0;
                    aiz = -1;
                    break;
            }

        }
        else if(map[ty+1][tx] == (1 - Math.abs(aix))|| map[ty-1][tx] == (1 - Math.abs(aix)) || map[ty][tx+1] == (1 - Math.abs(aiz)) || map[ty][tx-1] == (1 - Math.abs(aiz))){
            var r = Math.floor(Math.random() * (4 - 0) + 0);
            //seizure disini
            switch(r){
                case 1 :
                    aix = 1;
                    aiz = 0;
                    break;
                case 2 :
                    aix = -1;
                    aiz = 0;
                    break;
                case 3 :
                    aix = 0;
                    aiz = 1;
                    break;
                case 4 :
                    aix = 0;
                    aiz = -1;
                    break;
            }
        }

        if (collides == false) {
            a.position.x = position.x;
            a.position.z = position.z;

             miniMap.updateEnemy(i,{
                 x: newTx,
                 y: newTy
             });
        } else {
            //nabrak
        }

	}

        renderer.render(scene, camera);
    }

    function moveCamera(direction, num, delta) {

        var collides = false;
        var position = {
            x: camera.position.x,
            z: camera.position.z
        };
        var rotationY = camera.rotation.y;
        var rotationX = camera.rotation.x;
        
        if(num==1)var offset = 50;
        else var offset = 40;

        if(typeof direction == "object"){
            rotationY -= ((direction.movementX / renderer.domElement.clientWidth) * 2)/ scale;
            rotationX -= ((direction.movementY / renderer.domElement.clientHeight) * 2)/ scale;
            direction = "cameraRotation";
        }

        var moveParameters = {
            translation: (typeof delta != "undefined") ? delta.translation : cameraHelper.translation,
            rotation: (typeof delta != "undefined") ? delta.rotation : cameraHelper.rotation
        };

        switch (direction) {
            case "up":
                position.x -= Math.sin(-camera.rotation.y) * -moveParameters.translation;
                position.z -= Math.cos(-camera.rotation.y) * moveParameters.translation;
                break;
            case "down":
                position.x -= Math.sin(camera.rotation.y) * -moveParameters.translation;
                position.z += Math.cos(camera.rotation.y) * moveParameters.translation;
                break;
            case "left":
                position.x += Math.cos(camera.rotation.y) * -moveParameters.translation;
                position.z += Math.sin(camera.rotation.y) * moveParameters.translation;
                //
                break;
            case "right":
                position.x -= Math.cos(camera.rotation.y) * -moveParameters.translation;
                position.z -= Math.sin(camera.rotation.y) * moveParameters.translation;
                //
                break;
            case "cameraleft":
                rotationY += moveParameters.rotation;
                break;
            case "cameraright":
                rotationY -= moveParameters.rotation;
                break;
            case "cameraRotation":
                break;
        }

        // Current position on the map
        var tx = Math.abs(Math.floor(((cameraHelper.origin.x + (camera.position.x * -1)) / 100)));
        var ty = Math.abs(Math.floor(((cameraHelper.origin.z + (camera.position.z * -1)) / 100)));

        // next position
        var newTx = Math.abs(Math.floor(((cameraHelper.origin.x + (position.x * -1) + (offset)) / 100)));
        var newTy = Math.abs(Math.floor(((cameraHelper.origin.z + (position.z * -1) + (offset)) / 100)));

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
            camera.rotation.y = rotationY;
            camera.rotation.x = rotationX;
            camera.position.x = position.x;
            camera.position.z = position.z;

            miniMap.update({
                x: newTx,
                y: newTy
            });
        } else {
            //nabrak
        }

        for (var i = ai.length-1; i >= 0; i--) {
			var a = ai[i];

			if((camera.position.x-40 <= a.position.x && a.position.x <= camera.position.x+40) && (camera.position.z-40 <= a.position.z && a.position.z <= camera.position.z+40)) {
				running = false;
				
			}
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
        if (levelHelper.isFinished || levelHelper.isMobile) {
            alert("Terima Kasih udah mainin FP kelompok kami");
        } else {
            // Remove all childrens.
            for (var i = 0, l = scene.children.length; i < l; i++) {
                scene.remove(scene.children[i]);
            }
            renderer.clear();
            scene = new THREE.Scene();
            loadLevel(levelHelper.getNext());
            running = true;
        }
    }

    function onDocumentMouseMove(e) {
		e.preventDefault();
		mouse.x = (e.clientX / WIDTH) * 2 - 1;
		mouse.y = - (e.clientY / HEIGHT) * 2 + 1;
	}

    function loadLevel(level) {
    	var r = Math.floor(Math.random() * 3) + 1;
        var ajax = new XMLHttpRequest();
        ajax.open("GET", "assets/maps/maze3d-" + r + ".json", true);
        ajax.onreadystatechange = function() {
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


    function createBullet(obj) {
		
		obj = camera;
		
		var sphere = new THREE.Mesh(new THREE.SphereGeometry(2,6,6), new THREE.MeshBasicMaterial({color: 0x333333}));
		sphere.position.set(obj.position.x, obj.position.y * 0.8, obj.position.z);

		if (obj instanceof THREE.Camera) {
			var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
			projector.unprojectVector(vector, obj);
			sphere.ray = new THREE.Ray(
					obj.position,
					vector.sub(obj.position).normalize()
			);
		}
		else {
			var vector = cam.position.clone();
			sphere.ray = new THREE.Ray(
					obj.position,
					vector.subSelf(obj.position).normalize()
			);
		}
		sphere.owner = obj;
		
		bullets.push(sphere);
		scene.add(sphere);
		
		return sphere;
	}

})();