
var frasesJson = [];
var permissionsFacebook_Global = [
	'ads_management',
	'business_management',
	'catalog_management',
	'instagram_basic',
	'instagram_content_publish',
	'instagram_shopping_tag_products',
	'pages_show_list',
	'pages_read_engagement',
];
var accessToken_Global = '';
var userID_Global = '';
var endpointFacebook_Global = 'https://graph.facebook.com/v14.0/';
var idPagesFacebook_Global = [];
var igUserIdFacebook_Global = [];
var instagram_Global = [];

function buscarFrase() {
	$.ajax({
		url: './controller.php',
		type: 'POST',
		dataType: 'text',
		data: { 'buscarFrase': true },
		error: function() { alert('Falha ao fazer a requisição!'); },
	}).done(function(data) {
		console.log(data);
		$("#resultado").html(data);
		var frases = document.querySelectorAll('.thought-card');
		for (let i = 0; i < frases.length; i++) {
			frasesJson.push({
				frase: $(frases[i]).find('.frase').html().replace(/<br>/gi, ' '),
				autor: $(frases[i]).find('.autor').find('a').html(),
			});
		}
		console.log(frasesJson);
		buscarFoto(0);
	});
}

function buscarFoto(indice) {
	if (indice >= frasesJson.length) return checkFacebook();
	var search = frasesJson[indice].autor;

	$.ajax({
		url: './controller.php',
		type: 'POST',
		dataType: 'text',
		data: { 'buscarFoto' : true, search },
		error: function() { alert('Falha ao fazer a requisição!'); },
	}).done(function(data) {
		console.log(data);
		$("#resultado").html(data);
		setTimeout(function() {
			frasesJson[indice].img = $(document.querySelectorAll('img')[1]).attr('src');
			$("#resultado").html('<img crossorigin="anonymous" src="' + frasesJson[indice].img + '">');
			setTimeout(function() {
				var base64 = getBase64Image($("#resultado").find('img')[0]);
				$.ajax({
					url: './controller.php',
					type: 'POST',
					dataType: 'text',
					data: { 'salvarFoto' : true, 'nome': search, base64 },
					error: function() { alert('Falha ao fazer a requisição!'); },
				}).done(function(data) {
					console.log(data);
					$("#fotoTemplate")[0].src = './fotos/' + frasesJson[indice].autor + '.png';
					setTimeout(function() {
						montarPost(frasesJson[indice], indice);
					}, 200);
					// buscarFoto(indice+1);
				});
			}, 1000);
		}, 500);
	});
}

function getBase64Image(img) {
	$("#resultado").append('<canvas id="draw" width="100" height="100"></canvas>');
	var canvas = document.getElementById("draw");
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	img.crossOrigin = "anonymous"
	var dataURL = canvas.toDataURL("image/png");
	return dataURL.replace(/^data:image\/(png|jpg|jpge|gif);base64,/, "");
}

function montarPost({ autor, frase }, indice=-1) {
	var canvasPost = document.getElementById('post');
	var ctxPost = canvasPost.getContext("2d");
	var width = canvasPost.width;
	var height = canvasPost.height;
	var lineWidth = 50; // Margin envolta do post
	var background = '#2C3E50';

	var img = $("#fotoTemplate")[0];
	var imgWidth = img.width;
	var imgHeight = img.height;
	var imgWidthNew = 0;
	var imgHeightNew = 0;

	if (imgWidth > imgHeight) {
		imgHeightNew = height;
		imgWidthNew = imgHeightNew * imgWidth / imgHeight;
	} else {
		imgWidthNew = width;
		imgHeightNew = imgWidthNew * imgHeight / imgWidth;
	}

	var widthFrase = (width) - ((width/2) + lineWidth);
	var fontSize = 1;
	var fontFamily = 'Rianty';
	// var fontFamily = 'Hack-Regular';
	// var fontFamily = 'Romanica';
	// var fontFamily = 'New-Athletic-M54';
	// var fontFamily = 'zai_AEGMignonTypewriter1924';
	while (fontSize < 101 && getTextWidth(autor, fontSize + "px " + fontFamily) < widthFrase) fontSize++;
	fontSize--;
	var heightFrase = height-lineWidth-fontSize-20;

	// ctx.drawImage(img, 0, 0, w, h);
	ctxPost.drawImage(img, (width/4) - (imgWidthNew/2), lineWidth/2, imgWidthNew, imgHeightNew-lineWidth);
	// passar a imagem para preto e branco
	var imgPixels = ctxPost.getImageData(0, 0, width, height);
	for (var y = 0; y < imgPixels.height; y++) {
		for (var x = 0; x < imgPixels.width; x++) {
			var i = (y * 4) * imgPixels.width + x * 4;
			var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
			imgPixels.data[i] = avg;
			imgPixels.data[i + 1] = avg;
			imgPixels.data[i + 2] = avg;
		}
	}
	ctxPost.putImageData(imgPixels, 0, 0);

	// console.log('teste')

	ctxPost.beginPath();
	ctxPost.fillStyle = background;
	ctxPost.fillRect(width/2, 0, width, height);
	// ctxPost.rect(width/2, 0, width, height);
	ctxPost.stroke();

	ctxPost.beginPath();
	ctxPost.lineWidth = lineWidth;
	ctxPost.strokeStyle = background;
	ctxPost.moveTo(0, 0);
	ctxPost.lineTo(width, 0);
	ctxPost.lineTo(width, height);
	ctxPost.lineTo(0, height);
	ctxPost.lineTo(0, 0);
	ctxPost.stroke();

	ctxPost.fillStyle = "white";
	ctxPost.font = fontSize + "px " + fontFamily;
	ctxPost.textAlign = 'center';
	ctxPost.fillText(autor, (width/4) * 3, height - lineWidth);

	function formatLinhas(palavras, font, fontFamily, width) {
		var linhas = [''], indice = 0, linhaWidth;
		for (var i = 0; i < palavras.length; i++) {
			linhaWidth = getTextWidth(linhas[indice] + ' ' + palavras[i], font + "px " + fontFamily)
			if (linhaWidth < width || linhas[indice] == '') {
				linhas[indice] += (linhas[indice] == '' ? '' : ' ') + palavras[i]
			} else {
				linhas.push('');
				indice++;
				i--;
			}
		}
		return linhas;
	}

	var fontSizeFrase = 1;
	var fontFamilyFrase = 'Hack-Regular';
	var palavras = frase.replace(/\n/g, '').split(' ');
	var linhasFrase = [];
	do {
		fontSizeFrase++;
		linhasFrase = formatLinhas(palavras, fontSizeFrase, fontFamilyFrase, widthFrase);
	} while(linhasFrase.length * fontSizeFrase < heightFrase);
	fontSizeFrase--;
	linhasFrase = formatLinhas(palavras, fontSizeFrase, fontFamilyFrase, widthFrase);

	var alignText = 'center';
	for (var i = 0; i < linhasFrase.length; i++) {
		ctxPost.fillStyle = "white";
		ctxPost.font = fontSizeFrase + "px " + fontFamilyFrase;
		if (alignText == 'center') {
			// Align center
			ctxPost.textAlign = 'center';
			ctxPost.fillText(linhasFrase[i], (width/4) * 3, (lineWidth/2) + (fontSizeFrase * (i+1)));
		} else {
			// Align left
			ctxPost.textAlign = 'left';
			ctxPost.fillText(linhasFrase[i], (width/2) + (lineWidth/2), (lineWidth/2) + (fontSizeFrase * (i+1)));
		}
	}

	setTimeout(function() {
		$.ajax({
			url: './controller.php',
			type: 'POST',
			dataType: 'text',
			data: {
				'salvarPost' : true,
				'nome': (indice+1) + ' - ' + autor,
				'base64': canvasPost.toDataURL('image/jpg', 1.0).replace(/^data:image\/(png|jpg|jpge|gif);base64,/, ""),
				'ext': 'jpg'
			},
			error: function() { alert('Falha ao fazer a requisição!'); },
		}).done(function(data) {
			console.log(data);
			// montarPost(frasesJson[indice], indice);
			if (indice != -1) buscarFoto(indice+1);
		});
	}, 500);
}

function getTextWidth(text, font) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	context.font = font;
	const metrics = context.measureText(text);
	return metrics.width;
}

function logarFacebook() {
	FB.login(
		function() {
			FB.getLoginStatus(function(response) {
				if (response.status == 'connected') {
					accessToken_Global = 'access_token=' + response.authResponse.accessToken
					userID_Global = response.authResponse.userID
					checkAccounts();
				}
			});
		},
		{ scope: permissionsFacebook_Global, auth_type: 'rerequest' }
	);
}

function checkPermissions() {
	$.ajax({
		url: endpointFacebook_Global + userID_Global + "/permissions?" + accessToken_Global
		, error: function(err) { console.error(err) }
	}).done(function(data) {
		var permissions = data.data
			.filter(function({ status, permission }) {
				return status == "granted" && permissionsFacebook_Global.indexOf(permission) > -1
			})
			.map(function(item) { return item.permission });

		if (permissionsFacebook_Global.length != permissions.length) logarFacebook();
		else checkAccounts();
	});
}

function checkAccounts() {
	$.ajax({
		url: endpointFacebook_Global + userID_Global + "/accounts?" + accessToken_Global
		, error: function(err) { console.error(err) }
	}).done(function(data) {
		idPagesFacebook_Global = data.data.map(function(i) {
			return i.id;
		});
		checkPages(0);
	});
}

function checkPages(indice) {
	if (indice >= idPagesFacebook_Global.length) return checkPagesInstagram(0);

	$.ajax({
		url: endpointFacebook_Global
			+ idPagesFacebook_Global[indice] + "?fields=instagram_business_account&" + accessToken_Global
		, error: function(err) { console.error(err) }
	}).done(function(data) {
		if ((data.instagram_business_account || '') != '') {
			igUserIdFacebook_Global.push(data.instagram_business_account.id);
		}
		checkPages(indice+1);
	});
}

function checkPagesInstagram(indice) {
	if (indice >= igUserIdFacebook_Global.length) return montarTelaPublicar();

	$.ajax({
		url: endpointFacebook_Global
			+ igUserIdFacebook_Global[indice]
			+ "?fields=id,name,followers_count,follows_count,media_count,profile_picture_url,username&"
			+ accessToken_Global
		, error: function(err) { console.error(err) }
	}).done(function(data) {
		instagram_Global.push(data)
		checkPagesInstagram(indice+1);
	});
}

function checkFacebook() {
	$.ajax({
		url: './controller.php',
		type: 'POST',
		dataType: 'text',
		data: { 'buscarConfig': true },
		error: function() { alert('Falha ao fazer a requisição!'); },
	}).done(function(data) {
		if (typeof data == 'string') data = JSON.parse(data);

		window.fbAsyncInit = function() {
			FB.init({
				appId      : data.appFacebookId,
				cookie     : true,
				xfbml      : true,
				version    : data.versionApiFacebook
			});
			FB.AppEvents.logPageView();
			FB.getLoginStatus(function(response) {
				if (response.status != 'connected') return logarFacebook();
				accessToken_Global = 'access_token=' + response.authResponse.accessToken
				userID_Global = response.authResponse.userID
				checkPermissions();
			});
		};

		(function(d, s, id) {
			var js, fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) {return;}
			js = d.createElement(s); js.id = id;
			js.src = "https://connect.facebook.net/en_US/sdk.js";
			fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'));
	});
}

function montarTelaPublicar() {
	$.ajax({
		url: './controller.php',
		type: 'POST',
		dataType: 'text',
		data: { 'listarPosts': true },
		error: function(err) { console.log(err); },
	}).done(function(data) {
		console.log(data);
		if (typeof data == 'string') data = JSON.parse(data);
		console.log(data);

		$("#workspace").css('display', 'none');
		$("#preview").css('display', 'block');

		$("#listPub").html(''
			+ 	'<table class="table">'
			+ 		'<tr>'
			+ 	data.branchs
					.filter(function(file) { return file.ext == 'jpg'; })
					.map(function(file, indice) {
						return ''
							+ (indice % 5 == 0 && indice != 0 ? '</tr><tr>' : '')
							+ 	'<td style="padding:0;">'
							+ 		'<img width="190" height="190" src="' + file.path + '">'
							+ 		'<button class="btn btn-primary" onclick="publicarPostInsta(this);">'
							+ 			'Publicar'
							+ 		'</button>'
							+ 	'</td>'
					}).join('')
			+ 		'</tr>'
			+ 	'</table>'
		);

		$("#listInsta").html(''
			+ instagram_Global.map(function(insta, indice) {
				return  ''
					+ 	'<center>'
					+ 		"<table style='margin:0;'>"
					+ 			"<tr>"
					+ 				"<td>"
					+ 					"<input name='insta' type='radio'" + (indice == 0 ? ' checked' : '') + ">"
					+ 				"</td>"
					+ 				"<td>"
					+ 					"<img src='" + insta.profile_picture_url + "'"
					+ 						" style='border-radius: 50%;' width='125' height='125'>"
					+ 				"</td>"
					+ 				"<td>"
					+ 					'<h3>@' + insta.username + '</h3>'
					+ 					'<p>' + insta.media_count + ' posts</p>'
					+ 					'<p>' + insta.followers_count + ' seguidores</p>'
					+ 					'<p>' + insta.follows_count + ' seguindo</p>'
					+ 					'<p><b>' + insta.name + '</b></p>'
					+ 				"</td>"
					+ 			"</tr>"
					+ 		"</table>"
					+ 		"<br>"
					+ 	'</center>'
			}).join('')
		)
	});
}


function publicarPostInsta(btn) {
	var imgUrl = $(btn).parent().find('img').attr('src');
	var endpoint = 'https://smallideasbigprojects.com/gerarpub/';
	var instaEl = document.getElementsByName('insta');
	var instaSelected = {};

	for (var i = 0; i < instaEl.length; i++) {
		if (instaEl[i].checked) instaSelected = instagram_Global[i];
	}

	$.ajax({
		url: endpointFacebook_Global + instaSelected.id
			+ '/media'
			+ '?image_url=' + endpoint + imgUrl + '&caption=%23pensador%23filosofia%23fly&'
			+ accessToken_Global,
		type: 'POST',
		error: function(err) { console.error(err) },
	}).done(function(data) {
		console.log(data);
		try {
			if (typeof data == 'string') data = JSON.parse(data);
		} catch(err) { console.error(err); }
		if ((data.id || '') != '') {
			$.ajax({
				url: endpointFacebook_Global + instaSelected.id
					+ '/media_publish'
					+ '?creation_id=' + data.id + '&'
					+ accessToken_Global,
				type: 'POST',
				error: function(err) { console.error(err) },
			}).done(function(data) {
				console.log(data);
			});
		}
	})
}
