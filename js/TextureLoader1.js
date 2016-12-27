Object.assign(THREE.TextureLoader.prototype, {

    loadBlur: function (blurpixels, url, onLoad, onProgress, onError) {

        var texture = new THREE.Texture();

        var loader = new THREE.ImageLoader(this.manager);
        loader.setCrossOrigin(this.crossOrigin);
        loader.setWithCredentials(this.withCredentials);
        loader.setPath(this.path);
        loader.load(url, function (image) {

            // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
            var isJPEG = url.search(/\.(jpg|jpeg)$/) > 0 || url.search(/^data\:image\/jpeg/) === 0;

            texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat;
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            context.fillStyle = "black";
            context.fillRect(0, 0, image.width, image.height);
            context.drawImage(image, 0, 0);
            
            //texture.orig_image = context.getImageData(0, 0, image.width, image.height);
            StackBlur.image(image, canvas, blurpixels, true);
            texture.image = context.getImageData(0, 0, image.width, image.height);
            texture.needsUpdate = true;

            if (onLoad !== undefined) {

                onLoad(texture);

            }

        }, onProgress, onError);

        return texture;

    }
});