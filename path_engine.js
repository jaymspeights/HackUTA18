module.exports = {
    getPath: function (a, b) { //when user wants to navigate from a to b

        return [a, b]; //expected return is list of points starting with a and ending with b
    },
    addPath: function (path) { //when user wants to add path to data model
        console.log(path);
    }
};

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