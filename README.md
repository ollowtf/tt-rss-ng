# tt-rss<sub>/ng<sub>
~~NIHS~~ Alternative frontend for [**Tiny Tiny RSS**](https://tt-rss.org/) news feed reader and aggregator.  

## Features
 - 3 available view modes
    - classic inline
    - wide mode
    - thumbnails
 - session settings per feed/group
 - adjustment images for viewport size
 - i18n support
 - speed

 ## Installation

Copy **setting.json.tmpl** to **settings.json** and set API url.

To avoid Cross-Origin errors use mod_rewrite.

I use SSH tunnel to server with tt-rss docker, so my API url

```json
{
	"api": "http://localhost/rss/api/index.php"
}
```

and /etc/httpd/conf.d/rss.conf 

```
RewriteEngine On
RewriteRule /api(.*)$ http://localhost:8280/tt-rss/api/$1 [P,L]
```


## License
Distributed under AGPL-3.0.

Some icons by [Yusuke Kamiyamane](http://p.yusukekamiyamane.com/). Licensed under a [Creative Commons Attribution 3.0 License](http://creativecommons.org/licenses/by/3.0/)
