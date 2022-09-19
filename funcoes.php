<?php

class PadraoObjeto {
	var $debug = 'OK';
	public function get($nome_campo) {
		return $this->$nome_campo;
	}

	public function set($valor, $nome_campo) {
		$this->$nome_campo = $valor;
	}

	public function check($nome_campo) {
		return isset($this->$nome_campo);
	}

	public function push($valor, $nome_campo) {
		if (gettype($this->$nome_campo) == "array") array_push($this->$nome_campo, $valor);
	}

	public function removeQuebra($tipo, $valor) {
							$valor = 	str_replace("\"", '\'',
										str_replace("\r", '', $valor));
		if($tipo == 'html') return 		str_replace("\t", '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
										str_replace("\n", '<br>', $valor));
		else 				return 		str_replace("\t", ' ',
										str_replace("\n", '', $valor));
	}

	public function setOptions($option=array()) {
		foreach ($option as $key => $value) {
			$this->$key = $value;
		}
	}
}

class Dir extends PadraoObjeto {
	var $name;
	var $branchs = array();
	var $isFile = false;

	function __construct($name) {
		$this->name = $name;
	}
}

class File extends PadraoObjeto {
	var $name;
	var $path;
	var $dateCriation;
	var $isFile = true;
	var $ext;
	var $height;
	var $width;

	function __construct($name, $path) {
		$this->name = $name;
		$this->path = $path;
	}
}

function createFile($name, $ctx) {
	// Criar o diretório onde vai o arquivo
	$path = explode('/', $name);
	array_splice($path, sizeof($path)-1, 1);
	resolvPath(implode('/', $path));

	// Criar arquivo
	$myfile = fopen($name, "w") or die("Unable to open file!");
	fwrite($myfile, $ctx);
	fclose($myfile);
	return 1;
}

function ctxFile($file) {
	if (!is_file($file)) return '';
	$myfile = fopen($file, "r") or die("Unable to open file!");
	$ctx = fread($myfile,filesize($file));
	fclose($myfile);
	return $ctx;
}

function copyFile($origin, $dist) {
	$file = ctxFile($origin);
	return createFile($dist, $file);
}

function getObjFile($file,$path) {
	$filObj = new File($file, $path.'/'.$file);
	$filObj->set(date('Y-m-d H:i:s', filemtime($path.'/'.$file)), 'dateCriation');
	return $filObj;
}

function listDir($path) {
	$dir = new Dir($path);
	if (is_dir($path)) {
		$diretorio = dir($path);
		while ($file = $diretorio->read()) {
			if ($file != '.' && $file != '..') {
				if (is_dir($path.'/'.$file)) {
					$dir->push(listDir($path.'/'.$file), 'branchs');
				} else {
					$ext = explode('.', $file);
					array_splice($ext, 0,-1);
					$ext = implode('', $ext);

					$filObj = getObjFile($file,$path);

					$extsImgs = explode(',','PNG,JPG,TIFF,JPEG,BMP,PSD,EXIF,RAW,PDF,WEBP,GIF,EPS,SVG');
					if (in_array(strtoupper($ext), $extsImgs) && $size = getimagesize($path.'/'.$file)) {
						list($width, $height) = $size;
						$filObj->set($height, 'height');
						$filObj->set($width, 'width');
					}
					$filObj->set($ext, 'ext');
					$dir->push($filObj, 'branchs');
				}
			}
		}
	} else {
		$dir->set('Not Dir', 'name');
	}
	return $dir;
}

function copyDir($dirOrigin, $dirDist) {
	if (is_dir($dirOrigin)) {
		if (!is_dir($dirDist)) mkdir($dirDist);

		$objects = scandir($dirOrigin);
		foreach ($objects as $object) {
			if ($object != '.' && $object != '..') {
				if (is_dir($dirOrigin . DIRECTORY_SEPARATOR . $object)) {
					mkdir($dirDist . DIRECTORY_SEPARATOR . $object);
					copyDir(
						$dirOrigin . DIRECTORY_SEPARATOR . $object,
						$dirDist . DIRECTORY_SEPARATOR . $object
					);
				} else if (is_file($dirOrigin . DIRECTORY_SEPARATOR . $object)) {
					copyFile(
						$dirOrigin . DIRECTORY_SEPARATOR . $object,
						$dirDist . DIRECTORY_SEPARATOR . $object
					);
				}
			}
		}
	}
}

function removeDir($dir) {
	if (is_dir($dir)) {
		$objects = scandir($dir);
		foreach ($objects as $object) {
			if ($object != '.' && $object != '..') {
				if (is_dir($dir . DIRECTORY_SEPARATOR . $object)) {
					removeDir($dir . DIRECTORY_SEPARATOR . $object);
				} else if (is_file($dir . DIRECTORY_SEPARATOR . $object)) {
					if (!unlink($dir . DIRECTORY_SEPARATOR . $object)) {
						// code in case the file was not removed
					}
					// wait a bit here?
				} else {
					// code for debug file permission issues
				}
			}
		}
		reset($objects);
		rmdir($dir);
	}
}

function deleteFile($file) {
	if (!is_file($file)) return '';
	return unlink($file);
}

function setTextInFile($path, $text, $start, $end) {
	$file = ctxFile($path);
	$file = explode($start, $file);
	$pre = $file[0];
	$file = explode($end, $file[1]);
	$pos = $file[1];
	$file = $pre . $start . $text . $end . $pos;
	deleteFile($path);
	createFile($path, $file);
}

function getTextInFile($path, $start, $end) {
	$file = ctxFile($path);
	$file = explode($start, $file);
	$text = $file[1];
	$file = explode($end, $text);
	$text = $file[0];
	return $text;
}

function resolvPath($path, $createPath=true) {
	$path = explode('/', $path);
	$pathNew = '';
	for ($i = 0; $i < sizeof($path); $i++) {
		$pathNew .= ($i == 0 ? '' : '/') . $path[$i];
		if ($path[$i] != '.' && $path[$i] != '..' && $path[$i] != ''
			&& !is_dir($pathNew) && $createPath
			&& !is_file($pathNew)
		) {
			mkdir($pathNew);
		}
	}
	return $pathNew.'/';
}


function toJson($variavel) {
	$resultado = $variavel;
		 if (gettype($variavel) == 'object') $resultado = objectEmJson($variavel);
	else if (gettype($variavel) == 'array' ) $resultado = arrayEmJson($variavel);

	return $resultado;
}

function objectEmJson($objeto) {
	$class_vars = get_class_vars(get_class($objeto));
	$arrayObjeto = array();
	$namesClass = array();

	$indiceVariable = -1;
	foreach ($class_vars as $name => $value) {
		if ($name == 'variable') $indiceVariable = sizeof($namesClass);
		array_push($namesClass, $name);
	}

	if ($indiceVariable != -1) $namesClass = $objeto->get($namesClass[$indiceVariable]);

	for ($i=0; $i < sizeof($namesClass); $i++) {
		array_push($arrayObjeto, $namesClass[$i], $objeto->get($namesClass[$i]));
	}

	$verifica = true;
	$primeiro = true;
	$stringArray = "";
	$preStringArray = "";
	foreach ($arrayObjeto as $key => $value) {
		if ($verifica) {
			if ($primeiro) 	$preStringArray = "{\"".$value."\":";
			else 			$preStringArray = ",\"".$value."\":";
			$verifica = false;
		} else {
			switch (gettype($value)) {
				case 'string':
					$stringArray .= $preStringArray."\"".$value."\"";
					break;
				case 'integer':
					$stringArray .= $preStringArray.$value;
					break;
				case 'double':
					$stringArray .= $preStringArray.$value;
					break;
				case 'floute':
					$stringArray .= $preStringArray.$value;
					break;
				case 'boolean':
					$stringArray .= $value ? $preStringArray."1" : $preStringArray."0";
					break;
				case 'object':
					$stringArray .= $preStringArray.objectEmJson($value);
					break;
				case 'array':
					$stringArray .= $preStringArray.arrayEmJson($value);
					break;
				case 'NULL':
					// $stringArray .= $preStringArray.arrayEmJson($value);
					break;
				default:
					$stringArray .= $preStringArray."\"".$value."\"";
			}
			if (gettype($value) != 'NULL') $primeiro = false;
			$verifica = true;
		}
	}
	return $stringArray."}";
}

function arrayEmJson($array) {
	$stringArray = "[";
	$primeiro = true;

	foreach ($array as $key => $value) {
		switch (gettype($value)) {
			case 'string':
				if ($primeiro) 	$stringArray .= "\"".$value."\"";
				else 			$stringArray .= ",\"".$value."\"";
				break;
			case 'interger':
				if ($primeiro)	$stringArray .= $value;
				else 			$stringArray .= ",".$value;
				break;
			case 'int':
				if ($primeiro)	$stringArray .= $value;
				else 			$stringArray .= ",".$value;
				break;
			case 'double':
				if ($primeiro) 	$stringArray .= $value;
				else 			$stringArray .= ",".$value;
				break;
			case 'float':
				if ($primeiro)	$stringArray .= $value;
				else 			$stringArray .= ",".$value;
				break;
			case 'boolean':
				if ($value)		$value = "1";
				else 			$value = "0";
				if ($primeiro) 	$stringArray .= $value;
				else 			$stringArray .= ",".$value;
				break;
			case 'object':
				if ($primeiro) 	$stringArray .= objectEmJson($value);
				else 			$stringArray .= ",".objectEmJson($value);
				break;
			case 'array':
				if ($primeiro)	$stringArray .= arrayEmJson($value);
				else 			$stringArray .= ",".arrayEmJson($value);
				break;
			default:
				$stringArray .= "\"".$value."\"";
				break;
		}
		$primeiro = false;
	}
	return $stringArray."]";
}

?>