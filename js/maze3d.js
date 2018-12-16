

var width = window.innerWidth * 0.995;
var height = window.innerHeight * 0.995;
var canvasContainer = document.getElementById("canvasContainer");
var renderer, camera, scene;
var input, miniMap, CameraHelper;
var map = new Array();
var running = true;
var elem = document.documentElement;


window.onload = function() {
        initializeEngine();
        var level = 1; // Get parameter
        loadLevel(1);
    };




function loadLevel(level) {
        var ajax = new XMLHttpRequest();
        ajax.open("GET", "maps/maze3d-" + level + ".json", true);
        ajax.onreadystatechange = function() {
            if (ajax.readyState == 4) {
                map = JSON.parse(ajax.responseText);
                launch();
            }
        }
        ajax.send(null);
    }



function launch() {
        initializeScene();
        mainLoop();
    }


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

        document.getElementById("canvasContainer").appendChild(renderer.domElement);

        input = new Demonixis.Input();
        levelHelper = new Demonixis.GameHelper.LevelHelper();
        cameraHelper = new Demonixis.GameHelper.CameraHelper(camera);

        window.addEventListener("resize", function() {
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        

        var messageContainer = document.createElement("div");
        messageContainer.style.position = "absolute";
        messageContainer.style.backgroundColor = "#666";
        messageContainer.style.border = "1px solid #333";

        var message = document.createElement("h1");
        message.innerHTML = "Use Up/Down/Left/Right to control, click to continue";
        message.style.textAlign = "center";
        message.style.color = "#ddd";
        message.style.padding = "15px";
        messageContainer.appendChild(message);

        document.body.appendChild(messageContainer);

        messageContainer.style.left = (window.innerWidth / 2 - messageContainer.offsetWidth / 2) + "px";
        messageContainer.style.top = (window.innerHeight / 2 - messageContainer.offsetHeight / 2) + "px";





        window.addEventListener("click", function() {
            openFullscreen();
            document.body.removeChild(messageContainer);

        });

        var timer = setTimeout(function() {
            clearTimeout(timer);
            document.body.removeChild(messageContainer);
        }, 3500);
    }





    function openFullscreen() {
    if (elem.requestFullscreen) 
    {
        elem.requestFullscreen();
    } 
    else if (elem.mozRequestFullScreen) 
    { /* Firefox */
        elem.mozRequestFullScreen();
    }  
    else if (elem.webkitRequestFullscreen) 
    { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
    } 
    else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen();
    }}
