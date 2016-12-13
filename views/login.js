define(['backbone', 'jquery', 'text!templates/login.html'], function (Backbone, $, LoginViewTemplate) {

	// ---

	var LoginViewClass = Backbone.View.extend({
		
		template: LoginViewTemplate,
		initialize: function () {
			console.info("LoginView: ok");
		},
		render: function() {

			var compiledTemplate = _.template(this.template);
			this.$el.html(compiledTemplate({})).localize();
			
		},
		start: function () {
			
			$('#userLogout').addClass('invisible');
			$('#userDesc').addClass('invisible');
			
			$("#loginForm").submit( (e) => {
				e.preventDefault();
				e.stopImmediatePropagation();
				App.User.set('username', document.getElementById("inputLogin").value);
				App.User.set('password', document.getElementById("inputPassword").value);
				App.User.login();
				return false;
			});
			
		}
	});
	
	return LoginViewClass;
	
});