BlindTest
=========
Ce jeu permet de jouer au blind test avec plusieurs personnes se trouvant sur le même réseau. 
Il est composé en deux parties:
  - Le serveur : la personne gérant le serveur est celui qui va diffuser la musique aux joueurs.
  - Le(s) client(s) : ce sont les joueurs qui vont devoir deviner les musiques.
  
Le Serveur
=========

Pour commencer à jouer, le serveur doit exécuter le fichier "exe" se trouvant dans le dossier serveur. 
Une page web va s'afficher. La page est composée de deux boutons, indiquant les deux modes de jeu possible :
  - Le mode Drop : la personne gérant le serveur doit déposer un fichier mp3 dans le cadre.
  - Le mode Dossier : la personne gérant le serveur doit indiquer le chemin d'un dossier contenant de la musique. 

Le logiciel ne prend en compte que les musiques mp3.

Le Client
=========
Chaque joueur doit ouvrir le fichier  client.html se trouvant dans le dossier client. Celui-ci doit renseigner son nom, prénom et l'adresse du serveur. Celui-ci est indiqué en haut de la page web du serveur. 
Une fois tous les champs renseignés, il suffit d'attendre que le serveur diffuse la musique.


L'utilisation de ce logiciel nécessite d'avoir sur son ordinateur node.js d'installé : http://nodejs.org/
