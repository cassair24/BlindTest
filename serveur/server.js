var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var id3 = require('id3js');
var clients = new Array();
var clis = new Array();
var listeMusiques = new Array();
var identifiants = 0;

var artiste;
var musique;
var album;

var MODE;
var numMusique;
var nbMusique;
var nbMusiqueDrop;

var nbfinLecture = 0;

app.use(express.static(__dirname + '/public'));
io.set('log level', 0);
app.use("/scripts", express.static(__dirname + '/js/'));
app.use("/css", express.static(__dirname + '/css/'));
app.use("/fonts", express.static(__dirname + '/fonts/'));

// Chargement de la page index.html
app.get('/', function(req, res) {
    res.sendfile('index.html');
});

io.sockets.on('connection', function(socket) {

    socket.on('mode', function(mode) {
        console.log("MODE " + mode);
        MODE = mode;
    });


    /*===========================================================CLIENT==========================================================*/
    socket.on('AffichageEcranDuJeu', function() {
        nbMusiqueDrop = 0;
        for (var i = 0; i < clis.length; i++) {
            io.sockets.socket(clis[i].id).emit('AffichageEcranDuJeu');
        }
    });

    socket.on('nouveau', function(nom, prenom) {
        socket.nom = nom;
        socket.prenom = prenom;
        socket.identifiant = identifiants;
        socket.score = 0;
        socket.temps = 0;
        socket.emit('addId', identifiants);

        identifiants++;
        clis.push(socket);
        sendallclients();
    });

    socket.on('proposition', function(tmps) {
        io.sockets.emit('stop');
        io.sockets.emit('reponse', socket.nom, socket.prenom, socket.identifiant, tmps);
    });

    socket.on('finreponse', function(id) {
        io.sockets.emit('finreponse', id)
    });

    socket.on('endDrop', function() {
        sendClassement();
    });

    socket.on('addPoint', function(id, tmps) {
        for (var i = 0; i < clis.length; i++) {
            if (clis[i].identifiant == id) {
                clis[i].score++;
                clis[i].temps += tmps;
                break;
            }

        }
        io.sockets.emit('addPoint', id);
        //io.sockets.emit('historique', artiste, musique);
        sendallclients();

        if (MODE == "dossier") {
            if (numMusique != nbMusique) {
                setTimeout(function() {
                    io.sockets.emit('historique', artiste, musique);
                    playMusique(numMusique);
                }, 3000);
            } else {
                sendClassement();
            }
        }

    });

    socket.on('disconnect', function(client) {

        socket.broadcast.emit('deleteplayer', socket.identifiant);
        clis.splice(clis.indexOf(socket), 1);
        //clients.splice(clients.indexOf(client),1);
    });

    socket.on('finlecture', function() {
        if (nbfinLecture < 1) {
            nbfinLecture++;
            if (MODE == "dossier") {
                if (numMusique != nbMusique) {
                    setTimeout(function() {
                        playMusique(numMusique);
                    }, 3000);
                } else {
                    sendClassement();
                }
            }
            io.sockets.emit('historique', artiste, musique);
        }

    });



    /*===========================================================INTERFACES WIFI==========================================================*/

    socket.on('add', function(client) {
        var os = require('os');
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family == 'IPv4' && details.internal == false) {
                    if (details.address.indexOf("192.168.0.") > -1 || details.address.indexOf("192.168.1.") > -1) {
                        console.log(dev + ' ' + details.address + ' ' + details.internal);
                        socket.emit('adresse', details.address);
                    }

                }
            });
        }
    });

    /*===========================================================FICHIERS==========================================================*/


    socket.on('clean', function() {
        console.log('Clean !!!! ');
        fs.readdir(__dirname + '\\public\\', function(err, list) {
            list.forEach(function(file) {
                fs.unlink(__dirname + '\\public\\' + file, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('successfully deleted ' + file);
                });
            });
        });
    });


    /*===========================================================Lecture==========================================================*/

    socket.on('stop', function() {
        socket.broadcast.emit('stop');
    });

    socket.on('loading', function() {
        socket.broadcast.emit('loading');
    });

    socket.on('play', function() {
        socket.broadcast.emit('play');
    });

    socket.on('playSansChrono', function() {
        socket.broadcast.emit('playSansChrono');
    });


    /*===========================================================DOSSIER==========================================================*/

    function Fichier() {
        // always initialize all instance properties
        this.path;
        this.artist;
        this.titre;
        this.album;
    }

    // export the class
    module.exports = Fichier;
    socket.on('loadfiles', function(path) {
        listeMusiques = new Array();
        numMusique = 0;

        var i = 1;
        var j = 1;
        fs.readdir(path, function(err, list) {
            if (err) {
                io.sockets.emit('loadfilesFailed', "Le dossier n'existe pas !");
            } else {
                //nbMusique = list.length;
                list.forEach(function(file) {

                    var fichier = new Fichier();
                    var chemin = path + "\\" + file;
                    fichier.path = chemin;
                    id3({
                        file: chemin,
                        type: id3.OPEN_LOCAL
                    }, function(err, tags) {
                        if (file.indexOf(".mp3") > -1) {
                            fichier.artist = tags.artist;
                            fichier.titre = tags.title;
                            fichier.album = tags.album;
                            listeMusiques.push(fichier);
                            listeMusiques = shuffle(listeMusiques);
                            i++;
                        }
                        if (j == list.length) {
                            if (i > 1) {
                                nbMusique = i - 1;
                                io.sockets.emit('loadfilesSuccess');
                                addMusique(fichier, i, list.length);
                            } else {
                                io.sockets.emit('loadfilesFailed', "Le dossier ne contient pas de musique");
                            }
                        }
                        j++;
                    });


                });
            }

        });
    });

});
server.listen(8080);

function addMusique(fichier, i, size) {
    for (var i = 0; i < listeMusiques.length; i++) {
        io.sockets.emit('addMusique', i, listeMusiques[i].artist, listeMusiques[i].titre);
    }

    playMusique(numMusique);

}

function playMusique(i) {
    musique = listeMusiques[i].titre;
    artiste = listeMusiques[i].artist;
    album = listeMusiques[i].album;
    io.sockets.emit('colorMusic', i);
    var file = fs.createReadStream(listeMusiques[i].path);
    nbfinLecture = 0;
    for (var i = 0; i < clients.length; i++) {
        io.sockets.emit('AffichageEcranDuJeu');
        clients[i].send(file);
    }
    numMusique++;
}

function sendallclients() {
    clis.sort(function(a, b) {
        return b.score - a.score
    });
    io.sockets.emit('cleanplayers');
    for (var i = 0; i < clis.length; i++) {
        io.sockets.emit('newplayer', clis[i].nom, clis[i].prenom, clis[i].identifiant, clis[i].score, clis[i].temps);
    }
}

function sendClassement() {
    clis.sort(function(a, b) {
        return b.score - a.score
    });
    for (var i = 0; i < clis.length; i++) {
        io.sockets.emit('classement', clis[i].nom, clis[i].prenom, clis[i].identifiant, clis[i].score, clis[i].temps);
    }
}

function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};




/*===========================================================STREAMING==========================================================*/
var BinaryServer = require('binaryjs').BinaryServer;

var localisdelete = false;
// Start Binary.js server
var server = BinaryServer({
    port: 9000
});
// Wait for new user connections
server.on('connection', function(client) {
    clients.push(client);

    client.on('close', function() {
        clients.splice(clients.indexOf(client), 1);
    });
    client.on('stream', function(stream, meta) {
        /*if (!localisdelete) {
            localisdelete = true;
            clients.splice(clients.indexOf(client), 1);
        }*/
        var nom = __dirname + '/public/' + meta.name;
        /*fs.exists(__dirname + '\\public\\' + meta.name, function(exists) {
            if (!exists) {*/
                console.log(__dirname + '\\public\\' + meta.name);
                if (meta.name.indexOf(".mp3") > -1) {
                    var file = fs.createWriteStream(__dirname + '\\public\\' + meta.name);
                    stream.pipe(file);
                    stream.writable;
                    //
                    // Send progress back
                    stream.on('data', function(data) {
                        stream.write({
                            rx: data.length / meta.size
                        });
                    });

                    stream.on('end', function() {
                        console.log("nb drop : " + nbMusiqueDrop);
                        if (MODE == 'drop' && nbMusiqueDrop > 0 && nbfinLecture < 1) {
                            io.sockets.emit('historique', artiste, musique);
                        }

                        nbfinLecture = 0;

                        var file = fs.createReadStream(nom);
                        id3({
                            file: nom,
                            type: id3.OPEN_LOCAL
                        }, function(err, tags) {
                            musique = tags.title;
                            artiste = tags.artist;
                            album = tags.album;
                            console.log("Artiste :" + tags.artist);
                            console.log("Titre :" + tags.title);
                            console.log("Album :" + tags.album);
                            io.sockets.emit('infosMP3', artiste, musique, album);
                            for (var i = 0; i < clients.length; i++) {
                                clients[i].send(file);
                            }
                        });
                        setTimeout(function() {
                            stream.destroy();
                            fs.unlinkSync(nom);
                        }, 6000);

                        nbMusiqueDrop++;

                   });
                } else {
                    io.sockets.emit('alerteFormat');
                }
           /* }
            else {
                io.sockets.emit('alerteExist');
            }
        });*/

    });
});
