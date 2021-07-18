const $popupModal = $(".popup-modal-container");

$(document).ready(() => {
	$.get("/user/:uuid", data => {
		sessionStorage.setItem('uuid', data);
	});
});

$(window).scroll(() => {
	let fadeInElems = document.getElementsByClassName('fadeIn');
	for (const elem of fadeInElems) {
		if (elem.getBoundingClientRect().top + elem.offsetHeight < window.innerHeight) {
			elem.style.opacity = 1;
		}
	}
});

$(window).on('click', e => {
	if ($popupModal.is(e.target)) {
		$popupModal.css('visibility', 'hidden');
		$popupModal.css('opacity', '0');
		$('nav').removeClass('disabled');
		$('.main-content').removeClass('disabled');
		$('#instructions').removeClass('disabled');
	}
});

function showConsentForm() {
	$popupModal.css('visibility', 'visible');
	$popupModal.css('opacity', '1');
	$('nav').addClass('disabled');
	$('.main-content').addClass('disabled');
	$('#instructions').addClass('disabled');
}

function agree() {
	window.location.href = "/tutorial";
}

function decline() {
	window.location.href = "/declined";
}

function scrollDown() {
	$(document).scrollTop($('#instructions')[0].offsetTop - 80);
}