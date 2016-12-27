var options = {
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
        type: "sun"
    },
    floor: {
        name: "floor.jpg",
        pos: [0, -50, 0]
            //    pos: [0, -45, -8]
    },
    model: {
        position_delta: [-70, 0, 0],
        rotation: [-Math.PI / 2, 0, 0]
            //    rotation: [0, 0, 0]
    }
};
var option_watcher = new Vue({
    data: options,
    watch: {
        camera: function (val, oldVal) {
            myviewer.getCamera().position.x = val[0];
            myviewer.getCamera().position.y = val[1];
            myviewer.getCamera().position.z = val[2];
        },
        directionalLight: function (val, oldVal) {
            var dl = myviewer.getDirectionalLights();
            var directionalLights_pos = [new THREE.Vector3(1, 0, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0, 1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)];
            console.log(val);
            console.log(dl);
            if (val.intensity) {
                for (var i = 0; i < 6; i++) {
                    dl[i].intensity = val.intensity;
                }
            }
            if (val.distance) {
                for (var i = 0; i < 6; i++) {
                    dl[i].position.x = directionalLights_pos[i].x * val.distance;
                    dl[i].position.y = directionalLights_pos[i].y * val.distance;
                    dl[i].position.z = directionalLights_pos[i].z * val.distance;
                    dl[i].lookAt(new THREE.Vector3(0, 0, 0));
                    dl[i].castShadow = true;
                }
            }
        },
        model: function (val, oldVal) {
            var md = myviewer.getObject();
            console.log(val);
            if (val.position_delta) {
                md.position.x = md.position.x + val.position_delta[0];
                md.position.y = md.position.y + val.position_delta[1];
                md.position.z = md.position.z + val.position_delta[2];
            }

        }
    }
});