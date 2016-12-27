/*
 * @author longvocation / longvocation@qq.com/
 * 1.use setSize to define area size first. if not set, it will use .3dmodel size to setup size by default.
 * 2.use setPath to load model data
 * 3.use exec to show model.
 * options:
 * elname,camera,ambietLight,directionalLight,sky
 */

function VRviewer(tem_options) {

    //use default options
    var options = {
        _pointer: this,
        elname: ".3dmodel",
        homepath: './',
        obj_path: 'models/fiat/',
        obj_name: 'Fiat500',
        obj_type: 'obj',
        shadow: true,
        camera: {
            fov: 60,
            near: 1,
            far: 2000000,
            pos: [0, 50, 50]
        },
        ambietLight: {
            color: 0x444444,
            intensity: 0.5
        },
        directionalLight: {
            color: 0xaaaaaa,
            intensity: 0.2
        },
        spotLight: {
            color: 0xffffff,
            intensity: 1
        },
        control: {
            enable: true,
            type: "orbit",
            speed: 0.1
        },
        sky: {
            blur: true,
            blurPixels: 1,
            type: "street",
            pos: [0, 0, 0]
        },
        floor: {
            visible: true,
            type: "round",
            name: "stone",
            pos: [0, -42, 0]
        },
        model: {
            pos: [-70, 0, 0],
            rotation: [-Math.PI / 2, 0, 0],
            scale: [1, 1, 1]
        },
        loadmodel: [],
        addmodel: [],
        saveoptions: "",
        loadoptions: ""
    };
    if (tem_options) {
        for (var m in tem_options) {
            for (var n in tem_options[m]) {
                if (tem_options[m][n]) {
                    if (tem_options[m][n].length>1)
                        options[m][n] = tem_options[m][n];
                    else
                        options[m]=tem_options[m];
                }
            }
        }
    }
    var homePath =  (options.homepath) ? options.homepath : './';
    var skyBox = null;
    var options_watcher = null;
    bind_options();
    // setup myobject
    var myobject = null;

    // create element from HTML document
    var ElName = options.elname;
    var container = document.createElement('div');
    $(ElName).append(container);

    // create bar element
    var barElement;
    var bar;
    var download_progress = {};
    var download_total = {};

    // get screen width and height
    var sectionW = ($(ElName).innerWidth() > 50) ? $(ElName).innerWidth() : 50;
    var sectionH = ($(ElName).innerHeight() > 50) ? $(ElName).innerHeight() : 50;

    // create scene
    var scene = new THREE.Scene();
    // 
    // create camera
    //fov — Camera frustum vertical field of view.
    //aspect — Camera frustum aspect ratio.
    //near — Camera frustum near plane.
    //far — Camera frustum far plane.
    var fov = options.camera.fov;
    var near = options.camera.near;
    var far = options.camera.far;
    var camera_pos = options.camera.pos;
    var camera = new THREE.PerspectiveCamera(fov, sectionW / sectionH, near, far);
    camera.position.x = camera_pos[0];
    camera.position.y = camera_pos[1];
    camera.position.z = camera_pos[2];

    // create ambient and directional lights
    var ambient = new THREE.AmbientLight(options.ambietLight.color, options.ambietLight.intensity);
    scene.add(ambient);
    //ambient.castShadow=true;
    var directionalLights = [];
    var directionalLights_pos = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)];
    for (var i = 0; i < 6; i++) {
        directionalLights[i] = new THREE.DirectionalLight(options.directionalLight.color, options.directionalLight.intensity);
        directionalLights[i].position.x = directionalLights_pos[i].x;
        directionalLights[i].position.y = directionalLights_pos[i].y;
        directionalLights[i].position.z = directionalLights_pos[i].z;
        //directionalLights[i].castShadow = true;
        scene.add(directionalLights[i]);
    }
    var spotlight = new THREE.SpotLight((options.spotLight.color));
    spotlight.intensity = options.spotLight.intensity;
    spotlight.castShadow = true;
    spotlight.angle = -Math.PI / 4;
    spotlight.distance = 2000;
    spotlight.decay = 1;
    spotlight.position.z = 400;
    spotlight.position.y = 400;
    spotlight.position.x = 400;
    spotlight.rotation.y = Math.PI / 3;
    spotlight.rotation.z = Math.PI / 2;
    spotlight.penumbra = 0.5;
    spotlight.shadow.mapSize.width = 512;
    spotlight.shadow.mapSize.height = 512;
    spotlight.shadow.camera.near = 1;
    //spotlight.shadow.camera.far = 2000000;
    spotlight.shadow.camera.far = 4000;
    spotlight.shadow.camera.fov = 65;
    var lightHelper = new THREE.SpotLightHelper(spotlight);
    scene.add(spotlight);
    scene.add(lightHelper);
    //scene.add( new THREE.AxisHelper( 100 ) );
    var skytype = options.sky.type;
    var skyMaterial = null;
    switch (skytype) {
    case "sun":
        create_sunsky();
        break;
    case "color":
        if (options.sky.color) scene.background = options.sky.color;
        break;
    default:
        create_skybox(options.sky.type, options.sky.blur, options.sky.blurPixels);
    }

    // creat floor
    // FLOOR
    var water = null;
    var floor_name = options.floor.name;

    var floorGeometry = null;
    switch (options.floor.type) {
    case "square":
        floorGeometry = new THREE.BoxGeometry(5000, 1, 5000);
        break;
    case "round":
        floorGeometry = new THREE.CylinderBufferGeometry(2500, 2500, 1, 64);
        break;
    }

    var floor = new THREE.Mesh(floorGeometry);
    loadTextures(floor, floor_name);

    //var output = JSON.stringify(floor.toJSON());
    //            output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
    //            saveString(output, 'stone_floor.json');
    var pos = options.floor.pos;
    floor.position.x = pos[0];
    floor.position.y = pos[1];
    floor.position.z = pos[2];

    scene.add(floor);
    floor.receiveShadow = true;
    //floor.visible=false;
    floor.visible = options.floor.visible;

    // sensor lists
    var sensors = [];

    var clock = new THREE.Clock();



    // create controls 
    var control_enable = options.control.enable;
    var control_type = options.control.type;
    var rotatespeed = options.control.speed;
    var controls;
    switch (control_type) {
    case "orbit":
        controls = new THREE.OrbitControls(camera, container);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.maxPolarAngle = Math.PI / 2 * 0.95;
        controls.rotateSpeed = rotatespeed;
        controls.minDistance = 10.0;
        controls.maxDistance = 1000.0;
        break;
    case "DeviceOrientation":
        controls = new DeviceOrientationController(camera, container);
        break;
    }



    // animation setup
    var mixers = [];

    // renderer setup
    var renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(sectionW, sectionH);

    renderer.shadowMap.enabled = options.shadow;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    //renderer.gammaInput = true;
    //renderer.gammaOutput = true;

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    animate();
    renderer.render(scene, camera);

    var objectLoaded_func = null;
    this.getDirectionalLights = function () {
        return directionalLights;
    }
    this.getCamera = function () {
            return camera;
        }
        // return a optons watcher for gui


    this.getOptionsWatcher = function () {
        return options_watcher;
    }


    function UrlExists(url) {
        var http = new XMLHttpRequest();

        http.open('HEAD', url, false);
        http.send();

        return http.status != 404;
    }

    function loadTextures(material, tname) {
        var loader = new THREE.TextureLoader();
        var map = (UrlExists(homePath + homePath + 'images/' + tname + "_color.jpg")) ? loader.loadBlur(100, homePath + homePath + 'images/' + tname + "_color.jpg") : null;
        var normalmap = (UrlExists(homePath + homePath + 'images/' + tname + "_normal.jpg")) ? loader.load(homePath + 'images/' + tname + "_normal.jpg") : null;
        var bumpmap = (UrlExists(homePath + homePath + 'images/' + tname + "_bump.jpg")) ? loader.load(homePath + 'images/' + tname + "_bump.jpg") : null;
        var aomap = (UrlExists(homePath + 'images/' + tname + "_ao.jpg")) ? loader.load(homePath + 'images/' + tname + "_ao.jpg") : null;
        var emissivemap = (UrlExists(homePath + 'images/' + tname + "_emissive.jpg")) ? loader.load(homePath + 'images/' + tname + "_emissive.jpg") : null;
        var displacementmap = (UrlExists(homePath + 'images/' + tname + "_displacement.jpg")) ? loader.load(homePath + 'images/' + tname + "_displacement.jpg") : null;
        if (map) {
            map.wrapS = map.wrapT = THREE.RepeatWrapping;
            map.repeat.set(5, 5);
        }

        if (normalmap) {
            normalmap.wrapS = normalmap.wrapT = THREE.RepeatWrapping;
            normalmap.repeat.set(10, 10);
        }
        if (bumpmap) {
            bumpmap.wrapS = bumpmap.wrapT = THREE.RepeatWrapping;
            bumpmap.repeat.set(5, 5);
        }
        if (aomap) {
            aomap.wrapS = aomap.wrapT = THREE.RepeatWrapping;
            aomap.repeat.set(10, 10);
        }
        if (emissivemap) {
            emissivemap.wrapS = emissivemap.wrapT = THREE.RepeatWrapping;
            emissivemap.repeat.set(10, 10);
        }
        if (displacementmap) {
            displacementmap.wrapS = displacementmap.wrapT = THREE.RepeatWrapping;
            displacementmap.repeat.set(10, 10);
        }
        var floorMaterial = new THREE.MeshPhongMaterial({
            map: map,
            //color: new THREE.Color("rgb(155,196,30)"),
            //emissive: new THREE.Color("rgb(7,3,5)"),
            //specular: new THREE.Color("rgb(255,113,0)"),
            specular: new THREE.Color("rgb(255,255,255)"),
            shininess: 8,
            bumpScale: 4,
            normalMap: normalmap,
            bumpMap: bumpmap,
            displacementMap: displacementmap,
            emissiveMap: emissivemap,
            aoMap: aomap,
            side: THREE.DoubleSide,
            //      color: 0xffffff,
            needsUpdate: true
        });
        material.material = floorMaterial;
        material.receiveShadow = true;
    }
    // this function depend on vue.js
    function create_options_watcher(path) {
        //bind_options();
        var loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
        loader.load(path, function (text) {
            var new_options = eval('(' + text + ')');
            for (var m in new_options) {
                options[m] = new_options[m];
            }
        });
    }



    this.getMeshIDs = function () {
        return get_mesh_id(myobject);
    }

    function get_mesh_id(object) {
        var mesh_id_list = [];
        if (!object) return mesh_id_list;
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                mesh_id_list.push(child.id);
            }
        });
        return mesh_id_list;
    }
    var mesh_id_watcher = null;
    this.getMeshIDWatcher = function () {
        return mesh_id_watcher;
    }

    function create_MeshIDWatcher() {
        var id = get_mesh_id(myobject)[0];
        mesh_id_watcher = new Vue({
            data: {
                'id': id
            },
            watch: {
                id: function (val, oldVal) {
                    var para = ['name', 'uuid', 'type', 'position', 'scale', 'rotation', 'visible'];
                    var child = myobject.getObjectById(val);
                    mesh_watcher['id'] = val;
                    for (var i = 0; i < para.length; i++) {
                        if (para[i] == 'position')
                            mesh_watcher['position'] = {
                                'x': child[para[i]]['x'],
                                'y': child[para[i]]['y'],
                                'z': child[para[i]]['z']
                            };
                        else
                        if (para[i] == 'scale')
                            mesh_watcher['scale'] = {
                                'x': child[para[i]]['x'],
                                'y': child[para[i]]['y'],
                                'z': child[para[i]]['z']
                            };
                        else
                        if (para[i] == 'rotation')
                            mesh_watcher['rotation'] = {
                                'x': child[para[i]]['x'],
                                'y': child[para[i]]['y'],
                                'z': child[para[i]]['z']
                            };
                        else
                            mesh_watcher[para[i]] = child[para[i]];
                    }
                }
            }
        });
    }

    var mesh_watcher = null;
    this.getMeshWatcher = function () {
        return mesh_watcher;
    }

    function create_mesh_watcher(id) {
        var para = ['name', 'uuid', 'type', 'position', 'visible', 'scale', 'rotation'];
        var child = myobject.getObjectById(id);
        var item = {};
        item['id'] = id;

        for (var i = 0; i < para.length; i++) {
            if (para[i] == 'position')
                item['position'] = {
                    'x': child[para[i]]['x'],
                    'y': child[para[i]]['y'],
                    'z': child[para[i]]['z']
                };
            else
            if (para[i] == 'scale')
                item['scale'] = {
                    'x': child[para[i]]['x'],
                    'y': child[para[i]]['y'],
                    'z': child[para[i]]['z']
                };
            else
            if (para[i] == 'rotation')
                item['rotation'] = {
                    'x': child[para[i]]['x'],
                    'y': child[para[i]]['y'],
                    'z': child[para[i]]['z']
                };
            else
                item[para[i]] = child[para[i]];

        }
        bind_mesh();

        function bind_mesh() {
            mesh_watcher = null;
            mesh_watcher = new Vue({
                data: item,
                watch: {
                    visible: function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.visible = val;
                    },
                    'position.x': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.position.x = val;
                    },
                    'position.y': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.position.y = val;
                    },
                    'position.z': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.position.z = val;
                    },
                    'scale.x': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);

                        child.scale.x = val;
                    },
                    'scale.y': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.scale.y = val;
                    },
                    'scale.z': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.scale.z = val;
                    },
                    'rotation.x': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.rotation.x = val;
                    },
                    'rotation.y': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.rotation.y = val;
                    },
                    'rotation.z': function (val, oldVal) {
                        var child = myobject.getObjectById(item.id);
                        child.rotation.z = val;
                    }
                }
            });
        }
    }


    var tempath = null;
    this.loadObject = function (callback) {
        if (homePath)
            tempath = homePath + options.obj_path;
        objectLoaded_func = callback;
        // setup progressbar;
        setupProgressbar();

        switch (options.obj_type) {
        case "obj":
            var mtlLoader = new THREE.MTLLoader();
            mtlLoader.setPath(tempath);
            mtlLoader.load(options.obj_name + '.mtl', function (material) {
                var objLoader = new THREE.OBJLoader();
                if (material) {
                    material.preload();
                    objLoader.setMaterials(material);
                }
                objLoader.setPath(tempath);
                objLoader.load(options.obj_name + '.obj', onLoad, onProgress, onLoad_Error);
            }, onProgress, onLoad_Error);
            break;
        case "collada":
            var daeloader = new THREE.ColladaLoader();
            daeloader.load(tempath + options.obj_name + ".dae", onLoad, onProgress, onLoad_Error);
            break;
        case "json":
            var objectLoader = new THREE.ObjectLoader();
            objectLoader.load(tempath + options.obj_name + ".json", onLoad, onProgress, onLoad_Error);
            break;
        }

        return this;
    }



    var texture = img = new THREE.TextureLoader().load(homePath + 'images/9452.jpg');
    this.createSensor = function () {
        var ret = {
            obj: null,
            para: {}
        };

        var sensor = (model_obj != null) ? model_obj : new THREE.Mesh(new THREE.BoxGeometry(3, 1, 5), new THREE.MeshPhongMaterial({
            map: texture
        }));
        scene.add(sensor);
        ret.obj = sensor;
        sensors.push(ret);
        return ret;
    }
    this.getObject = function () {
        return myobject;
    }
    this.getScene = function () {
        return scene;
    }

    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        if (myobject) {

            if (mixers.length > 0) {
                for (var i = 0; i < mixers.length; i++) {
                    mixers[i].update(clock.getDelta());
                }
            }

        }

        //update_particle();
        update_alert();
        render();
    }

    function render() {
        if ((water) && (water.material) && (water.material.uniforms) && (water.material.uniforms.time)) {
            water.material.uniforms.time.value += 1.0 / 60.0;
            water.render();
        }
        lightHelper.update();
        renderer.render(scene, camera);

    }

    function onWindowResize() {
        sectionW = ($(ElName).innerWidth() > 50) ? $(ElName).innerWidth() : 50;
        sectionH = ($(ElName).innerHeight() > 50) ? $(ElName).innerHeight() : 50;
        camera.aspect = sectionW / sectionH;
        camera.updateProjectionMatrix();
        renderer.setSize(sectionW, sectionH);

    }

    function onLoad(obj) {
        obj.castShadow = true;
        //obj.receiveShadow = true;

        // deal with collada animation and shadow
        if ((obj) && (obj.scene)) {
            myobject = obj.scene;
            obj.scene.traverse(function (child) {
                if (child instanceof THREE.SkinnedMesh) {
                    var animation = new THREE.Animation(child, child.geometry.animation);
                    animation.play();
                }
                if ((child instanceof THREE.Mesh) || (child instanceof THREE.Object3D)) {
                    child.castShadow = true;
                    //child.receiveShadow = true;
                }
            });
            align_model_to_center(obj.scene);
            options.model.scale[0] = obj.scene.scale.x;
            options.model.scale[1] = obj.scene.scale.y;
            options.model.scale[2] = obj.scene.scale.z;
            create_mesh_watcher(get_mesh_id(obj.scene)[0]);
            create_MeshIDWatcher();
            //var output = JSON.stringify(obj.scene.toJSON());
            //output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
            //saveString(output, 'floor.json');
        } else {
            myobject = obj;
            align_model_to_center(obj);
            options.model.scale[0] = obj.scale.x;
            options.model.scale[1] = obj.scale.y;
            options.model.scale[2] = obj.scale.z;
            //var output = JSON.stringify(obj.toJSON());
            //output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
            //saveString(output, 'floor.json');
            create_mesh_watcher(get_mesh_id(obj)[0]);
            create_MeshIDWatcher();
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

        }
        console.log(myobject);
        myobject.children[0].geometry.computeBoundingBox();
        console.log(myobject.children[0].geometry.boundingBox);
        scene.add(new THREE.BoundingBoxHelper(myobject.children[0], 0xffffff));
        var loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
        loader.load(tempath + "options.json", function (text) {
            var new_options = eval('(' + text + ')');
            for (var m in new_options) {
                for (var n in new_options[m]) {
                    if (new_options[m][n]) {
                        options[m][n] = new_options[m][n];
                    }
                }
            }
        });
        if (objectLoaded_func) objectLoaded_func();
    }

    function onLoad_Error() {

    }
    var sky = null;
    var sunSphere = null;

    function create_sunsky() {
        // Add Sky Mesh
        if (sunSphere) scene.remove(sunSphere);
        if (sky) scene.remove(sky);
        sky = new THREE.Sky();
        scene.add(sky.mesh);
        // Add Sun Helper
        sunSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1000, 16, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff
            })
        );
        sunSphere.position.y = -7000;
        sunSphere.visible = true;
        var effectController = {
            turbidity: 30,
            rayleigh: 2,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            luminance: 0.5,
            inclination: 0.3, // elevation / inclination
            azimuth: 0.25, // Facing front,
            sun: true
        };
        var distance = 4000;
        var uniforms = sky.uniforms;
        uniforms.turbidity.value = effectController.turbidity;
        uniforms.rayleigh.value = effectController.rayleigh;
        uniforms.luminance.value = effectController.luminance;
        uniforms.mieCoefficient.value = effectController.mieCoefficient;
        uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
        var theta = Math.PI * (effectController.inclination - 0.5);
        var phi = 2 * Math.PI * (effectController.azimuth - 0.5);
        sunSphere.position.x = distance * Math.cos(phi);
        sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
        sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
        sunSphere.visible = effectController.sun;
        sky.uniforms.sunPosition.value.copy(sunSphere.position);
        scene.add(sunSphere);
        return this;
    }



    function blurImage(materials, blurpixels) {
        for (var m in materials) {
            var t = materials[m].map.image;
            console.log(materials[m].map.image);
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            context.fillStyle = "black";
            context.fillRect(0, 0, t.width, t.height);
            context.putImageData(t, 0, 0);
            StackBlur.imageDataRGBA(t, 0, 0, t.width, t.height, 30);
            materials[m].map.image = context.getImageData(0, 0, t.width, t.height);
            console.log(materials[m].map.image);
            materials[m].needsUpdate = true;
        }
        return materials;
        //return ret;
    }

    function create_skybox(type, blur, blurpixels) {

        var imagePrefix = homePath + "background/" + type + "/";
        var directions = ["px", "nx", "py", "ny", "pz", "nz"];
        var imageSuffix = ".png";
        var materialArray = [];
        for (var i = 0; i < 6; i++) {
            var texture = null;
            if (blur) {
                texture = new THREE.TextureLoader().loadBlur(blurpixels, imagePrefix + directions[i] + imageSuffix);

            } else {
                texture = new THREE.TextureLoader().load(imagePrefix + directions[i] + imageSuffix);
            }
            materialArray.push(new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide
            }));
        }

        skyMaterial = new THREE.MeshFaceMaterial(materialArray);
        if (skyBox) {
            skyBox.material = skyMaterial;
            return;
        }
        var skyGeometry = new THREE.CubeGeometry(5000, 5000, 5000);
        skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(skyBox);
        return this;
    }

    function create_particle() {
        var particleTexture = THREE.TextureLoader('images/spark.png');

        particleGroup = new THREE.Object3D();
        particleAttributes = {
            startSize: [],
            startPosition: [],
            randomness: []
        };

        var totalParticles = 100;
        var radiusRange = 5;
        for (var i = 0; i < totalParticles; i++) {
            var spriteMaterial = new THREE.SpriteMaterial({
                map: particleTexture,
                useScreenCoordinates: false,
                color: 0xffffff
            });

            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(4, 4, 1.0); // imageWidth, imageHeight
            sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            sprite.position.setLength(radiusRange * (Math.random() * 0.1 + 0.9));

            // sprite.color.setRGB( Math.random(),  Math.random(),  Math.random() ); 
            sprite.material.color.setHSL(Math.random(), 0.9, 0.7);

            // sprite.opacity = 0.80; // translucent particles
            sprite.material.blending = THREE.AdditiveBlending; // "glowing" particles

            particleGroup.add(sprite);
            // add variable qualities to arrays, if they need to be accessed later
            particleAttributes.startPosition.push(sprite.position.clone());
            particleAttributes.randomness.push(Math.random());
        }
        particleGroup.position.z = 1;
        scene.add(particleGroup);
    }

    function update_alert() {
        var time = 4 * clock.getElapsedTime();
        var b = time % 2 - 1.0;
        for (var i = 0; i < sensors.length; i++) {
            if ((b > 0) && (sensors[i].para.alert)) sensors[i].obj.material.color = [1, 0, 0];
            if ((b < 0) && (sensors[i].para.alert)) sensors[i].obj.material.color = [0, 1, 0];
        }
    }

    function update_particle() {
        var time = 4 * clock.getElapsedTime();

        for (var c = 0; c < particleGroup.children.length; c++) {
            var sprite = particleGroup.children[c];

            var a = particleAttributes.randomness[c] + 1;
            var pulseFactor = Math.sin(a * time) * 0.1 + 0.9;
            sprite.position.x = particleAttributes.startPosition[c].x * pulseFactor;
            sprite.position.y = particleAttributes.startPosition[c].y * pulseFactor;
            sprite.position.z = particleAttributes.startPosition[c].z * pulseFactor;
        }
    }

    function setupProgressbar() {
        barElement = document.createElement('div');
        barElement.style.position = "absolute";
        barElement.style.zindex = 10000;
        $(ElName).append(barElement);
        var divx = 0;
        var divy = 0;
        var divw = $(ElName).width();
        var divh = $(ElName).height();
        barElement.style.left = divy + divw * 0.2 + "px";
        barElement.style.top = divx + divh * 0.5 + "px";
        barElement.style.width = divw * 0.6 + "px";
        bar = new ProgressBar.Line(barElement, {
            strokeWidth: 2,
            easing: 'easeInOut',
            duration: 10,
            color: '#FFEA82',
            trailColor: '#000000',
            trailWidth: 2,
            svgStyle: {
                width: '100%',
                height: '100%'
            },
            text: {
                style: {
                    color: '#999',
                    position: 'absolute',
                    right: '0',
                    top: '0px',
                    padding: 0,
                    margin: 0,
                    transform: null
                },
                autoStyleContainer: true
            }
        });
    }

    function align_model_to_center(object) {
        if ($(ElName + " > div:nth-child(3)"))
            $(ElName + " > div:nth-child(3)").remove();
        var hex = 0xffffff;
        var baxH = new THREE.BoundingBoxHelper(object, hex);
        baxH.update();
        var Cx, Cy, Cz;
        scene.add(object);

        var hex = 0x000000;
        var box = new THREE.BoundingBoxHelper(object, hex);
        box.update();
        var MD_length, MD_width, MD_height;
        MD_width = box.box.max.x - box.box.min.x;
        MD_height = box.box.max.y - box.box.min.y;
        MD_length = box.box.max.z - box.box.min.z;
        var factor = Math.max(MD_length, MD_width, MD_height);
        object.scale.x = object.scale.x * 200 / factor;
        object.scale.y = object.scale.y * 200 / factor;
        object.scale.z = object.scale.z * 200 / factor;
        box.update();
        MD_width = box.box.max.x - box.box.min.x;
        MD_height = box.box.max.y - box.box.min.y;
        MD_length = box.box.max.z - box.box.min.z;
        Cx = box.box.min.x + MD_width / 2;
        Cy = box.box.min.y + MD_height / 2;
        Cz = box.box.min.z + MD_length / 2;
        object.position.x = object.position.x - Cx;
        object.position.y = object.position.y - Cy;
        object.position.z = object.position.z - Cz;
        box.update();
    }

    function onProgress(xhr) {
        if (xhr.target) {
            download_progress[xhr.target.responseURL] = xhr.loaded;
            download_total[xhr.target.responseURL] = xhr.total;
        } else {
            download_progress[xhr.total] = xhr.loaded;
            download_total[xhr.total] = xhr.total;
        }
        var t_progress = 0,
            t_total = 0;
        for (var key in download_progress) {
            t_progress += download_progress[key];
        }
        for (var key in download_total) {
            t_total += download_total[key];
        }
        var percentComplete = t_progress / t_total;
        bar.set(percentComplete);

    }

    function bind_options() {
        options_watcher = new Vue({
            data: options,
            watch: {
                'shadow': function (val, oldVal) {
                    if (renderer)
                        renderer.shadowMap.enabled = val;
                },
                'camera.pos': function (val, oldVal) {
                    if (camera) {
                        camera.position.x = val[0];
                        camera.position.y = val[1];
                        camera.position.z = val[2];
                    }
                },
                'ambietLight.color': function (val, oldVal) {
                    if (ambient) ambient.color = val;

                },
                'ambietLight.intensity': function (val, oldVal) {
                    if (ambient) ambient.intensity = val;
                },
                'spotLight.color': function (val, oldVal) {
                    if (spotlight) spotlight.color = val;
                },
                'spotLight.intensity': function (val, oldVal) {
                    if (spotlight) spotlight.intensity = val;
                },
                'directionalLight.intensity': function (val, oldVal) {
                    var dl = directionalLights;
                    for (var i = 0; i < 6; i++) {
                        dl[i].intensity = val;
                    }
                },
                'floor.visible': function (val, oldVal) {
                    if (floor)
                        floor.visible = val;
                },
                'floor.type': function (val, oldVal) {
                    if (floor) {
                        var fg = null;
                        switch (val) {
                        case "square":
                            fg = new THREE.BoxGeometry(5000, 1, 5000);
                            break;
                        case "round":
                            fg = new THREE.CylinderBufferGeometry(2500, 2500, 1, 64);
                            break;
                        }
                        floor.geometry = fg;
                        floor.receiveShadow = true;
                    }
                },

                'floor.name': function (val, oldVal) {
                    switch (val) {
                    case "ocean":
                        var light = new THREE.DirectionalLight(0xffffbb, 1);
                        light.position.set(-1, 1, -1);
                        scene.add(light);
                        var waterNormals = new THREE.TextureLoader().load(homePath + 'images/waternormals.jpg');
                        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
                        water = new THREE.Water(renderer, camera, scene, {
                            textureWidth: 512,
                            textureHeight: 512,
                            waterNormals: waterNormals,
                            alpha: 1.0,
                            sunDirection: light.position.clone().normalize(),
                            sunColor: 0xffffff,
                            waterColor: 0x001e0f,
                            distortionScale: 50.0,
                        });
                        var mirrorMesh = new THREE.Mesh(
                            new THREE.PlaneBufferGeometry(5000, 5000), water.material);
                        mirrorMesh.add(water);
                        scene.remove(floor);
                        mirrorMesh.rotation.x = -Math.PI * 0.5;
                        floor = mirrorMesh;
                        floor.receiveShadow = true;
                        scene.add(floor);
                        //scene.remove(spotlight);
                        break;
                    default:
                        loadTextures(floor, val);

                        break;
                    }

                },
                'floor.pos': function (val, oldVal) {
                    if (floor) {
                        floor.position.x = val[0];
                        floor.position.y = val[1];
                        floor.position.z = val[2];
                    }
                },
                'model.pos': function (val, oldVal) {
                    if (myobject) {
                        myobject.position.x = val[0];
                        myobject.position.y = val[1];
                        myobject.position.z = val[2];
                    }

                },
                'model.scale': function (val, oldVal) {
                    if (myobject) {
                        myobject.scale.x = val[0];
                        myobject.scale.y = val[1];
                        myobject.scale.z = val[2];
                    }
                },
                'model.rotation': function (val, oldVal) {
                    if (myobject) {
                        myobject.rotation.x = val[0];
                        myobject.rotation.y = val[1];
                        myobject.rotation.z = val[2];
                    }
                },
                'sky.pos': function (val, oldVal) {
                    if (skyBox) {
                        skyBox.position.x = val[0];
                        skyBox.position.y = val[1];
                        skyBox.position.z = val[2];
                    }
                },
                'sky.type': function (val, oldVal) {
                    switch (val) {
                    case "sun":
                        if (skyBox) {
                            scene.remove(skyBox);
                            skyBox = null;
                        }
                        create_sunsky();
                        break;
                    case "color":
                        scene.background = val;
                        break;
                    default:
                        if (sunSphere) {
                            scene.remove(sunSphere);
                            sunSphere = null;
                        }
                        create_skybox(val, options.sky.blur, options.sky.blurPixels);
                    }
                },
                'sky.blur': function (val, oldVal) {
                    if (skyBox) {

                        scene.remove(skyBox);
                        create_skybox(options.sky.type, val, options.sky.blurPixels);
                    }
                },
                'loadmodel': function (val, oldVal) {
                    if (myobject) scene.remove(myobject);
                    console.log(options._pointer);
                    options._pointer.loadObject(val[0], val[1], val[2]);
                },
                'addmodel': function (val, oldVal) {
                    if (myobject) options._pointer.loadObject(val[0], val[1], val[2]);
                },
                'saveoptions': function (val, oldVal) {
                    if (val != "") {

                        var output = JSON.stringify(options);
                        saveString(output, val + '.json');
                    }
                },
                'loadoptions': function (val, oldVal) {
                    if (val != "") {
                        var loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
                        console.log(tempath + val + ".json");
                        loader.load(tempath + val + ".json", function (text) {
                            var new_options = eval('(' + text + ')');
                            for (var m in new_options) {
                                for (var n in new_options[m]) {
                                    if (new_options[m][n]) {
                                        options[m][n] = new_options[m][n];
                                    }

                                }

                            }
                        });
                    }
                },
                'sky.blurPixels': function (val, oldVal) {
                    if (skyBox) {
                        create_skybox(options.sky.type, options.sky.blur, val);
                    }
                }
            }
        });
    }
}