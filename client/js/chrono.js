var worker = new Worker('doWork.js');

worker.addEventListener('message', function(e) {
  chrono()
}, false);
function chrono(){
mille++; //incrémentation des dixièmes de 1
if (mille>9){mille=0;secon++; temps--;donut(temps,((minu*60)+secon));} 
if (secon>59){secon=0;minu++}

document.getElementById("milles").innerHTML= mille;
document.getElementById("secondes").innerHTML= secon;
document.getElementById("minutes").innerHTML= minu;
if(continuerChrono)
  setTimeout('chrono()',100);
}