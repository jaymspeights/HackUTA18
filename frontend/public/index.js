$(() => {
    //Step 1: initialize communication with the platform
    var platform = new H.service.Platform({
        app_id: 'hBKWpC8wTfRmbT3BK7K5',
        app_code: 'GJYEGVy5GjJtzvPt613Yew',
        useHTTPS: true
    });
    var pixelRatio = window.devicePixelRatio || 1;
    var defaultLayers = platform.createDefaultLayers({
        tileSize: pixelRatio === 1 ? 256 : 512,
        ppi: pixelRatio === 1 ? undefined : 320
    });

    //Step 2: initialize a map  - not specificing a location will give a whole world view.
    map = new H.Map(document.getElementById('map_container'),
        defaultLayers.normal.map, {pixelRatio: pixelRatio});

    //Step 3: make the map interactive
    // MapEvents enables the event system
    // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
    var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

    // Create the default UI components
    var ui = H.ui.UI.createDefault(map, defaultLayers);

    var positionArray = [];

    var currentMarker;
    var currentPosition;
    var dragged = false;
    function geo_success(position) {
        console.log("GOT AN EVENT", position);
        let pos = {lat:position.coords.latitude, lng:position.coords.longitude};
        console.log(pos)
        currentPosition = pos;
        if (!currentMarker) {
            map.setCenter(pos,true);
            map.setZoom(14);
        } else {
            map.removeObject(currentMarker);
        }

        if(currentMarker && !dragged && blazing){
            map.setCenter(pos,true);
        }
        currentMarker = new H.map.Marker(pos);
        map.addObject(currentMarker);

        //get the coordinates if blazing is on
        if(blazing===true){
            positionArray.push(pos);
        }
    }

    // // Add event listener:
    map.addEventListener('drag', function(evt) {
        // Log 'tap' and 'mouse' events:
        if (blazing) {
            $('#autofollow_button').show();
            dragged = true;
        }
    }, false);

    map.addEventListener('tap', function(evt) {
        var icon = new H.map.Icon('finish_image.png');
        let coord = map.screenToGeo(evt.currentPointer.viewportX,
            evt.currentPointer.viewportY);
        let marker =  new H.map.Marker(coord, { icon: icon });
        marker.draggable = true;
        map.addObject(marker);

        // disable the default draggability of the underlying map
        // when starting to drag a marker object:
        map.addEventListener('dragstart', function(ev) {
            let target = ev.target;
            if (target instanceof H.map.Marker) {
                behavior.disable();
            }
        }, false);


        // re-enable the default draggability of the underlying map
        // when dragging has completed
        map.addEventListener('dragend', function(ev) {
            var target = ev.target;
            if (target instanceof mapsjs.map.Marker) {
                behavior.enable();
            }
        }, false);

        // Listen to the drag event and move the position of the marker
        // as necessary
        map.addEventListener('drag', function(ev) {
            var target = ev.target,
                pointer = ev.currentPointer;
            if (target instanceof mapsjs.map.Marker) {
                target.setPosition(map.screenToGeo(pointer.viewportX, pointer.viewportY));
            }
        }, false);S
    });

    function geo_error() {
        alert("Sorry, no position available.");
    }

    let geo_options = {
        enableHighAccuracy: true
    };

    let wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);


    let blazing = false;
    $('#main_button').click(function () {
        if (!blazing) {
            dragged = false;
            map.setCenter(currentPosition,true);
            $('#autofollow_button').hide();
            blazing = true;
            positionArray = [];
            $(this).html('Stop Navigation');
        }
        else {
            blazing = false;
            if(positionArray.length>1){
            $.post('/post/path', {path:positionArray});
            currentMarker = false;
            dragged = false;}
            $(this).html('Start Navigation');
        }
    })
    $('#autofollow_button').click(function () {
        dragged = false;
        map.setCenter(currentPosition,true);
        $(this).hide();
    });

    function drawPath(points) {
        // Initialize a linestring and add all the points to it:
        var linestring = new H.geo.LineString();
        points.forEach(function(point) {
            linestring.pushPoint(point);
        });

        // Initialize a polyline with the linestring:
        var polyline = new H.map.Polyline(linestring, {
            style: { lineWidth: 10 },
            arrows: { fillColor: 'white', frequency: 2, width: 0.8, length: 0.7 }
        });

        // Add the polyline to the map:
        map.addObject(polyline);

        // Zoom the map to make sure the whole polyline is visible:
        map.setViewBounds(polyline.getBounds());
    }

    function enterNavMode(points) {

    }
});