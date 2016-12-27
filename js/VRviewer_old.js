/*
 * @author longvocation / longvocation@qq.com/
 * 1.use setSize to define area size first. if not set, it will use .3dmodel size to setup size by default.
 * 2.use setPath to load model data
 * 3.use exec to show model.
 * options:
 * elname,camera,ambietLight,directionalLight,sky
 */

function VRviewer(model_obj, options) {
    //use default options
    var options = {
        shadow: true,
        camera: {
            pos: [0, 50, 50]
        },
        directionalLight: {
            intensity: 0.2,
            distance: 50
        },
        control: {
            speed: 0.1
        },
        sky: {
            type: "castle"
        },
        floor: {
            name: "floor.jpg",
            pos: [0, -42, 0]
        },
        model: {
            position_delta: [-70, 0, 0],
            rotation: [-Math.PI / 2, 0, 0]
        }
    };
    // setup myobject
    var myobject = null;
    var waitingobject = (model_obj != null) ? model_obj : new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshPhongMaterial({
        color: 0xaaaa00
    }));
    // create element from HTML document
    var ElName = ((options != null) && (options.elname != null)) ? options.elname : ".3dmodel";
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

    // create camera
    //fov — Camera frustum vertical field of view.
    //aspect — Camera frustum aspect ratio.
    //near — Camera frustum near plane.
    //far — Camera frustum far plane.
    var fov = ((options != null) && (options.camera != null) && (options.camera.fov != null)) ? options.camera.fov : 60;
    var near = ((options != null) && (options.camera != null) && (options.camera.near != null)) ? options.camera.near : 1;
    var far = ((options != null) && (options.camera != null) && (options.camera.far != null)) ? options.camera.far : 2000000;
    var camera_pos = ((options != null) && (options.camera != null) && (options.camera.pos != null)) ? options.camera.pos : [0, 300, 0];
    var camera = new THREE.PerspectiveCamera(fov, sectionW / sectionH, near, far);
    camera.position.x = camera_pos[0];
    camera.position.y = camera_pos[1];
    camera.position.z = camera_pos[2];

    // create ambient and directional lights
    var ambient_color = ((options != null) && (options.ambietLight != null) && (options.camera.ambietLight.color != null)) ? options.camera.ambietLight.color : 0x444444;
    var ambient_intensity = ((options != null) && (options.ambietLight != null) && (options.ambient_intensity != null)) ? options.ambietLight.intensity : 0.5;
    var directional_color = ((options != null) && (options.directionalLight != null) && (options.directionalLight.color != null)) ? options.directionalLight.color : 0xaaaaaa;
    var directional_intensity = ((options != null) && (options.directionalLight != null) && (options.directionalLight.intensity != null)) ? options.directionalLight.intensity : 0.5;
    var directional_distance = ((options != null) && (options.directionalLight != null) && (options.directionalLight.distance != null)) ? options.directionalLight.distance : 1;
    var ambient = new THREE.AmbientLight(ambient_color, ambient_intensity);
    scene.add(ambient);
    var directionalLights = [];
    var directionalLights_pos = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)];
    for (var i = 0; i < 6; i++) {
        directionalLights[i] = new THREE.DirectionalLight(directional_color, directional_intensity);
        //directionalLights[i] = new THREE.PointLight(directional_color);
        directionalLights[i].position.x = directionalLights_pos[i].x * directional_distance;
        directionalLights[i].position.y = directionalLights_pos[i].y * directional_distance;
        directionalLights[i].position.z = directionalLights_pos[i].z * directional_distance;
        directionalLights[i].castShadow = true;
        scene.add(directionalLights[i]);
        //scene.add(new THREE.DirectionalLightHelper(directionalLights[i], 80));
    }
    var spotlight = new THREE.SpotLight((0xffffff));
    spotlight.intensity = 1;
    spotlight.castShadow = true;
    spotlight.angle = Math.PI / 4;
    spotlight.distance = 1000;
    //var spotlighthelper = new THREE.SpotLightHelper(spotlight);
    spotlight.position.z = 200;
    spotlight.position.y = 200;
    spotlight.position.x = 200;
    spotlight.rotation.x = Math.PI / 3;
    spotlight.penumbra = 0.5;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.camera.far = 2000000;
    spotlight.shadow.camera.fov = 65;
    //spotlight.shadow.camera.visible = true;
    spotlight.shadowCameraVisible = true;

    scene.add(spotlight);
    //scene.add(spotlighthelper);
    //var axisHelper = new THREE.AxisHelper(300);
    //scene.add(axisHelper);
    //console.log(axisHelper);
    // create sky effect
    var skytype = ((options != null) && (options.sky != null) && (options.sky.type != null)) ? options.sky.type : "castle";
    switch (skytype) {
    case "sun":
        create_sunsky();
        break;
    case "color":
        if (options.sky.color) scene.background = options.sky.color;
        break;
    default:
        create_skybox(options.sky.type);
    }

    // creat floor
    // FLOOR
    var water = null;
    var floor_name = ((options) && (options.floor) && (options.floor.name != null)) ? options.floor.name : "floor.jpg";

    var floorTexture = new THREE.ImageUtils.loadTexture("images/" + floor_name);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);
    var floorMaterial = new THREE.MeshPhongMaterial({
        map: floorTexture,
        side: THREE.DoubleSide,
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 0.0005,
        needsUpdate: true

    });
    //var floorGeometry = new THREE.PlaneGeometry(2000, 2000, 10, 10);
    var floorGeometry = new THREE.CylinderGeometry(2000, 2000, 1, 32);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    var pos = ((options) && (options.floor) && (options.floor.pos != null)) ? options.floor.pos : [0, 0, 0];

    //floor.rotation.x = -Math.PI / 2;
    floor.position.x = pos[0];
    floor.position.y = pos[1];
    floor.position.z = pos[2];

    scene.add(floor);
    floor.receiveShadow = true;



    // sensor lists
    var sensors = [];
    // create particle groups
    var particleGroup;
    var clock = new THREE.Clock();
    var skyBox = null;
    //create_particle();

    // create controls 
    var control_enable = ((options != null) && (options.control != null) && (options.control.enable != null)) ? options.control.enable : true;
    var control_type = ((options != null) && (options.control != null) && (options.control.type != null)) ? options.control.type : "orbit";
    var rotatespeed = ((options != null) && (options.control != null) && (options.control.speed != null)) ? options.control.speed : 0.2;
    var controls;
    switch (control_type) {
    case "orbit":
        controls = new THREE.OrbitControls(camera, container);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        //controls.maxPolarAngle = Math.PI / 2 * 0.95;
        controls.rotateSpeed = rotatespeed;
        controls.minDistance = 10.0;
        controls.maxDistance = 500.0;
        break;
    case "DeviceOrientation":
        controls = new DeviceOrientationController(camera, container);
        break;
    }

    // setup progressbar;
    setupProgressbar();

    // animation setup
    var mixers = [];

    // renderer setup
    var renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(sectionW, sectionH);

    renderer.shadowMap.enabled = true;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    animate();
    renderer.render(scene, camera);
    scene.add(waitingobject);

    //align_model_to_center(waitingobject);
    var objectLoaded_func = null;
    this.getDirectionalLights = function () {
        return directionalLights;
    }
    this.getCamera = function () {
            return camera;
        }
        // return a optons watcher for gui
    var options_watcher = null;

    this.getOptionsWatcher = function () {
            return options_watcher;
        }
        // this function depend on vue.js
    function create_options_watcher(path) {
        bind_options();
        var loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
        loader.load(path, function (text) {
            var new_options = eval('(' + text + ')');
            for (var m in new_options) {
                options[m] = new_options[m];
            }


        });


        function bind_options() {
            options_watcher = new Vue({
                data: options,
                watch: {
                    'shadow': function (val, oldVal) {
                        if (val)
                            renderer.shadowMap.enabled = true;
                        else
                            renderer.shadowMap.enabled = false;
                    },
                    'camera.pos': function (val, oldVal) {
                        if (val) {
                            camera.position.x = val[0];
                            camera.position.y = val[1];
                            camera.position.z = val[2];
                        }

                    },
                    'floor.name': function (val, oldVal) {
                        if (val) {
                            if (val == "ocean") {
                                var light = new THREE.DirectionalLight(0xffffbb, 1);
                                light.position.set(-1, 1, -1);
                                scene.add(light);
                                var waterNormals = new THREE.TextureLoader().load('images/waternormals.jpg');
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
                                    new THREE.PlaneBufferGeometry(2000, 2000), water.material);
                                mirrorMesh.add(water);
                                scene.remove(floor);
                                mirrorMesh.rotation.x = -Math.PI * 0.5;
                                floor = mirrorMesh;
                                scene.add(floor);
                                scene.remove(spotlight);


                            } else {
                                floorTexture = new THREE.ImageUtils.loadTexture("images/" + val);
                                floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
                                floorTexture.repeat.set(10, 10);
                                var floorMaterial = new THREE.MeshPhongMaterial({
                                    map: floorTexture,
                                    side: THREE.DoubleSide,
                                    roughness: 0.8,
                                    color: 0xffffff,
                                    metalness: 0.2,
                                    bumpScale: 0.0005,
                                    needsUpdate: true

                                });
                                floor.material = floorMaterial;
                            }



                        }
                    },
                    'floor.pos': function (val, oldVal) {
                        if (val) {
                            floor.position.x = val[0];
                            floor.position.y = val[1];
                            floor.position.z = val[2];
                        }

                    },
                    'directionalLight.intensity': function (val, oldVal) {
                        var dl = directionalLights;
                        if (val) {
                            for (var i = 0; i < 6; i++) {
                                dl[i].intensity = val;
                            }
                        }
                    },
                    'directionalLight.distance': function (val, oldVal) {
                        var dl = directionalLights;
                        var directionalLights_pos = [new THREE.Vector3(1, 0, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)];
                        if (val) {
                            for (var i = 0; i < 6; i++) {
                                dl[i].position.x = directionalLights_pos[i].x * val;
                                dl[i].position.y = directionalLights_pos[i].y * val;
                                dl[i].position.z = directionalLights_pos[i].z * val;
                                dl[i].lookAt(new THREE.Vector3(0, 0, 0));
                                dl[i].castShadow = true;
                            }
                        }
                    },
                    'model.position_delta': function (val, oldVal) {
                        var md = myobject;
                        if (val) {
                            md.position.x = md.position.x + val[0];
                            md.position.y = md.position.y + val[1];
                            md.position.z = md.position.z + val[2];
                        }
                    },
                    'model.rotation': function (val, oldVal) {
                        var md = myobject;

                        if (val) {

                            md.rotation.x = val[0];
                            md.rotation.y = val[1];
                            md.rotation.z = val[2];
                        }

                    },
                    'sky.type': function (val, oldVal) {

                        var imagePrefix = "background/" + val + "/";
                        var directions = ["px", "nx", "py", "ny", "pz", "nz"];
                        var imageSuffix = ".png";
                        var skyGeometry = new THREE.CubeGeometry(5000, 5000, 5000);

                        var materialArray = [];
                        for (var i = 0; i < 6; i++)
                            materialArray.push(new THREE.MeshBasicMaterial({
                                map: THREE.ImageUtils.loadTexture(imagePrefix + directions[i] + imageSuffix),
                                side: THREE.BackSide
                            }));
                        var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
                        scene.remove(skyBox);
                        skyBox = new THREE.Mesh(skyGeometry, skyMaterial);

                        console.log(skyBox);
                        scene.add(skyBox);
                    }
                }
            });
        }

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
                    console.log(child);
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
    this.loadObject = function (opath, oname, type, callback) {
        tempath = opath;
        objectLoaded_func = callback;
        switch (type) {
        case "obj":
            var mtlLoader = new THREE.MTLLoader();
            mtlLoader.setPath(opath);
            mtlLoader.load(oname + '.mtl', function (material) {
                var objLoader = new THREE.OBJLoader();
                if (material) {
                    material.preload();
                    objLoader.setMaterials(material);
                }
                objLoader.setPath(opath);
                objLoader.load(oname + '.obj', onLoad, onProgress, onLoad_Error);
            }, onProgress, onLoad_Error);
            break;
        case "collada":
            var daeloader = new THREE.ColladaLoader();
            daeloader.load(opath + oname + ".dae", onLoad, onProgress, onLoad_Error);
            break;
        case "json":
            var objectLoader = new THREE.ObjectLoader();
            objectLoader.load(opath + oname + ".json", onLoad, onProgress, onLoad_Error);
            break;
        }

        return this;
    }



    var texture = img = new THREE.ImageUtils.loadTexture('images/9452.jpg');
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
        if (model_obj) {

            if (mixers.length > 0) {
                for (var i = 0; i < mixers.length; i++) {
                    mixers[i].update(clock.getDelta());
                }
            }

        }
        waitingobject.rotateX(Math.PI / 2 / 180);
        waitingobject.rotateY(Math.PI / 2 / 180);
        //update_particle();
        update_alert();
        render();
    }

    function render() {
        if ((water) && (water.material) && (water.material.uniforms) && (water.material.uniforms.time)) {
            water.material.uniforms.time.value += 1.0 / 60.0;
            water.render();
        }
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
        obj.receiveShadow = true;


        scene.remove(waitingobject);
        if ((options) && (options.model)) {
            if (options.model.rotation) {
                var tem_obj = ((obj) && (obj.scene)) ? obj.scene : obj;
                tem_obj.rotation.x = options.model.rotation[0];
                tem_obj.rotation.y = options.model.rotation[1];
                tem_obj.rotation.z = options.model.rotation[2];
                //tem_obj.castShadow=true;
            }

        }
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
                    child.specular = 0x050505;
                }
            });
            align_model_to_center(obj.scene);
            create_mesh_watcher(get_mesh_id(obj.scene)[0]);
        } else {
            myobject = obj;
            align_model_to_center(obj);
            create_mesh_watcher(get_mesh_id(obj)[0]);
            create_MeshIDWatcher();
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {

                    child.castShadow = true;
                    //child.receiveShadow = true;
                }

            });

        }

        create_options_watcher(tempath + "options.json");

        if (objectLoaded_func) objectLoaded_func();
        /*
        if (options.model.position_delta) {
            var tem_obj = ((obj) && (obj.scene)) ? obj.scene : obj;
            tem_obj.position.x = options.model.position_delta[0];
            tem_obj.position.y = options.model.position_delta[1];
            tem_obj.position.z = options.model.position_delta[2];
            //tem_obj.castShadow=true;
        }
        */


    }

    function onLoad_Error() {

    }

    function create_sunsky() {
        // Add Sky Mesh
        var sky = new THREE.Sky();
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
            luminance: 1,
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


    function create_skybox(type) {
        var imagePrefix = "background/" + type + "/";
        var directions = ["px", "nx", "py", "ny", "pz", "nz"];
        var imageSuffix = ".png";
        var skyGeometry = new THREE.CubeGeometry(1000, 1000, 1000);

        var materialArray = [];
        for (var i = 0; i < 6; i++)
            materialArray.push(new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture(imagePrefix + directions[i] + imageSuffix),
                side: THREE.BackSide
            }));
        var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
        skyBox = new THREE.Mesh(skyGeometry, skyMaterial);

        console.log(skyBox);
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
            // for a cube:
            // sprite.position.multiplyScalar( radiusRange );
            // for a solid sphere:
            // sprite.position.setLength( radiusRange * Math.random() );
            // for a spherical shell:
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

            // particle wiggle
            // var wiggleScale = 2;
            // sprite.position.x += wiggleScale * (Math.random() - 0.5);
            // sprite.position.y += wiggleScale * (Math.random() - 0.5);
            // sprite.position.z += wiggleScale * (Math.random() - 0.5);

            // pulse away/towards center
            // individual rates of movement
            var a = particleAttributes.randomness[c] + 1;
            var pulseFactor = Math.sin(a * time) * 0.1 + 0.9;
            sprite.position.x = particleAttributes.startPosition[c].x * pulseFactor;
            sprite.position.y = particleAttributes.startPosition[c].y * pulseFactor;
            sprite.position.z = particleAttributes.startPosition[c].z * pulseFactor;
        }

        // rotate the entire group
        // particleGroup.rotation.x = time * 0.5;
        //particleGroup.rotation.y = time * 0.75;
        // particleGroup.rotation.z = time * 1.0;
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
}