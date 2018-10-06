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

    var currentPosition;
    function geo_success(position) {
        console.log("GOT AN EVENT", position);
        let pos = {lat:position.coords.latitude, lng:position.coords.longitude};
        console.log(pos)
        if (currentPosition)
            map.removeObject(currentPosition);
        map.setCenter(pos);
        map.setZoom(14);
        currentPosition = new H.map.Marker(pos);
        map.addObject(currentPosition);

        //get the coordinates if navigating is on
        if(navigating===true){
            positionArray.push(pos);
        }
    }

    function geo_error() {
        alert("Sorry, no position available.");
    }

    let geo_options = {
        enableHighAccuracy: true
    };

    let wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);

    
    let navigating = false;
    $('#nav_button').click(function () {
        if (!navigating) {
            navigating = true;
            positionArray = [];
            $(this).html('Stop Navigation');

        }
        else {
            navigating = false;
            if(positionArray.length>1){
            $.post('/post/path', {path:positionArray});}
            $(this).html('Start Navigation');
        }
    })
});