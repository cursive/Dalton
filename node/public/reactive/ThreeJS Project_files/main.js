window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

(function() {
    function initStats()    {
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0';
        stats.domElement.style.top = '0';
        $('#stats').append(stats.domElement);
        return stats;
    };

    window.stats = initStats();
})();

(function ()    {
    window.settings = new function ()   {
        this.targetX = 0;
        this.targetY = 0;
        this.targetZ = 150;
        this.whiteBackground = true;
    };
    var gui = new dat.GUI();
    gui.add(window.settings, 'targetX', -300, 300);
    gui.add(window.settings, 'targetY', -300, 300);
    gui.add(window.settings, 'targetZ', -300, 300);
    gui.add(window.settings, 'whiteBackground');
})();

(function() {
    function loadShaderNamed(shaderName)    {
        var shader = '';
        $.ajax({
            async:      false,
            url:        '/gl/shaders/' + shaderName,
            success:    function (data) {
                shader = String(data);
            }
        });
        return shader;
    }

    /*
        Setup vars
    */

    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;

    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 1000;

    var $container = $('#container');

    /*
        Set up the renderer
    */
    var renderer = new THREE.WebGLRenderer({
        'antialias':    true
    });
    var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.z = 100;
    var scene = new THREE.Scene();
    scene.add(camera);
    renderer.setClearColor(0xFFFFFF);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMapEnabled = true;


    //  3D renderer
    $container.append(renderer.domElement);

    camera.position.x = 6;
    camera.position.y = 25;
    camera.position.z = 400;
    // camera.lookAt(scene.position);
    window.camera = camera;

    /*
        Lights
    */
    var spotLight = new THREE.SpotLight(0xFFFFFF);
    spotLight.position.set(500, 500, 500);
    scene.add(spotLight);
    window.spotLight = spotLight;

    var spotLight2 = new THREE.SpotLight(0xFFFFFF);
    spotLight2.position.set(-500, 500, -500);
    scene.add(spotLight2);

    var spotLight3 = new THREE.SpotLight(0xFFFFFF);
    spotLight3.position.set(-500, 500, 500);
    scene.add(spotLight3);

    var spotLight4 = new THREE.SpotLight(0xFFFFFF);
    spotLight4.position.set(500, 500, -500);
    scene.add(spotLight4);


    /*
        Fun
    */
  
    var images = [
        '8-02.png', 
        '7-02.png', 
        '6-02.png', 
        '5-02.png', 
        '4-02.png', 
        '3-02.png', 
        '2-02.png', 
        '1-02.png'
    ];
    
    var gap = 5;

    var filled_meshes = [];
    var clear_meshes = []

    function createMeshes(filled)   {
        for (var i = 0; i < images.length; i++) {
            var texture = THREE.ImageUtils.loadTexture('img/' + (filled ? 'filled/' : 'clear/') + images[i]);
            var geometry = new THREE.PlaneGeometry(100, 100);
            var material = new THREE.MeshBasicMaterial({
                map:            texture, 
                side:           THREE.DoubleSide,
                transparent:    true,
                opacity:        (1 / images.length)
            });
            var plane = new THREE.Mesh(geometry, material);

            plane.position.z = (-0.5 * images.length * gap) + (i * gap);

            plane.receiveShadow = false;
            scene.add(plane);

            filled && filled_meshes.push(plane);
            !filled && clear_meshes.push(plane);
        }
    }

    if (window.location.hash.indexOf('fill') != -1) {
        createMeshes(true);    
    }   else    {
        createMeshes();    
    }    


    /*
        Animation
    */
    var theta = 1.0;

    (function animationLoop()   {       

        var target = new THREE.Vector3(scene.position.x, scene.position.y, scene.position.z);
        camera.position.x = window.settings.targetX;
        camera.position.y = window.settings.targetY;
        camera.position.z = window.settings.targetZ;
        camera.lookAt(target);

        if (window.settings.whiteBackground)    {
            renderer.setClearColor(0xFFFFFF);
        }   else    {
            renderer.setClearColor(0x000000);
        }

        renderer.render(scene, camera);
        requestAnimFrame(animationLoop);
        window.stats.update();
    })();
    
})();
