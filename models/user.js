define(['backbone'], function(Backbone) {

	var User = Backbone.Model.extend({
		url: '/url',
		defaults: {
			status: 1,
			username: '',
			password: '',
			lang: 'en',
			session: ''
		},
		initialize: function(atrributes, options) {
			options || (options = {});
			this.url = options.url;
			this.title = "App/User";
		},
		fetch: function() {

			var session = localStorage.getItem('session');
			console.debug(this.title + ":checking session " + session);
			$.post(this.url, JSON.stringify({
					"op": "isLoggedIn",
					"sid": session
				}))
				.done((answer) => {

					if (answer.status == 0) {
						if (answer.content.status) {
							this.set({
								status: 0,
								session: session
							}, {
								silent: true
							});
						}
					};
					this.trigger('change');

				});
		},
		login: function() {

			$.post(this.url, JSON.stringify({
					"op": "login",
					"user": this.get('username'),
					"password": this.get('password'),
					"sid": false
				}))
				.done((answer) => {

					if (answer.status == 0) {

						this.set({
							status: 0,
							session: answer.content.session_id,
							password: undefined
						}, {
							silent: true
						});

						localStorage.setItem('session', this.get('session'));
						// ---
						this.trigger('change');

					};

				});

		}

	});
	return User;

});
