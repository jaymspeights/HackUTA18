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

        if(currentMarker && !dragged && navigating){
            map.setCenter(pos,true);
        }
        currentMarker = new H.map.Marker(pos);
        map.addObject(currentMarker);

        //get the coordinates if navigating is on
        if(navigating===true){
            positionArray.push(pos);
        }
    }

    // Add event listener:
    map.addEventListener('drag', function(evt) {
        // Log 'tap' and 'mouse' events:
        if (navigating) {
            $('#autofollow_button').show();
            dragged = true;
        }
    });

    function geo_error() {
        alert("Sorry, no position available.");
    }

    let geo_options = {
        enableHighAccuracy: true
    };

    let wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);

    
    let navigating = false;
    $('#main_button').click(function () {
        if (!navigating) {
            dragged = false;
            map.setCenter(currentPosition,true);
            $('#autofollow_button').hide();
            navigating = true;
            positionArray = [];
            $(this).html('Stop Navigation');
        }
        else {
            navigating = false;
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
    })

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


});