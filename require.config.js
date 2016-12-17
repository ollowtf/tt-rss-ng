requirejs.config({
	baseUrl: './',
	paths: {
		app: 'app',
		models: 'models',
		collections: 'collections',
		views: 'views',
		routers: 'routers',
		templates: 'templates',
		text: 'lib/text',
		jquery: 'deps/jquery/dist/jquery.min',
		jqUI: 'deps/jquery-ui/jquery-ui.min',
		jqLayout: 'deps/jquery-layout/source/stable/jquery.layout',
		bootstrap: 'deps/bootstrap/dist/js/bootstrap.min',
		marionette: 'deps/backbone.marionette/lib/backbone.marionette.min',
		backbone: 'deps/backbone/backbone-min',
		paginator: 'deps/backbone.paginator/lib/backbone.paginator.min',
		underscore: 'deps/underscore/underscore-min',
		i18next: 'deps/i18next/i18next.min',
		i18nextXHRBackend: 'deps/i18next-xhr-backend/i18nextXHRBackend.min',
		jqueryI18next: 'deps/jquery-i18next/jquery-i18next.min',
		jqueryScrollTo: 'lib/jquery-scrollto'
	},
	shim: {
		bootstrap: {
			deps: ['jquery']
		},
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: ['underscore'],
			exports: 'Backbone'
		},
		paginator: {
			deps: ['backbone']
		},
		marionette: {
			deps: ['backbone'],
			exports: 'Marionette'
		},
		jqLayout: {
			deps: ['jquery', 'jqUI'],
			exports: 'jqLayout'
		},
		jqUI: {
			deps: ['jquery']
		},
		jqueryScrollTo: {
			deps: ['jquery']
		}
	},
	packages: [

	]
});

requirejs(['app']);
