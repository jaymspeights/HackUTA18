//
module.exports = {
    getPath: function (a, b) { //when user wants to navigate from a to b

        return [a, b]; //expected return is list of points starting with a and ending with b
    },
    addPath: function (path) { //when user wants to add path to data model
        console.log(path);
    }
};