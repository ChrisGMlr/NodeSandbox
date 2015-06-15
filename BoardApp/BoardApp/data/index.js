(function (data) {
    var seedData = require("./seedData");
    data.getNoteCategories = function (next) {
        next(null, seedData.initalNotes);
    };
})(module.exports);