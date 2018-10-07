module.exports = {
    getPath: function (a, b) { //when user wants to navigate from a to b

        return [a, b]; //expected return is list of points starting with a and ending with b
    },
    addPath: function (data) { //when user wants to add path to data model
        let graph = convertToGraph(data);
        if (graph)
            applyGraphToModel(graph);
    }
};

const PERCISION = 1000000;
const LAT_SCALE = 45
const LNG_SCALE = 39;
const LEFT = Math.floor(82885452/39);
const BOTTOM = Math.floor(122730852/45);
const X_MAX = Math.ceil(82890098/39) - LEFT;
const Y_MAX = Math.ceil(122733741/45) - BOTTOM;
function gpsToGrid(point) {
    let x=Math.round(Math.floor((+point.lng+180)*PERCISION)/LNG_SCALE) - LEFT;
    let y=Math.round(Math.floor((+point.lat+90)*PERCISION)/LAT_SCALE) - BOTTOM;
    return {x:x, y:y};
}



function applyGraphToModel(graph) {
    let connections = [];
    let route = {};
    for (let point of graph.path) {
        let coord = gpsToGrid(point);
        if (!route[ptoh(coord)])
            route[ptoh(coord)] = {x:coord.x, y:coord.y, time:point.timestamp};
        else if (route[ptoh(coord)].time > point.timestamp)
            route[ptoh(coord)].time = point.timestamp;
    }
    for (let i in route) {
        let q = route[i];
        let surroundings = [{x:q.x-1, y:q.y, dir:3}, {x:q.x+1, y:q.y, dir:1}, {x:q.x, y:q.y-1, dir:2}, {x:q.x, y:q.y+1, dir:0}];
        for (let n of surroundings) {
            if (route[ptoh(n)]) {
                connections.push({a:{x:q.x, y:q.y}, b:{x:n.x, y:n.y}, weight: Math.abs(n.timestamp-q.timestamp)});
            }
        }
        route[i] = undefined;
    }
    return connections;

    for(let c of graph)
    {
        let d = getDirection(c.a.x-c.b.x,c.a.y-c.b.y);
        let oldWeight = model[c.a.x][c.a.y].connection[d].weight;
        let adjustment = (((oldWeight+normalizeTime(c.time))/2)-oldWeight)/model[c.a.x][c.a.y].connection[d].frequency;
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
function convertToGraph(data) {
    for (let point of data.path)
        console.log(gpsToGrid(point));
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
    console.log("Failed to find path?", closed);
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