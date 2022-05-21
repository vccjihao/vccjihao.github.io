$(document).ready(function(){
	$(function(){
		var sticky_navigation = function(){
			var scroll_top = $(window).scrollTop();

			if(scroll_top > 0){
				$('.navbar-inner').css({'background': '#93BFEB none','border-width':'0 0 1px'});
			}
			else{
				$('.navbar-inner').css({'background': 'transparent','border-width':'0 0 0px'});
			}
		};


		$(window).scroll(function(){sticky_navigation();});
	});
});
