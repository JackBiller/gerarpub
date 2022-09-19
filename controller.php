<?php

include './funcoes.php';

if (!empty($_POST['buscarFrase'])) {
	echo file_get_contents('https://www.pensador.com/mensagens_de_reflexao/');
}

if (!empty($_POST['buscarFoto'])) {
	$search = str_replace(' ', '%20', $_POST['search']);
	echo file_get_contents('https://www.google.com.br/search?q=' . $search . '&tbm=isch&hl=pt-BR&tbs=isz:l&sa=X&ved=0CAIQpwVqFwoTCOiBi4_0h_UCFQAAAAAdAAAAABAH&biw=1663&bih=939#imgrc=en5sX10IJs5s5M');
}

if (!empty($_POST['salvarFoto'])) {
	$nome = $_POST['nome'];
	$base64 = $_POST['base64'];
	$ext = empty($_POST['ext']) ? 'png' : $_POST['ext'];
	createFile('fotos/'.$nome.'.'.$ext, base64_decode($base64));
}

if (!empty($_POST['salvarPost'])) {
	$nome = $_POST['nome'];
	$base64 = $_POST['base64'];
	$ext = empty($_POST['ext']) ? 'png' : $_POST['ext'];
	createFile('posts/'.$nome.'.'.$ext, base64_decode($base64));
}

if (!empty($_POST['buscarConfig'])) {
	echo file_get_contents('./config.json');
}

if (!empty($_POST['listarPosts'])) {
	echo toJson(listDir('./posts'));
}

?>