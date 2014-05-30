// json preview module
ckan.module('cesiumpreview', function (jQuery, _) {
  return {
    initialize: function () {
      var self = this;
	  
//      var vis_server = 'http://localhost';  //local
      var vis_server='http://nationalmap.research.nicta.com.au/';
      var ckan_server = '';   //local
//      var ckan_server = 'http://ckan.research.nicta.com.au:5000';
      var data_url = preload_resource['url'] + '?hack.geojson';
      var style = 'height: 600px; width: 100%; border: none;';
      var display = 'allowFullScreen mozAllowFullScreen webkitAllowFullScreen';

      var html = '<iframe src="' + vis_server + '?data_url=' + ckan_server + data_url + '" style="' + style + '" ' + display + '></iframe>';
      
      console.log(html);
      
      self.el.html(html);
    }
  };
});
