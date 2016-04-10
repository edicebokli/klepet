function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlikaHttp = sporocilo.indexOf('http://') > -1;
  var jeSlikaHttps = sporocilo.indexOf('https://') > -1;
  var jeSlikaGif = sporocilo.indexOf('.gif') > -1;
  var jeSlikaPng = sporocilo.indexOf('.png') > -1;
  var jeSlikaJpg = sporocilo.indexOf('.jpg') > -1;
  var jeVideo = sporocilo.indexOf('https://www.youtube.com/embed/') > -1;
  
  if (!jeSmesko && (jeSlikaHttp || jeSlikaHttps) && jeSlikaGif) {
    sporocilo = sporocilo.split('/\</g').join('&lt;').split('/\>/g').join('&gt;').split('&lt;img').join('<img').split('gif\' /&gt;').join('gif\' />');
    return $('<div class = "slika" style="font-weight: bold"></div>').html(sporocilo);
  }
  if (!jeSmesko && (jeSlikaHttp || jeSlikaHttps) && jeSlikaPng) {
    sporocilo = sporocilo.split('/\</g').join('&lt;').split('/\>/g').join('&gt;').split('&lt;img').join('<img').split('png\' /&gt;').join('png\' />');
    return $('<div class = "slika" style="font-weight: bold"></div>').html(sporocilo);
  }
  if (!jeSmesko && (jeSlikaHttp || jeSlikaHttps) && jeSlikaJpg) {
    sporocilo = sporocilo.split('/\</g').join('&lt;').split('/\>/g').join('&gt;').split('&lt;img').join('<img').split('jpg\' /&gt;').join('jpg\' />');
    return $('<div class = "slika" style="font-weight: bold"></div>').html(sporocilo);
  }

  if(jeVideo){
    sporocilo = sporocilo.replace('&lt;iframe', '<iframe').replace('&lt;/iframe;&gt;', '</iframe>').replace('allowfullscren;&gt', 'allowfullscreen>');
    return $('<div class="youtube" style="font-weight: bold"></div>').html(sporocilo);

  }
  if (jeSmesko) {
    sporocilo = sporocilo.split('/\</g').join('&lt;').split('/\>/g').join('&gt;').split('&lt;img').join('<img').split('png\' /&gt;').join('png\' />')
    return $('<div class="smesko" style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = najdiPovezaveSlik(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajVideo(sporocilo);

  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

function najdiPovezaveSlik(vhod) {
    var text = [];
    text = vhod.split(" ");
    for(var i = 0; i<text.length; i++){
      var jpg = text[i].indexOf('.jpg') > -1;
      var png = text[i].indexOf('.png') > -1;
      var gif = text[i].indexOf('.gif') > -1;
      if(jpg || png || gif){
        text[i] = text[i].replace('http://', '<img width="200" src=\'http://');
        text[i] = text[i].replace('https://', '<img width="200" src=\'https://');
      }
      text[i] = text[i].replace('.png', '.png\' />');
      text[i] = text[i].replace('.jpg', '.jpg\' />');
      text[i] = text[i].replace('.gif', '.gif\' />');
    }
    vhod = text.join(" ");
    
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  
  socket.on('dregljaj', function(rezultat){
    if(rezultat && trenutniVzdevek!=rezultat.vzdevek){
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      setTimeout(function(){$('#vsebina').trigger('stopRumble');}, 1500);
    }
  });
  
  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    $('#seznam-uporabnikov div').click(function() {
      var sporocilo = $('#poslji-sporocilo');
      sporocilo.val('/zasebno "'+ $(this).text()+'" ');
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
function dodajVideo(sporocilo){
  sporocilo = sporocilo.split('https://www.youtube.com/watch?v=').join('<iframe width="200" height="150" src="https://www.youtube.com/embed/');
  var besede = [];
  besede = sporocilo.split(' ');
  for(var i = 0; i<besede.length; i++){
    if(besede[i].indexOf('src="https://www.youtube.com/embed/') > -1){
      besede[i] += "\" allowfullscreen></iframe>";
    }
  }
  sporocilo = besede.join(' ');
  return sporocilo;
}
