var links = [];

// check to see if we already have a link queue saved, if so assign it to links array

var update_links = function(){
  chrome.storage.sync.get('link_queue', function(obj){
    if(obj.link_queue != null){
      links = obj.link_queue;
      console.log(links);
      if(links.length > 0) {
        links.forEach(function(link, i, array){
          add_to_list(link);
        });        
      }

      console.log("links length: " + links.length);

    }
  });

}

update_links();


// grabbin elements
var link_input = document.getElementById('gtrf_link_to_add');
var rate_input = document.getElementById('gtrf_rate');
var import_input = document.getElementById("gtrf_import_input")
var add_button = document.getElementById('gtrf_add');
var fire_button = document.getElementById('gtrf_fire');
var clear_button = document.getElementById('gtrf_clear');
var export_button = document.getElementById('gtrf_export');
var import_button = document.getElementById('gtrf_import');
var import_submit_button = document.getElementById('gtrf_import_submit');
var status_div = document.getElementById('gtrf_status_message');
var add_list_div = document.getElementById('gtrf_add_list');
var import_input_div = document.getElementById("gtrf_import_input_div");

// init stuff

import_input_div.style.display = 'none';


// gee i wonder what this does
var add_to_queue = function() {
  var link  = link_input.value;
  // validation

  if(validate_link(link) == false){
    return;
  }  

  // reads the text from the link input box and adds it to our links array
  links.push(link);

  // overwrites stored links array with new links array
  chrome.storage.sync.set({link_queue: links}, function(){
    console.log("link queue set");
  });

  // lets the user know their shit twerks
  set_status("loaded " + link);

  // add the link to the list so the user knows wtf they got goin, and
  // reset the input field
  add_to_list(link);
  link_input.value = "";

}

// weak ass validation for now
var validate_link = function(link) {
  switch(link){
    case (link == ""):
      console.log("link failed is \"\"");
      return false;
    case (link == null):
      console.log("link failed null link");
      return false;
    //case (link.substring(1,4) == "http"):
    //  return true;
    case (!link):
      return false;
    default:
      return true;
  }
}



// begins loading shit into the playlist
var fire_queue = function() {
  if(links) {
    console.log("fire_queue links: ");
    console.log(links);



    // get the fire rate, minimum 500ms, default 1000ms
    // if user dips below 500 we put them at default
    

    switch(rate_input.val) {
      case (rate_input.val < 500):
        rate = 1000;
        break;
      case (!rate_input.val):
        rate = 1000;
        break;
      case (rate_input.val >= 500):
        rate = rate_input.val;
      default:
        rate = 1000;
        break;
    }
      

    console.log("links length: " + links.length);
    links.forEach(function(link, i, array){
      setTimeout(function(){
        var temp_link = link;        
        if(validate_link(temp_link)){
          console.log("temp_link: "); console.log(temp_link);
          send_link(temp_link);  
        }   
        

      }, i*rate);
      console.log("temp_rate:"); console.log(rate);
      console.log("i: "); console.log(i);

    });
  
    

  }
  // turn clear queue on to destroy list every time
  //clear_queue();
}

var send_link = function(link){
  if(validate_link(link) == false) { return; }

  console.log("send_link link:");
  console.log(link);
  // chrome needs to know what tab we're using, we only use
  // the active tab so it's always gonna be the id of tab[0] in this query
  var id;
  chrome.tabs.query(
    {currentWindow: true, active: true},
    function(tabArray) { id = tabArray[0].id; }

  );

  // send in the injected code
  chrome.tabs.executeScript({file:"/tubes_fire.js"}, function(){
    // tell injected code what our links our
    chrome.tabs.sendMessage(id, {link: link}, function(){
      console.log("link sent");
    });

  });

}



// clears out local storage of the link queue and reloads the extension
var clear_queue = function() {

  chrome.storage.sync.clear(function(){
    if(chrome.runtime.lastError){
      console.log(chrome.runtime.lastError);
    } else {
      console.log("Cleared Successfully");
      set_status('Cleared Successfully');
    }

    chrome.runtime.reload();

  });

}

// tells user info like hay ur shit broek, does not save prior messages
var set_status = function(content) {
  while(status_div.lastChild){
    status_div.removeChild(status_div.lastChild);
  }

  var text_node = document.createTextNode(content);

  status_div.appendChild(text_node);
}

// this list collects all the shitty vids the user adds and puts them down
// below the buttons so they dont get confused and lose their minds
var add_to_list = function(content) {
  var list_elem = document.createElement('span');
  var text_node = document.createTextNode(content);
  var br = document.createElement("br");

  list_elem.setAttribute("class", "add_list_elem");

  list_elem.onclick=function(){
    var local_link = content;
    //var link_list = [local_link];
    send_link(local_link, 500);
  }

  list_elem.appendChild(text_node);
  add_list_div.appendChild(list_elem);
  add_list_div.appendChild(br);
}

var export_list = function(){
  update_links();
  download_json('gtrf_list.json', JSON.stringify(links));
}

var toggle_import = function(){
  if(import_input_div.style.display == 'block') {
    import_input_div.style.display = 'none';
  } else {
    import_input_div.style.display = 'block';
  }


}

var parse_import = function(){
  var data = JSON.parse(import_input.value);

  data.forEach(function(link, i, array){
    if(validate_link(link)==true){
      link_input.value = link;
      add_to_queue();
    }
  });

  import_input.value = "";
  import_input_div.style.display = "none";

}

var add_link_keyup = function(event){
  var key_code = event.keyCode ? event.keyCode : event.which;
  if(key_code == 13){
    add_to_queue();
  }
}

var import_input_keyup = function(event){
  var key_code = event.keyCode ? event.keyCode : event.which;
  if(key_code == 13){
    parse_import(); 
  }
}

var get_playlist = function(name, callback) {
    
    get_playlists(function(playlists){
      for (var playlist in playlists) {
        if (playlist.name == name) {
          callback(playlist);
          break;
        }
      }
    });      
}

var get_playlists = function(callback){
  chrome.storage.sync.get('playlists', function(obj){
    if(obj.playlists){
      playlists = obj.playlists;
      //console.log(JSON.stringify(playlists));

      callback(playlists);
    }
  });

}

var get_playlist_names = function(callback){
  get_playlists(function(playlists){
    var playlist_names = [];
    for(var playlist in playlists){
      if(playlist.name){
        playlist_names.push(playlist);
      }
    }
    callback(playlist_names);
  });
}

var make_json_playlist = function(callback) {
  chrome.storage.sync.get('link_queue', function(obj){
    if(obj.link_queue != null){
      var playlist = obj.link_queue;
      console.log("making json playlist... ");      
      callback(JSON.stringify(playlist));
    }
  });
}

var make_playlist = function(callback) {
  chrome.storage.sync.get('link_queue', function(obj){
    if(obj.link_queue != null){
      var playlist = obj.link_queue;
      console.log("making playlist... ");      
      callback(playlist);
    }
  });
}


var save_playlist = function(name){
  make_json_playlist(function(playlist){

    var new_playlist = {
      name: name,
      playlist: playlist
    }

    get_playlists(function(playlists){

      playlists[name] = playlist;

      chrome.storage.sync.set({playlists: playlists}, function(){
        console.log("playlist saved");
      });
    });

    
  });  

}

var load_playlist = function(name){
  get_playlist(name, function(playlist){
    chrome.storage.sync.set({link_queue: playlist}, function(){
      update_links();
    });
  });
}



// third party

var download_json = function(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

add_button.onclick = add_to_queue;
fire_button.onclick = fire_queue;
clear_button.onclick = clear_queue;
export_button.onclick = export_list;
import_button.onclick = toggle_import;
import_submit_button.onclick = parse_import;
