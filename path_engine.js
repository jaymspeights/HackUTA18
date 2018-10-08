module.exports = {
    getPath: function (a, b) { //when user wants to navigate from a to b
        let start = gpsToGrid(a);
        let finish = gpsToGrid(b);
        if (start.x < 0 || finish.x < 0 || start.x >= X_MAX || finish.x >= X_MAX || start.y < 0 || finish.y < 0 || start.y >= Y_MAX || finish.y >= Y_MAX)
            return "Out of bounds";
        let rawOutput = aStar(model, start, finish).reverse();
        let converted = [];
        for(let j of rawOutput)
        {
            converted.push(gridToGps(j));
        }
        return converted; //expected return is list of points starting with a and ending with b
    },
    addPath: function (data) { //when user wants to add path to data model
        console.log(`Recieved ${data.path.length} new data points.`);
        if (data.path.length < 2) return;
        let graph = convertToGraph(data);
        if (graph) applyGraphToModel(graph);
        let res = [];
        for (let i = 0; i < model.length; i++) {
            res[i]=[];
            for (let j = 0; j < model[i].length; j++) {
                let n = {};
                let coord = gridToGps({x:i, y:j});
                n.x = coord.lng;
                n.y = coord.lat;
                n.connection = model[i][j].connection;
                res[i].push(n);
            }
        }
        return res;
    }
};

let model;
let DEFAULT_WEIGHT = 5;

const bottom = 32.978166 + 90;
const left = -96.757722 + 180;
const top = 32.995856 + 90 - bottom;
const right = -96.743297 + 180 - left;
const X_MAX = 100;
const Y_MAX = 200;
const scale_x = X_MAX/right;
const scale_y = Y_MAX/top;
function gpsToGrid(point) {
    let x=Math.floor((+point.lng+180-left)*scale_x);
    let y=Math.floor((+point.lat+90-bottom)*scale_y);
    return {x:x, y:y};
}

function gridToGps(point) {
    let lng = point.x/scale_x+left-180;
    let lat = point.y/scale_y+right-90;
    return {lat:lat, lng:lng};
}

function initModel(default_weight) {
    model = [];
    for (let x = 0; x < X_MAX; x++) {
        model[x] = [];
        for (let y = 0; y < Y_MAX; y++) {
            model[x][y] = {connection:[{weight: default_weight, frequency:1}, {weight: default_weight, frequency:1}, {weight: default_weight, frequency:1}, {weight: default_weight, frequency:1}]};
        }
    }
}
initModel(DEFAULT_WEIGHT);

function applyGraphToModel(graph) {
    for(let c of graph)
    {
        let d = getDirection(c.a.x-c.b.x,c.a.y-c.b.y);
        let oldWeight = model[c.a.x][c.a.y].connection[d].weight;
        console.log(oldWeight)
        let adjustment = (((oldWeight+normalizeTime(c.time))/2)-oldWeight)/model[c.a.x][c.a.y].connection[d].frequency;
        console.log(adjustment);
        model[c.a.x][c.a.y].connection[d].weight = oldWeight+adjustment;
        model[c.a.x][c.a.y].connection[d].frequency++;
        d=(d+2)%4;
        model[c.b.x][c.b.y].connection[d].weight = oldWeight+adjustment;
        model[c.b.x][c.b.y].connection[d].frequency++;
    }

}
const COEF = (1/(.7*Math.sqrt(2*Math.PI)));
function normalizeTime(time)
{
    let value = COEF*Math.exp(-Math.pow((time/1000)-2,2)/(.98));
    if(time<2000)
        return value;
    else
        return 1-value;
}
function getDirection(a,b){
    if(b===1)
        return 0;
    if(a===1)
        return 1;
    if(b===-1)
        return 2;
    else
        return 3;
}

//returns a weighted graph
// [{a:{x,y}, b:{x,y}, weight:time}]
function convertToGraph(graph) {
    let connections = [];
    let route = {};
    for (let point of graph.path) {
        let coord = gpsToGrid(point);
        if (!route[ptoh(coord)])
            route[ptoh(coord)] = {x:coord.x, y:coord.y, time:point.timestamp};
        else if (route[ptoh(coord)].time > point.timestamp) {
            route[ptoh(coord)].time = point.timestamp;
        }
    }
    for (let i in route) {
        let q = route[i];
        let surroundings = [{x:q.x-1, y:q.y, dir:3}, {x:q.x+1, y:q.y, dir:1}, {x:q.x, y:q.y-1, dir:2}, {x:q.x, y:q.y+1, dir:0}];
        for (let n of surroundings) {
            if (route[ptoh(n)]) {
                connections.push({a:{x:q.x, y:q.y}, b:{x:n.x, y:n.y}, time: Math.abs(route[ptoh(n)].time-q.time)});
            }
        }
        route[i] = undefined;
    }
    return connections;
}

let MinHeap = require('min-heap');
let h_scalar = 1;
function aStar(graph, start, end) {
    let open_min = new MinHeap(function(l,r) {
        return l.f - r.f;
    });
    let open_f = {};
    let closed = [];
    let closed_f = [];
    open_min.insert(start);
    open_f[ptoh(start)] = start.f;
    start.f = 0;
    start.g = 0;
    start.h = (Math.abs(end.x - start.x) + Math.abs(end.y - start.y)) * h_scalar;
    while (open_min.size > 0) {
        let q = open_min.removeHead();
        let surroundings = [{x:q.x-1, y:q.y, dir:3}, {x:q.x+1, y:q.y, dir:1}, {x:q.x, y:q.y-1, dir:2}, {x:q.x, y:q.y+1, dir:0}];
        for (let successor of surroundings) {
            successor.parent = q;
            if (!graph[successor.x] || !graph[successor.x][successor.y]) continue;
            if (successor.x == end.x && successor.y == end.y) {
                return tracePath(successor);
            }
            successor.g = q.g + graph[q.x][q.y].connection[successor.dir].weight;
            successor.h = (Math.abs(end.x - successor.x) + Math.abs(end.y - successor.y)) * h_scalar;
            successor.f = successor.g + successor.h;
            if (open_f[ptoh(successor)] && open_f[ptoh(successor)] <= successor.f)
                continue;
            if (!closed_f[ptoh(successor)] || closed_f[ptoh(successor)] > successor.f) {
                open_min.insert(successor);
                open_f[ptoh(successor)] = successor.f;
            }
        }
        closed.push(q);
        closed_f[ptoh(q)] = q.f;
    }
    return "Could not find path";
}

function ptoh(node) {
    return node.x+'_'+node.y;
}

function tracePath(node) {
    let path = [];
    while (node) {
        path.push({x:node.x, y:node.y});
        node = node.parent;
    }
    return path;
}