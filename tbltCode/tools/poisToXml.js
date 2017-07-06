var Mustache = require('mustache');
var fs = require('fs');

function writeXml(callback) {
    var template = '<hotspot name="{{id}}"\n' +
        'type="image"\n' +
        'url="../../resources/poicons/dummypoi.png" \n' +
        'keep="false"\n' +
        'devices="all"\n' +
        'visible="true"\n' +
        'enabled="false"\n' +
        'handcursor="true"\n' +
        'maskchildren="false"\n' +
        'zorder=""\n' +
        'zorder2="0.0"\n' +
        'capture="true"\n' +
        'children="false "\n' +
        'blendmode="normal"\n' +
        'style="slowPOI"\n' +
        'ath="{{heading}}"\n' +
        'atv="{{pitch}}"\n' +
        'edge="center"\n' +
        'ox="0"\n' +
        'oy="0"\n' +
        'zoom="false"\n' +
        'distorted="false"\n' +
        'rx="0.0"\n' +
        'ry="0.0"\n' +
        'rz="0.0"\n' +
        'details="8"\n' +
        'inverserotation="false"\n' +
        'flying="0.0"\n' +
        'width=""\n' +
        'height=""\n' +
        'scale="1.0"\n' +
        'rotate="0.0"\n' +
        'pixelhittest="false"\n' +
        'smoothing="true"\n' +
        'accuracy="1"\n' +
        'alpha="1.0"\n' +
        'autoalpha="false"\n' +
        'usecontentsize="false"\n' +
        'scale9grid=""\n' +
        'crop=""\n' +
        'onovercrop=""\n' +
        'ondowncrop=""\n' +
        'scalechildren="false"\n' +
        'mask=""\n' +
        'effect=""\n' +
        'onover=""\n' +
        'onhover=""\n' +
        'onout=""\n' +
        'ondown="mouseDown"\n' +
        'onup="mouseUp"\n' +
        'onclick=""\n' +
        'onloaded=""\n' +
        '/>\n';

    var poiFile = process.argv[2];
    var xmlFileDay = process.argv[3];
    //var xmlFileNight = process.argv[4];


    // load POIs from json
    var pois = JSON.parse(fs.readFileSync(poiFile).toString()).pointsOfInterest;
    // create xml
    var poisXml = '';
    pois.forEach(function(poi) {
        poi.id = "POI" + poi.id; //making sure the IDs are unique //make sure if you change this id, this needs to be changed in the POICollection.js file as well
        var poiXml = Mustache.render(template, poi);
        poisXml += poiXml;
    });

    // load current xml
    var oldXmlDay = fs.readFileSync(xmlFileDay).toString();
    //var oldXmlNight = fs.readFileSync(xmlFileNight).toString();


    // replace hotspots in current xml with new ones
    oldXmlDay = oldXmlDay.replace(/<!-- hotspots -->[\s\S]*?<!-- hotspots -->/g, '<!-- hotspots -->\n' + poisXml + '<!-- hotspots -->');
    //oldXmlNight = oldXmlNight.replace(/<!-- hotspots -->[\s\S]*?<!-- hotspots -->/g, '<!-- hotspots -->\n' + poisXml + '<!-- hotspots -->');

    //console.log(oldXml);

    // save xml to disk
    fs.writeFileSync(xmlFileDay, oldXmlDay);
    //fs.writeFileSync(xmlFileNight, oldXmlNight);

    callback();
}

exports.writeXml = writeXml;