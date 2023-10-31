(function(){
  "use strict";
  function convertImage(img){
    "use strict";
    function componentToHex(c) {
      var hex = parseInt(c).toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }
    function getColor(r,g,b,a){
      a = parseInt(a);
      if ( a === undefined || a === 255 ) { return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b); }
      if ( a === 0 ) { return false; }
      return 'rgba('+r+','+g+','+b+','+(a/255)+')';
    }
    function makePathData(x,y,w) { return ('M'+x+' '+y+'h'+w+''); }
    function makePath(color,data) { return '<path stroke="'+color+'" d="'+data+'" />\n'; }
    function colorsToPaths(colors){
      var output = ""; 
      Object.keys(colors).forEach(function(colorKey){
          var colorValues = colors[colorKey];
          var color = getColor.apply(null, colorKey.split(','));
          if (color === false) { return; }
          var paths = [];
          var curPath;
          var w = 1;
  
          colorValues.forEach(function(value){
              if (curPath && value[1] === curPath[1] && value[0] === (curPath[0] + w)) {
                  w++;
              } else {
                  if (curPath) {
                      paths.push(makePathData(curPath[0], curPath[1], w));
                      w = 1;
                  }
                  curPath = value;
              }
          });
          paths.push(makePathData(curPath[0], curPath[1], w));
          output += makePath(color, paths.join(''));
      });
      return output;
  }  
    var getColors = function(img) {
      var colors = {},
          data = img.data,
          len = data.length,
          w = img.width,
          h = img.height,
          x = 0,
          y = 0,
          i = 0,
          color;
      for (; i < len; i+= 4) {
        if ( data[i+3] > 0 ) {
          color = data[i]+','+data[i+1]+','+data[i+2]+','+data[i+3];
          colors[color] = colors[color] || [];
          x = (i / 4) % w;
          y = Math.floor((i / 4) / w);
          colors[color].push([x,y]);
        }                      
      }
      return colors;
    }
    var colors = getColors(img),
        paths = colorsToPaths(colors),
        output = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 '+img.width+' '+img.height+'" shape-rendering="crispEdges">\n<metadata>Made with p5paint by PxPushers</metadata>\n' + paths + '</svg>';
    return output;
  };
  function showOutput(output,fileName) {
    var outputDiv = document.getElementById('output');
    var fileSize = function(str) {
      var bytes = encodeURI(str).split(/%..|./).length - 1;
      if ( bytes === 0 ) return 0;
      var sizes = ['bytes', 'kb', 'mb'],
          i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024))),
          size = bytes / Math.pow(1024, i);
      return (Math.round(size * 100) / 100) + ' ' + sizes[i];
    };
    var downloadLink = function(output,fileName) {
      return '<a href="data:Application/octet-stream,'+ encodeURIComponent(output) +'" download="'+fileName+'.svg">Download SVG</a>';
    }
    outputDiv.innerHTML = '<figure class="output">' + downloadLink(output,fileName) + '<figcaption class="output__details"><em class="output__size">Output size: ' + fileSize(output) + '</em></figcaption></figure>';
  }
  function imageToData(img) {
    var canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d"),
        width = img.width,
        height = img.height;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img,0,0);
    return ctx.getImageData(0,0,width,height);
  }
  function generateTimestamp() {
    return new Date().toISOString().replace(/[:\-T]/g, '').split('.')[0];
  }
  function px2svg(imgData) {
    var converted = convertImage(imgData);
    let timestamp = generateTimestamp();
    showOutput(converted, timestamp);
  }
  window.px2svg = px2svg;
  window.imageToData = imageToData;
}());